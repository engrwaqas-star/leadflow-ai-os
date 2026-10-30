import * as XLSX from 'xlsx';
import { Lead } from '../types';
import { determineLeadStage } from './leadPipeline';

/**
 * Sanitizes cell values to prevent CSV / Excel Formula Injection (CSV Injection / DDE attack).
 * If a string begins with '=', '+', '-', or '@', it is escaped with a leading single quote.
 */
export function sanitizeCellValue(value: any): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
  ) {
    return `'${value}`;
  }
  return value;
}

/**
 * Maps Lead objects to clean, sanitized row records for spreadsheet export.
 */
export function formatLeadsForExport(leads: any[]): Record<string, any>[] {
  return leads.map((l) => ({
    'Business Name': sanitizeCellValue(l.businessName),
    'Contact Person': sanitizeCellValue(l.contactPerson),
    'Email': sanitizeCellValue(l.email),
    'Phone': sanitizeCellValue(l.phone),
    'Website': sanitizeCellValue(l.website),
    'Address': sanitizeCellValue(l.address || ''),
    'City': sanitizeCellValue(l.city || ''),
    'Country': sanitizeCellValue(l.country || ''),
    'Industry': sanitizeCellValue(l.industry || ''),
    'Source': sanitizeCellValue(l.source || 'SerpApi Google Maps'),
    'Source URL': sanitizeCellValue(l.sourceUrl || l.source_url || l.website || ''),
    'Verification Status': sanitizeCellValue(l.verificationStatus || l.verification_status || 'VERIFIED'),
    'Google Place ID': sanitizeCellValue(l.google_place_id || l.placeId || ''),
    'Rating': l.rating ?? '',
    'Reviews': l.reviews ?? l.review_count ?? '',
    'Pipeline Stage': sanitizeCellValue(determineLeadStage(l)),
    'Strategy': l.leadStrategy === 'AGENCY_PARTNERSHIPS' ? 'Agency Partnership' : 'Direct Client',
    'Score': l.score ?? l.qualificationScore ?? 75,
    'Temperature': l.temperature || 'POTENTIAL',
    'Estimated Budget': sanitizeCellValue(l.estimatedBudget || 'Unverified'),
    'Contact Status': sanitizeCellValue(l.contactStatus || 'Not Contacted'),
    'Audit Status': l.auditStatus || 'Pending',
    'Audit Issue': sanitizeCellValue(l.auditIssue || 'Technical website audit pending live inspection'),
    'Speed Rating': l.speedRating || 'Average',
    'Mobile Viewport': l.mobileViewport ? 'Responsive' : 'Missing',
    'Clear CTA': l.clearCTA ? 'Yes' : 'No',
    'Skill Gaps': sanitizeCellValue(l.skillGaps?.join(', ') || 'None'),
    'Suggested Service': sanitizeCellValue(l.suggestedService || ''),
    'Pitch Hook': sanitizeCellValue(l.pitchHook || ''),
    'Last Contact': sanitizeCellValue(l.lastContactDate || ''),
    'Notes': sanitizeCellValue(l.notes || ''),
  }));
}

export function exportLeadsToExcel(leads: any[], filename = 'LeadFlow_Leads.xlsx') {
  const data = formatLeadsForExport(leads);

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  XLSX.writeFile(workbook, filename);
}

export async function parseExcelFile(file: File): Promise<Partial<Lead>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const mapped: Partial<Lead>[] = json.map(row => ({
          businessName: row['Business Name'] || row['Business'] || row['Company'] || row['Name'] || 'Unnamed Business',
          contactPerson: row['Contact Person'] || row['Contact'] || row['Owner'] || 'Owner',
          email: row['Email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['Mobile'] || '',
          website: row['Website'] || row['URL'] || '',
          industry: row['Industry'] || row['Category'] || 'General Business',
          country: row['Country'] || row['Location'] || 'USA',
          score: Number(row['Score']) || 75,
          temperature: row['Temperature'] || 'WARM',
          contactStatus: row['Contact Status'] || 'Not Contacted',
          websiteStatus: row['Website Status'] || row['Audit Flaw'] || 'Needs Audit',
          suggestedService: row['Suggested Service'] || 'Website Redesign',
          auditIssue: row['Audit Flaw'] || row['Issue'] || 'Outdated website',
          pitchHook: row['Pitch Hook'] || row['Hook'] || '',
          notes: row['Notes'] || ''
        }));
        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
