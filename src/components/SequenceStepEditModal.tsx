import React, { useState } from 'react';
import {
  X,
  Clock,
  Send,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SequenceStep, AutomatedSequence, Lead } from '../types';

interface SequenceStepEditModalProps {
  sequence: AutomatedSequence;
  step: SequenceStep;
  lead?: Lead;
  onClose: () => void;
  onSave: (stepNumber: 1 | 2 | 3, subject: string, body: string, scheduledDate: string) => void;
  onSendNow: (stepNumber: 1 | 2 | 3) => void;
}

export const SequenceStepEditModal: React.FC<SequenceStepEditModalProps> = ({
  sequence,
  step,
  lead,
  onClose,
  onSave,
  onSendNow,
}) => {
  const [subject, setSubject] = useState(step.subject);
  const [body, setBody] = useState(step.body);
  const [scheduledDate, setScheduledDate] = useState(step.scheduledDate);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(step.stepNumber, subject, body, scheduledDate);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Step {step.stepNumber} • Day {step.delayDays} Follow-Up
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Lead: <strong className="text-slate-800">{sequence.businessName}</strong>
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            {step.title}
          </h3>
          <p className="text-xs text-slate-500">
            This follow-up email is scheduled to send automatically {step.delayDays} days after initial contact if {sequence.businessName} remains in &ldquo;Contacted&rdquo; status.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Email Message Body</label>
              <span className="text-[10px] text-slate-400">Personalized problem-trained copy</span>
            </div>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Scheduled Dispatch Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Condition reminder */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Safety Condition:</strong> This email will only be dispatched if the lead contact status is <strong>&ldquo;Contacted&rdquo;</strong> on the scheduled date. If the lead replies or is marked Won/Lost, the sequence automatically halts.
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center border-t border-slate-200 pt-3">
          <button
            onClick={() => {
              if (confirm('Send this sequence step immediately to ' + sequence.email + '?')) {
                onSendNow(step.stepNumber);
                onClose();
              }
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 border border-slate-300"
          >
            <Send className="w-3 h-3 text-indigo-600" />
            Dispatch This Step Now
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved!' : 'Save Step Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
