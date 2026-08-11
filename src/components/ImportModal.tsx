import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';
import { Lead } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLeads: (leads: Omit<Lead, 'id' | 'createdAt'>[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportLeads,
}) => {
  const [parsed, setParsed] = useState<Partial<Lead>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError('');

    try {
      const rows = await parseExcelFile(file);
      setParsed(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsed.length === 0) return;

    const formatted: Omit<Lead, 'id' | 'createdAt'>[] = parsed.map((row) => ({
      businessName: row.businessName || 'Imported Business',
      contactPerson: row.contactPerson || 'Owner',
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '',
      industry: row.industry || 'General Business',
      country: row.country || 'USA',
      score: row.score || 80,
      temperature: (row.temperature as any) || 'WARM',
      contactStatus: (row.contactStatus as any) || 'Not Contacted',
      websiteStatus: row.websiteStatus || 'Needs Audit',
      suggestedService: row.suggestedService || 'Website Redesign',
      auditIssue: row.auditIssue || 'Imported from Excel',
      pitchHook: row.pitchHook || '',
      mobileViewport: false,
      clearCTA: false,
      speedRating: 'Average',
      auditStatus: 'Pending',
    }));

    onImportLeads(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Import Leads from Excel / CSV</h2>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Upload an `.xlsx` or `.csv` spreadsheet containing columns such as Business Name, Contact Person, Email, Website, Industry, Country, Score, etc.
        </p>

        {/* Upload Drop Zone */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-800">
            {fileName ? fileName : 'Click or Drag & Drop Excel/CSV File'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Supports XLSX, XLS, and CSV files</div>
        </div>

        {error && (
          <div className="mt-3 text-xs font-semibold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Preview parsed rows */}
        {parsed.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Successfully parsed {parsed.length} client leads!
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] max-h-36 overflow-y-auto space-y-1 font-mono text-slate-700">
              {parsed.slice(0, 5).map((r, i) => (
                <div key={i} className="truncate">
                  • {r.businessName} ({r.industry} - {r.country})
                </div>
              ))}
              {parsed.length > 5 && (
                <div className="text-slate-400 italic">+ {parsed.length - 5} more rows</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsed.length === 0 || loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition"
          >
            Import {parsed.length > 0 ? `${parsed.length} Leads` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
