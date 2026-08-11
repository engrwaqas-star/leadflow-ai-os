import * as XLSX from 'xlsx';
import { Lead } from '../types';

export function exportLeadsToExcel(leads: Lead[], filename = 'LeadFlow_Leads.xlsx') {
  const data = leads.map(l => ({
    'Business Name': l.businessName,
    'Contact Person': l.contactPerson,
    'Email': l.email,
    'Phone': l.phone,
    'Website': l.website,
    'Industry': l.industry,
    'Country': l.country,
    'Score': l.score,
    'Temperature': l.temperature,
    'Contact Status': l.contactStatus,
    'Website Status': l.websiteStatus,
    'Suggested Service': l.suggestedService,
    'Audit Flaw': l.auditIssue,
    'Pitch Hook': l.pitchHook,
    'Last Contact': l.lastContactDate || '',
    'Notes': l.notes || ''
  }));

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
