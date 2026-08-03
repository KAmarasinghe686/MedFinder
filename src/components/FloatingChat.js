import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MapPin, Send, X } from 'lucide-react';
import { askAssistant } from '../api';
import {
  getCurrentBrowserLocation,
  queryNeedsLocation,
} from '../geolocation';

const QUICK_PROMPTS = [
  'Which pharmacies are open now?',
  'Is Paracetamol available?',
  'Find nearest pharmacy',
];

// Strip any leftover markdown asterisks the AI might send
const cleanText = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .trim();

export default function FloatingChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const requestLocation = async () => {
    setLocationStatus('loading');
    setLocationError('');

    try {
      const currentLocation = await getCurrentBrowserLocation();
      setLocation(currentLocation);
      setLocationStatus('ready');
      return currentLocation;
    } catch (error) {
      setLocationStatus('error');
      setLocationError(error.message);
      throw error;
    }
  };

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');

    const nextMessages = [...messages, { role: 'user', content: q }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      let requestCoordinates = location || {};
      if (!location && queryNeedsLocation(q)) {
        requestCoordinates = await requestLocation();
      }

      const res = await askAssistant({
        query: q,
        latitude: requestCoordinates.latitude,
        longitude: requestCoordinates.longitude,
        accuracy: requestCoordinates.accuracy,
        // Send last 4 messages as history so the AI has conversation context
        history: nextMessages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: cleanText(res?.answer || 'No response available.') },
      ]);
    } catch (err) {
      const msg = err?.message || 'Unable to respond right now. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleEnableLocation = async () => {
    try {
      await requestLocation();
    } catch (error) {
      // The actionable permission message is shown above the input.
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">

      {/* ── Chat panel ── */}
      <div
        className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        style={{
          width: 340,
          height: open ? 480 : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'height 0.28s cubic-bezier(.4,0,.2,1), opacity 0.22s ease',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">MedFinder AI</p>
              <p className="mt-0.5 text-[10px] text-emerald-100">Pharmacy assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center pt-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Bot size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">Hi! How can I help?</p>
              <p className="mt-1 text-xs text-slate-500">Ask me about medicines or nearby pharmacies.</p>
              <div className="mt-4 flex w-full flex-col gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-auto rounded-br-sm bg-slate-900 text-white'
                      : 'rounded-bl-sm bg-white text-slate-800 shadow-sm'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-3 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      style={{ animation: `bounce 1s ${d}ms ease-in-out infinite` }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Location status */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2">
          <button
            type="button"
            onClick={handleEnableLocation}
            disabled={locationStatus === 'loading'}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold ${
              location
                ? 'bg-emerald-50 text-emerald-700'
                : locationError
                  ? 'bg-red-50 text-red-700'
                  : 'bg-cyan-50 text-cyan-700'
            }`}
          >
            {locationStatus === 'loading' ? (
              <Loader2 size={12} className="shrink-0 animate-spin" />
            ) : (
              <MapPin size={12} className="shrink-0" />
            )}
            <span className="line-clamp-2">
              {locationStatus === 'loading'
                ? 'Finding your current location...'
                : location
                  ? `Location ready${location.accuracy ? ` • ±${Math.round(location.accuracy)} m` : ''}`
                  : locationError || 'Enable location for nearby pharmacy searches'}
            </span>
          </button>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-slate-100 p-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 focus-within:border-emerald-400 transition">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about medicines…"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Toggle button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50"
      >
        <Bot size={22} className={`transition-all duration-200 ${open ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} style={{ position: 'absolute' }} />
        <X  size={20} className={`transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} style={{ position: 'absolute' }} />

        {/* Unread dot when closed and messages exist */}
        {!open && messages.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </button>
    </div>
  );
}
