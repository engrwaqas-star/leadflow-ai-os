import { Lead } from '../types';
import { normalizeDomain } from './leadPipeline';

/**
 * Sanitizes an object before writing to Firebase Firestore.
 * Firestore strictly rejects documents containing `undefined` values.
 * This function recursively removes `undefined` properties, converts `NaN` to `null`,
 * and ensures dates are serialized as ISO strings.
 */
export function sanitizeForFirestore<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'number' && isNaN(obj)) {
      return null as any;
    }
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    }
    cleaned[key] = sanitizeForFirestore(val);
  }

  return cleaned as T;
}

/**
 * Resolves sync conflicts between a local lead record and a remote cloud record.
 * Uses latest `updatedAt` / `createdAt` timestamp, while preserving non-empty
 * notes, audit details, and verified status.
 */
export function mergeLeadRecords(local: Lead, remote: Lead): Lead {
  const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();

  const primary = localTime >= remoteTime ? local : remote;
  const secondary = localTime >= remoteTime ? remote : local;

  return {
    ...secondary,
    ...primary,
    // Preserve audit details if present in either
    auditDetails: primary.auditDetails || secondary.auditDetails,
    auditStatus: primary.auditStatus === 'Audited' ? 'Audited' : secondary.auditStatus,
    // Preserve notes if primary is empty
    notes: primary.notes?.trim() ? primary.notes : secondary.notes,
    // Preserve verified status if either is verified
    verificationStatus: primary.verificationStatus === 'VERIFIED' || secondary.verificationStatus === 'VERIFIED'
      ? 'VERIFIED'
      : primary.verificationStatus,
    updatedAt: new Date(Math.max(localTime, remoteTime, Date.now())).toISOString(),
  };
}

/**
 * Validates the database integrity of a lead list:
 * - Detects placeholder business names, websites, or emails
 * - Identifies duplicate groups by domain or email
 * - Calculates an integrity health score (0 - 100%)
 */
export interface DatabaseIntegrityReport {
  totalRecords: number;
  validRecordsCount: number;
  placeholderRecordsCount: number;
  duplicateGroupsCount: number;
  integrityScore: number; // 0 - 100%
  flaggedLeadIds: string[];
  issues: string[];
}

export function validateDatabaseIntegrity(leads: Lead[]): DatabaseIntegrityReport {
  const flaggedLeadIds = new Set<string>();
  const issues: string[] = [];
  let placeholderCount = 0;

  const seenDomains = new Map<string, string>(); // domain -> leadId
  const seenEmails = new Map<string, string>(); // email -> leadId
  const duplicateLeadIds = new Set<string>();

  leads.forEach((lead) => {
    const name = (lead.businessName || '').toLowerCase().trim();
    const site = (lead.website || '').toLowerCase().trim();
    const email = (lead.email || '').toLowerCase().trim();

    // Check placeholders
    const isPlaceholderName = !name || name.includes('unnamed business') || name.includes('placeholder') || name === 'unknown' || name.length < 2;
    const isPlaceholderSite = site.includes('domain.com') || site.includes('example.com') || site.includes('test.com');
    const isPlaceholderEmail = email.includes('example.com') || email.includes('domain.com') || email === 'not found';

    if (isPlaceholderName || isPlaceholderSite || isPlaceholderEmail) {
      placeholderCount++;
      flaggedLeadIds.add(lead.id);
      if (isPlaceholderName) issues.push(`Lead "${lead.id}": Placeholder business name "${lead.businessName}".`);
      if (isPlaceholderSite) issues.push(`Lead "${lead.id}": Placeholder website "${lead.website}".`);
    }

    // Check duplicates by domain
    if (site && site !== 'not found' && !isPlaceholderSite) {
      const normalized = normalizeDomain(site);
      if (normalized) {
        if (seenDomains.has(normalized)) {
          duplicateLeadIds.add(lead.id);
          flaggedLeadIds.add(lead.id);
        } else {
          seenDomains.set(normalized, lead.id);
        }
      }
    }

    // Check duplicates by email
    if (email && email !== 'not found' && !isPlaceholderEmail && email.includes('@')) {
      if (seenEmails.has(email)) {
        duplicateLeadIds.add(lead.id);
        flaggedLeadIds.add(lead.id);
      } else {
        seenEmails.set(email, lead.id);
      }
    }
  });

  const total = leads.length;
  const validCount = Math.max(0, total - flaggedLeadIds.size);
  const integrityScore = total > 0 ? Math.round((validCount / total) * 100) : 100;

  return {
    totalRecords: total,
    validRecordsCount: validCount,
    placeholderRecordsCount: placeholderCount,
    duplicateGroupsCount: duplicateLeadIds.size,
    integrityScore,
    flaggedLeadIds: Array.from(flaggedLeadIds),
    issues,
  };
}

/**
 * Safe local storage read with JSON parsing & fallback
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return fallback;
  }
}

/**
 * Safe local storage write with quota catch
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error saving localStorage key "${key}":`, e);
    return false;
  }
}
