import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Globe,
  Orbit,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Radio,
  Compass,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Greetings, Astronomer. This is the Kepler Observatory AI Intelligence Terminal (Team Hack vok · Team 21).

I am directly grounded in the verified archive of 9,201 Kepler Objects of Interest (KOIs) and our 200-estimator Random Forest screening pipeline.

You can ask me to:
• Inspect physical properties of any KOI or confirmed planet (e.g. Kepler-22 b, K01408.01, Kepler-10 b)
• Analyze Random Forest screening priority scores and probability distributions
• Calculate transit depths (ΔF/F ≈ (Rp/R*)²), durations, and orbital mechanics
• Query candidates in the liquid-water habitable temperature zone
• Compare machine learning models (Random Forest 89.84% vs Logistic Regression 81.74%)

Which exoplanetary inquiry shall we compute today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Show me small planet candidates with orbital period > 20 days',
    'Why is K01408.01 rated high screening priority?',
    'Explain how transit depth scales with planet radius',
    'Compare Random Forest vs Logistic Regression model accuracy',
    'Which Kepler candidates are in the habitable temperature zone?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'No response returned from the Kepler intelligence engine.',
        },
      ]);
    } catch (err) {
      console.error('Chat request failed', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while connecting to the assistant. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Session refreshed. Ready for new exoplanet queries.',
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Observatory Communication Station HUD Header */}
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl p-6 shadow-xl border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>OBSERVATORY COMMUNICATION STATION</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>GEMINI RESILIENT ENGINE</span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              Kepler AI Research Communication Console
            </h2>

            <p className="text-xs text-slate-400 font-sans">
              Grounded in NASA Kepler DR25 archive (9,201 KOIs), Random Forest screening outputs, and orbital astrophysics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-lg bg-[#020409]/90 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Suggested Prompt Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-800/70 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-semibold mr-1 uppercase text-[11px]">Recommended Queries:</span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-lg observatory-card-interactive text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-200 transition-all cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Chat Conversation Viewport */}
      <div className="observatory-panel rounded-2xl p-4 sm:p-6 shadow-2xl min-h-[480px] max-h-[640px] overflow-y-auto space-y-5 border border-cyan-500/15">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-sm shadow-cyan-500/20">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap relative group ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-slate-950 font-medium rounded-tr-none shadow-md shadow-cyan-500/10'
                  : 'bg-[#020409]/95 text-slate-200 border border-slate-800 rounded-tl-none font-sans'
              }`}
            >
              {msg.content}

              {/* Copy message button */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopyMessage(msg.content, idx)}
                  className="absolute top-2 right-2 p-1 rounded bg-[#020409] text-slate-400 opacity-0 group-hover:opacity-100 hover:text-cyan-300 transition-opacity cursor-pointer border border-slate-800"
                  title="Copy response"
                >
                  {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#020409]/90 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-400 flex items-center gap-2 font-mono text-xs">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing astrophysical dataset & synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Query Transmission Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Transmit exoplanet inquiry (e.g. K01408.01 screening score, habitable zone criteria, transit physics)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 observatory-input rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-3 observatory-btn-primary font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer font-mono"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">TRANSMIT</span>
        </button>
      </form>
    </div>
  );
};
