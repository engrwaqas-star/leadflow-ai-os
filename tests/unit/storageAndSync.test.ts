import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeForFirestore,
  mergeLeadRecords,
  validateDatabaseIntegrity,
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../../src/utils/storageEngine';
import { Lead } from '../../src/types';

// Mock in-memory localStorage for Node test environment
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (index: number) => Array.from(store.keys())[index] || null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe('Offline-First Storage Engine & Firestore Dual-Mode Sync', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('Firestore Payload Sanitization', () => {
    it('recursively removes undefined fields which Firestore rejects', () => {
      const dirtyPayload = {
        id: 'lead-1',
        businessName: 'Nova Software',
        email: 'info@novasoft.io',
        unverifiedProperty: undefined,
        metadata: {
          tag: 'SaaS',
          missingField: undefined,
          nested: {
            validVal: 42,
            ghostVal: undefined,
          },
        },
      };

      const cleaned = sanitizeForFirestore(dirtyPayload);

      expect(cleaned).toEqual({
        id: 'lead-1',
        businessName: 'Nova Software',
        email: 'info@novasoft.io',
        metadata: {
          tag: 'SaaS',
          nested: {
            validVal: 42,
          },
        },
      });
      expect('unverifiedProperty' in cleaned).toBe(false);
      expect('missingField' in cleaned.metadata).toBe(false);
      expect('ghostVal' in cleaned.metadata.nested).toBe(false);
    });

    it('converts Date instances to ISO strings and NaN to null', () => {
      const now = new Date('2026-10-25T10:00:00.000Z');
      const payload = {
        timestamp: now,
        score: NaN,
        name: 'Valid',
      };

      const cleaned = sanitizeForFirestore(payload);
      expect(cleaned.timestamp).toBe('2026-10-25T10:00:00.000Z');
      expect(cleaned.score).toBeNull();
      expect(cleaned.name).toBe('Valid');
    });

    it('filters undefined elements inside arrays', () => {
      const payload = {
        tags: ['React', undefined, 'TypeScript', undefined],
      };

      const cleaned = sanitizeForFirestore(payload);
      expect(cleaned.tags).toEqual(['React', 'TypeScript']);
    });
  });

  describe('Sync Conflict Resolution (mergeLeadRecords)', () => {
    const baseLead: Lead = {
      id: 'lead-sync-1',
      businessName: 'Aero Dynamics Corp',
      contactPerson: 'Alex Vance',
      email: 'alex@aerodynamics.com',
      phone: '+1 555-0199',
      website: 'https://aerodynamics.com',
      industry: 'Aviation',
      country: 'USA',
      score: 80,
      temperature: 'HOT',
      contactStatus: 'Not Contacted',
      websiteStatus: 'Active',
      suggestedService: 'React Redesign',
      auditIssue: 'Slow speed',
      pitchHook: 'Improve conversions',
      mobileViewport: true,
      clearCTA: true,
      speedRating: 'Fast',
      auditStatus: 'Pending',
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
    };

    it('prefers newer remote update while preserving non-empty local notes and audit details', () => {
      const localRecord: Lead = {
        ...baseLead,
        notes: 'Spoke with gatekeeper, founder is Alex.',
        updatedAt: '2026-10-21T09:00:00.000Z',
      };

      const remoteRecord: Lead = {
        ...baseLead,
        contactStatus: 'Contacted',
        notes: '', // Remote has empty notes
        auditStatus: 'Audited',
        auditDetails: {
          url: 'https://aerodynamics.com',
          cleanUrl: 'https://aerodynamics.com',
          isReachable: true,
          hasSSL: true,
          hasMobileViewport: true,
          hasCTA: true,
          ctaElementsFound: ['Book Demo'],
          hasPhoneLink: false,
          hasEmailLink: true,
          hasContactForm: true,
          detectedTech: ['React'],
          speedRating: 'Fast',
          auditIssues: [],
          technicalStrengths: [],
          findings: [],
          auditedAt: '2026-10-22T10:00:00.000Z',
        },
        updatedAt: '2026-10-22T10:00:00.000Z', // Remote is newer
      };

      const merged = mergeLeadRecords(localRecord, remoteRecord);

      expect(merged.contactStatus).toBe('Contacted'); // From newer remote
      expect(merged.auditStatus).toBe('Audited'); // From remote audit
      expect(merged.auditDetails).toBeDefined();
      expect(merged.notes).toBe('Spoke with gatekeeper, founder is Alex.'); // Preserved from local
    });
  });

  describe('Database Integrity Validator', () => {
    it('gives 100% score for clean verified leads', () => {
      const cleanLeads: Lead[] = [
        {
          id: 'lead-clean-1',
          businessName: 'Apex Health Systems',
          contactPerson: 'Dr. Jane Smith',
          email: 'jane@apexhealth.org',
          phone: '+1 555-0123',
          website: 'https://apexhealth.org',
          industry: 'Healthcare',
          country: 'USA',
          score: 85,
          temperature: 'HOT',
          contactStatus: 'Not Contacted',
          websiteStatus: 'Active',
          suggestedService: 'Speed Optimization',
          auditIssue: 'Slow mobile load time',
          pitchHook: 'Improve booking rate',
          mobileViewport: true,
          clearCTA: true,
          speedRating: 'Fast',
          auditStatus: 'Audited',
          createdAt: new Date().toISOString(),
        },
      ];

      const report = validateDatabaseIntegrity(cleanLeads);
      expect(report.integrityScore).toBe(100);
      expect(report.placeholderRecordsCount).toBe(0);
      expect(report.duplicateGroupsCount).toBe(0);
      expect(report.flaggedLeadIds).toHaveLength(0);
    });

    it('identifies placeholder and duplicate records and flags them', () => {
      const dirtyLeads: Lead[] = [
        {
          id: 'lead-fake-1',
          businessName: 'Unnamed Business',
          contactPerson: 'Unknown',
          email: 'contact@example.com',
          phone: '',
          website: 'https://example.com',
          industry: 'Tech',
          country: 'USA',
          score: 50,
          temperature: 'POTENTIAL',
          contactStatus: 'Not Contacted',
          websiteStatus: 'Unknown',
          suggestedService: 'Redesign',
          auditIssue: 'None',
          pitchHook: 'None',
          mobileViewport: false,
          clearCTA: false,
          speedRating: 'Slow',
          auditStatus: 'Pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'lead-dup-1',
          businessName: 'Vertex AI Corp',
          contactPerson: 'Alice',
          email: 'alice@vertexai.io',
          phone: '555-0001',
          website: 'https://vertexai.io',
          industry: 'AI',
          country: 'USA',
          score: 80,
          temperature: 'HOT',
          contactStatus: 'Not Contacted',
          websiteStatus: 'Active',
          suggestedService: 'Frontend',
          auditIssue: 'Speed',
          pitchHook: 'Hook',
          mobileViewport: true,
          clearCTA: true,
          speedRating: 'Fast',
          auditStatus: 'Audited',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'lead-dup-2',
          businessName: 'Vertex AI Duplicate',
          contactPerson: 'Alice Duplicate',
          email: 'alice@vertexai.io', // Duplicate email!
          phone: '555-0002',
          website: 'https://vertexai.io/pricing', // Same domain!
          industry: 'AI',
          country: 'USA',
          score: 80,
          temperature: 'HOT',
          contactStatus: 'Not Contacted',
          websiteStatus: 'Active',
          suggestedService: 'Frontend',
          auditIssue: 'Speed',
          pitchHook: 'Hook',
          mobileViewport: true,
          clearCTA: true,
          speedRating: 'Fast',
          auditStatus: 'Audited',
          createdAt: new Date().toISOString(),
        },
      ];

      const report = validateDatabaseIntegrity(dirtyLeads);

      expect(report.totalRecords).toBe(3);
      expect(report.placeholderRecordsCount).toBeGreaterThanOrEqual(1);
      expect(report.duplicateGroupsCount).toBeGreaterThanOrEqual(1);
      expect(report.flaggedLeadIds).toContain('lead-fake-1');
      expect(report.flaggedLeadIds).toContain('lead-dup-2');
      expect(report.integrityScore).toBeLessThan(70);
    });
  });

  describe('Safe LocalStorage Utilities', () => {
    it('returns fallback value if key does not exist or JSON is corrupt', () => {
      expect(safeLocalStorageGet('non_existent_key', 'fallback_val')).toBe('fallback_val');

      mockLocalStorage.setItem('corrupt_json_key', '{not_valid_json');
      expect(safeLocalStorageGet('corrupt_json_key', { defaultKey: true })).toEqual({ defaultKey: true });
    });

    it('safely serializes and deserializes objects in local storage', () => {
      const dataToStore = { userId: 'usr-123', settings: { theme: 'dark', quota: 30 } };
      const saved = safeLocalStorageSet('app_settings', dataToStore);
      expect(saved).toBe(true);

      const retrieved = safeLocalStorageGet('app_settings', null);
      expect(retrieved).toEqual(dataToStore);
    });
  });
});
