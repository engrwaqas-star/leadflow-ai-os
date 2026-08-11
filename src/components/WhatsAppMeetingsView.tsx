import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Calendar,
  Clock,
  Video,
  Send,
  Bell,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  User,
  Building2,
  Sparkles,
  Bot,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  CheckCheck,
  Copy,
  Info,
  ShieldCheck,
  Smartphone,
  Share2
} from 'lucide-react';
import { Lead, Meeting, UserProfile } from '../types';

interface WhatsAppMeetingsViewProps {
  meetings: Meeting[];
  leads: Lead[];
  userProfile: UserProfile;
  onScheduleMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  onUpdateMeetingStatus: (meetingId: string, status: 'Scheduled' | 'Completed' | 'Cancelled') => void;
  onMarkClientLinkSent: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => void;
}

export const WhatsAppMeetingsView: React.FC<WhatsAppMeetingsViewProps> = ({
  meetings,
  leads,
  userProfile,
  onScheduleMeeting,
  onUpdateMeetingStatus,
  onMarkClientLinkSent,
  onDeleteMeeting,
}) => {
  const [whatsappPhone, setWhatsappPhone] = useState(userProfile.whatsappNumber || '03075204612');
  const [activeTab, setActiveTab] = useState<'meetings' | 'availability' | 'whatsapp_bot' | 'whatsapp_logs'>('meetings');
  
  // Configured Time Slots State
  const [availableSlots, setAvailableSlots] = useState<string[]>([
    '09:00 AM - 09:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '04:00 PM - 04:30 PM',
    '06:00 PM - 06:30 PM',
  ]);
  const [newSlotInput, setNewSlotInput] = useState('');

  // Meeting Form State
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [meetingTitle, setMeetingTitle] = useState('10-Min Web Performance & Optimization Review');
  const [meetingDate, setMeetingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [meetingTime, setMeetingTime] = useState('15:00');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
  const [notes, setNotes] = useState('Review mobile page speed audit and discuss $450 - $1,400 package options.');

  // Live WhatsApp Log feed state
  const [whatsappLogs, setWhatsappLogs] = useState<{ id: string; time: string; recipient: string; type: string; message: string }[]>([
    {
      id: 'log-w1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipient: '03075204612 (Admin)',
      type: 'Meeting Schedule Alert',
      message: '📲 [LeadFlow AI Alert]: Meeting Scheduled with Freja Lindqvist (Stripe Merchant Solutions) for Today at 3:00 PM. Link: https://meet.google.com/abc-defg-hij'
    }
  ]);

  // Interactive WhatsApp Simulator State
  const [chatMessages, setChatMessages] = useState<{ sender: 'bot' | 'client' | 'user'; text: string; time: string }[]>([
    {
      sender: 'bot',
      text: 'Hi Antoine! 👋 I noticed WordPress Local Business Network’s mobile site takes 4.8s to load. LeadFlow AI can cut that to 1.2s. Would you like to review package options?',
      time: '10:00 AM'
    },
    {
      sender: 'client',
      text: 'Hello! Yes, our mobile traffic is bouncing. What are your prices and can we jump on a quick call?',
      time: '10:02 AM'
    },
    {
      sender: 'bot',
      text: 'Our Core Speed Fix starts at $450 (3-5 days delivery) and full React upgrade is $950 - $1,400. I can schedule a 10-minute demo with Waqas Ashiq!',
      time: '10:03 AM'
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Success Notice
  const [notice, setNotice] = useState<string | null>(null);

  // Check today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysMeetings = meetings.filter((m) => m.meetingDate === todayStr && m.status === 'Scheduled');
  const unsentLinkMeetings = meetings.filter((m) => !m.clientLinkSent && m.status === 'Scheduled');

  const handleCreateMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    if (!lead) return;

    const newMeetingData = {
      leadId: lead.id,
      businessName: lead.businessName,
      contactPerson: lead.contactPerson || 'Client',
      clientEmail: lead.email,
      clientPhone: lead.phone,
      title: meetingTitle,
      meetingDate,
      meetingTime,
      meetingLink: meetingLink || `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`,
      status: 'Scheduled' as const,
      whatsappReminderPhone: whatsappPhone,
      whatsappReminderSent: true,
      clientLinkSent: false,
      notes,
    };

    onScheduleMeeting(newMeetingData);

    // Add WhatsApp Log Alert to 03075204612
    const logMsg = `📲 [WhatsApp Alert Sent to ${whatsappPhone}]: Meeting Scheduled with ${lead.contactPerson} (${lead.businessName}) on ${meetingDate} at ${meetingTime}. Meeting Link: ${newMeetingData.meetingLink}`;
    setWhatsappLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recipient: `${whatsappPhone} (Admin)`,
        type: 'Meeting Created Alert',
        message: logMsg,
      },
      ...prev,
    ]);

    setNotice(`Meeting scheduled! Instant WhatsApp alert dispatched to ${whatsappPhone}.`);
    setIsNewMeetingOpen(false);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSendClientLink = (m: Meeting) => {
    onMarkClientLinkSent(m.id);

    // Send WhatsApp log confirmation
    const clientLog = `📩 [WhatsApp & Email Link Dispatched to Client ${m.contactPerson} (${m.clientEmail})]: "Hi ${m.contactPerson}, here is your meeting link for today's session: ${m.meetingLink}"`;
    const adminLog = `📲 [WhatsApp Alert Sent to ${whatsappPhone}]: Meeting link successfully delivered to client ${m.contactPerson} (${m.businessName}).`;

    setWhatsappLogs((prev) => [
      {
        id: `log-${Date.now()}-1`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recipient: `${m.clientPhone || m.clientEmail} (Client)`,
        type: 'Meeting Link Dispatched',
        message: clientLog,
      },
      {
        id: `log-${Date.now()}-2`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recipient: `${whatsappPhone} (Admin)`,
        type: 'Remind Confirmation',
        message: adminLog,
      },
      ...prev,
    ]);

    setNotice(`Meeting link dispatched to ${m.contactPerson}! Admin confirmation sent to ${whatsappPhone}.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleBotSimulateReply = async () => {
    if (!simInput.trim()) return;
    const userMsgText = simInput;
    setSimInput('');

    const newMsgs = [
      ...chatMessages,
      { sender: 'user' as const, text: userMsgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(newMsgs);
    setIsBotThinking(true);

    try {
      // Simulate or call AI API
      const res = await fetch('/api/ai/inbox-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedReply: { senderName: 'WhatsApp Prospect', businessName: 'Prospect Business', message: userMsgText },
          userProfile,
          strategy: 'call_pitch',
          customNote: 'Convince client on WhatsApp and offer package pricing $450 - $1,400 with a quick 10-min meeting link',
        }),
      });
      const data = await res.json();
      
      const replyContent = data.replyText || "I understand your goals! We specialize in cutting mobile load times to under 1.2s. Our packages range from $450 to $1,400. Would you like to schedule a quick 10-min Google Meet session?";
      
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: replyContent.substring(0, 240) + "...",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "I can help optimize your site speed and convert more mobile visitors. Our package pricing starts at $450. Would 3:00 PM today work for a brief 10-minute demo?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsBotThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            WhatsApp Assistant & Meeting Manager
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-600" /> WhatsApp Direct Active
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Scheduled client meetings, automated day-of WhatsApp reminders to <strong className="text-slate-800">{whatsappPhone}</strong>, and client link dispatcher.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Admin Phone Input */}
          <div className="flex items-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950">
            <span className="text-slate-500 mr-2">Admin WhatsApp:</span>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="bg-white px-2 py-1 border border-emerald-300 rounded font-mono text-emerald-900 focus:outline-none w-32"
              title="WhatsApp phone number for instant meeting alerts & reminders"
            />
          </div>

          <button
            onClick={() => setIsNewMeetingOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule New Meeting
          </button>
        </div>
      </div>

      {/* Notice Bar */}
      {notice && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center text-xs font-bold shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-200 hover:text-white font-extrabold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Day-of-Meeting Alert Banner */}
      {todaysMeetings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between border-b border-amber-400/60 pb-2">
            <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-100 animate-bounce" />
              Day-of-Meeting Alert: {todaysMeetings.length} Meeting(s) Scheduled Today!
            </span>
            <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
              WhatsApp Alert Dispatched to {whatsappPhone}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {todaysMeetings.map((m) => (
              <div key={m.id} className="bg-white/10 backdrop-blur-xs p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{m.businessName} - {m.contactPerson}</span>
                  <span className="text-amber-100 text-[11px]">Time: {m.meetingTime} • Title: {m.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {!m.clientLinkSent ? (
                    <button
                      onClick={() => handleSendClientLink(m)}
                      className="px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-100 font-extrabold text-xs rounded-lg shadow-xs transition flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-700" />
                      Send Meeting Link to Client Now!
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Client Link Sent
                    </span>
                  )}

                  <a
                    href={m.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-400" /> Join Meet
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main View Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduled Meetings ({meetings.length})
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'availability'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Available Time Slots ({availableSlots.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp_bot')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'whatsapp_bot'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          LeadFlow AI WhatsApp Assistant (Simulator)
        </button>

        <button
          onClick={() => setActiveTab('whatsapp_logs')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'whatsapp_logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          WhatsApp Alert Log ({whatsappPhone})
        </button>
      </div>

      {/* TAB 1: SCHEDULED MEETINGS LIST */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Meetings Scheduled Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Schedule a meeting with a high-intent prospect. LeadFlow AI will automatically send an instant alert & day-of reminder to <strong className="text-slate-800">{whatsappPhone}</strong> on WhatsApp.
              </p>
              <button
                onClick={() => setIsNewMeetingOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition"
              >
                + Schedule First Meeting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((m) => {
                const isToday = m.meetingDate === todayStr;
                const isCompleted = m.status === 'Completed';

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl border p-5 space-y-3 shadow-xs transition ${
                      isToday
                        ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/30'
                        : isCompleted
                        ? 'border-slate-200 opacity-75'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-indigo-600 block tracking-wider">
                          {m.businessName}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{m.contactPerson}</h3>
                      </div>

                      {isToday && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{m.meetingDate} at {m.meetingTime}</span>
                      </div>
                      <div className="text-slate-600 truncate">Title: {m.title}</div>
                      <div className="text-slate-500 text-[11px] truncate">Email: {m.clientEmail}</div>
                    </div>

                    {/* Link Dispatch Status */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500">Client Link Status:</span>
                      {m.clientLinkSent ? (
                        <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCheck className="w-3 h-3 text-emerald-600" /> Sent to Client
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendClientLink(m)}
                          className="text-amber-800 font-bold text-[11px] bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded border border-amber-300 transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-amber-700" /> Dispatch Link Now
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Video Call
                      </a>

                      <div className="flex items-center gap-1">
                        {m.status === 'Scheduled' ? (
                          <button
                            onClick={() => onUpdateMeetingStatus(m.id, 'Completed')}
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition"
                            title="Mark Completed"
                          >
                            Done
                          </button>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
                            {m.status}
                          </span>
                        )}

                        <button
                          onClick={() => onDeleteMeeting(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: TIME SLOTS & AVAILABILITY SETTINGS */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" /> Client Meeting Booking Availability
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure time slots offered to clients when booking 10-min performance reviews. Automated WhatsApp alerts will send to <strong className="text-slate-800">{whatsappPhone}</strong> upon booking.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                placeholder="e.g. 05:00 PM - 05:30 PM"
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 sm:w-48"
              />
              <button
                onClick={() => {
                  if (newSlotInput.trim()) {
                    setAvailableSlots((prev) => [...prev, newSlotInput.trim()]);
                    setNewSlotInput('');
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Slot
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableSlots.map((slot, index) => (
              <div
                key={index}
                className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 flex justify-between items-center shadow-2xs hover:border-purple-300 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">{slot}</span>
                    <span className="text-[10px] text-purple-700 font-semibold">Available for Booking</span>
                  </div>
                </div>

                <button
                  onClick={() => setAvailableSlots((prev) => prev.filter((_, i) => i !== index))}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Remove Time Slot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Automated Client Link Generator Safeguard
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              When clients select a slot or book through your link, LeadFlow AI generates a Google Meet link and sends an instant WhatsApp alert to <strong className="text-slate-900">{whatsappPhone}</strong>. If the client does not provide a meeting link, LeadFlow automatically generates one!
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: LEADFLOW AI WHATSAPP CHATBOT SIMULATOR */}
      {activeTab === 'whatsapp_bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="lg:col-span-5 space-y-4 border-r border-slate-200 pr-0 lg:pr-6">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-emerald-600" /> LeadFlow AI WhatsApp Bot
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Automated Prospect Conversations & Meeting Booking
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                LeadFlow AI can converse with prospects on WhatsApp, answer website redesign questions, explain speed bottlenecks, present package pricing ($450 - $1,400), and schedule meetings directly into your CRM!
              </p>
            </div>

            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Integration Guide
              </div>
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                To route LeadFlow AI to your WhatsApp Business number (<strong className="text-slate-900">{whatsappPhone}</strong>), copy your custom webhook API endpoint:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 font-mono text-[11px] text-slate-800 flex justify-between items-center">
                <span className="truncate">https://ai.studio/api/whatsapp/webhook/{whatsappPhone}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://ai.studio/api/whatsapp/webhook/${whatsappPhone}`);
                    setNotice("WhatsApp Webhook URL copied to clipboard!");
                    setTimeout(() => setNotice(null), 3000);
                  }}
                  className="text-emerald-700 hover:text-emerald-950 font-bold p-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Phone Screen Simulator */}
          <div className="lg:col-span-7 bg-slate-900 p-4 rounded-3xl border-4 border-slate-800 max-w-md mx-auto w-full shadow-2xl flex flex-col justify-between h-[520px]">
            {/* Phone Top Header */}
            <div className="bg-emerald-800 p-3 rounded-2xl text-white flex justify-between items-center text-xs border-b border-emerald-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs border border-emerald-400">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <span className="font-bold block">LeadFlow AI Assistant</span>
                  <span className="text-[10px] text-emerald-200">Online • Connected to {whatsappPhone}</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200 font-mono">
                WhatsApp
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs my-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {isBotThinking && (
                <div className="mr-auto bg-slate-800 text-slate-400 p-2.5 rounded-2xl text-[11px] animate-pulse">
                  LeadFlow AI is typing reply...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBotSimulateReply()}
                placeholder="Test client message (e.g. Can I see package prices?)..."
                className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleBotSimulateReply}
                disabled={!simInput.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP ALERT LOGS */}
      {activeTab === 'whatsapp_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" /> WhatsApp Direct Notification Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live log of instant alerts sent to admin WhatsApp (<strong className="text-slate-800">{whatsappPhone}</strong>) and client reminder messages.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {whatsappLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{log.type}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Recipient: {log.recipient}
                    </span>
                  </div>
                  <p className="font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {log.message}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW MEETING MODAL */}
      {isNewMeetingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Schedule Client Meeting
              </h3>
              <button onClick={() => setIsNewMeetingOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeetingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Client / Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.businessName} - {l.contactPerson} ({l.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Available Time Slot</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availableSlots.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Extract time e.g. "09:00 AM" -> "09:00"
                        const timePart = s.split('-')[0].trim();
                        let [h, m] = timePart.split(':');
                        const isPM = timePart.includes('PM');
                        let hourNum = parseInt(h);
                        if (isPM && hourNum < 12) hourNum += 12;
                        if (!isPM && hourNum === 12) hourNum = 0;
                        const formatted = `${hourNum.toString().padStart(2, '0')}:${m.substring(0, 2)}`;
                        setMeetingTime(formatted);
                      }}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[11px] rounded-lg transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Video Meeting Link (Google Meet / Zoom)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomId = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
                      setMeetingLink(`https://meet.google.com/${randomId}`);
                    }}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Auto-Generate Meet Link
                  </button>
                </div>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Agenda</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Automated Reminders:
                </span>
                <p>
                  Instant alert will be sent to <strong className="text-slate-900">{whatsappPhone}</strong>. On the day of the meeting, an automated reminder will prompt you to dispatch the link to the client if not already sent!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
