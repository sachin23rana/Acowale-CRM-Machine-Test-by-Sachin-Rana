'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Lock, 
  Mail, 
  ChevronDown, 
  Loader2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

type Category = 'Product' | 'Feature Request' | 'UI/UX' | 'Support' | 'Billing' | 'Other';

const CATEGORIES: Category[] = [
  'Product',
  'Feature Request',
  'UI/UX',
  'Support',
  'Billing',
  'Other'
];

interface EmojiOption {
  rating: number;
  emoji: string;
  label: string;
  gradient: string;
  ringColor: string;
}

const EMOJI_RATING_OPTIONS: EmojiOption[] = [
  { 
    rating: 1, 
    emoji: '😢', 
    label: 'Awful', 
    gradient: 'from-rose-400 to-red-500',
    ringColor: 'border-red-500/10'
  },
  { 
    rating: 2, 
    emoji: '🙁', 
    label: 'Bad', 
    gradient: 'from-orange-400 to-amber-500',
    ringColor: 'border-amber-500/10'
  },
  { 
    rating: 3, 
    emoji: '😐', 
    label: 'Medium', 
    gradient: 'from-yellow-400 to-emerald-400',
    ringColor: 'border-emerald-500/10'
  },
  { 
    rating: 4, 
    emoji: '🙂', 
    label: 'Good', 
    gradient: 'from-emerald-400 to-teal-500',
    ringColor: 'border-teal-500/10'
  },
  { 
    rating: 5, 
    emoji: '😍', 
    label: 'Excellent', 
    gradient: 'from-indigo-400 to-purple-500',
    ringColor: 'border-purple-500/10'
  }
];

// Helper to get matching category icon for the dropdown selector
const getCategoryIcon = (cat: Category | '') => {
  switch (cat) {
    case 'Product':
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      );
    case 'Feature Request':
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case 'UI/UX':
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a7 7 0 1 0 10 10" />
        </svg>
      );
    case 'Support':
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'Billing':
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'Other':
    default:
      return (
        <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" x2="12" y1="17" y2="17" />
        </svg>
      );
  }
};

export default function FeedbackSubmissionForm() {
  const [category, setCategory] = useState<Category>('Product');
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(3); // Defaults to Neutral (3)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // UI states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      setComment(text);
      setCharCount(text.length);
    }
  };

  // Email format validator (mirrors server-side rule)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side validation (mirrors server rules exactly) ──────────────
    if (!category) {
      setErrorMessage('Please select a feedback category.');
      setStatus('error');
      return;
    }
    if (!comment || comment.trim().length < 3) {
      setErrorMessage('Please write a feedback comment of at least 3 characters.');
      setStatus('error');
      return;
    }
    if (comment.trim().length > 1000) {
      setErrorMessage('Feedback comment must not exceed 1000 characters.');
      setStatus('error');
      return;
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          comment: comment.trim(),
          email: email.trim() || undefined,
          rating,
        }),
      });

      if (!response.ok) {
        // Show the server's own error message (e.g. rate limit, validation)
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${response.status}).`);
      }

      setStatus('success');
      // Reset form
      setCategory('Product');
      setComment('');
      setEmail('');
      setRating(3);
      setCharCount(0);

      // Return to idle after 5 s
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.error('[FeedbackForm] submit error', err);
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen w-full relative overflow-x-hidden bg-[#f4f3ff] flex flex-col items-center justify-between py-8 px-4 md:px-8 font-sans">
      
      {/* Top Banner Text */}
      <div className="w-full text-center pb-6 z-15">
        <span className="text-xs md:text-sm font-semibold text-slate-500 tracking-wide">
          Anyone can <span className="text-[#6366f1] font-bold">submit feedback</span> in seconds.
        </span>
      </div>

      {/* Header Container */}
      <header className="w-full max-w-[460px] md:max-w-[480px] flex items-center justify-between mb-12 mt-2 z-10">
        <div className="flex items-center gap-2">
          {/* Custom SVG logo matching the hexagon logo in image */}
          <div className="text-[#6366f1]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L20 8V16L12 21L4 16V8L12 3Z" className="opacity-25" />
              <path d="M12 5.2L18.8 9.3V14.7L12 18.8L5.2 14.7V9.3L12 5.2ZM12 8L8.7 10V14L12 16L15.3 14V10L12 8Z" />
            </svg>
          </div>
          <span className="text-[17px] font-extrabold tracking-tight text-[#1e1b4b]">
            Acowale <span className="text-[#6366f1]">Feedback</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/admin"
            className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-500 shadow-sm hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-455" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Form Center Wrapper */}
      <div className="w-full max-w-[460px] md:max-w-[480px] flex flex-col items-center z-10 flex-grow justify-center">
        {/* Title Group */}
        <div className="text-center mt-2 mb-4">
          <h1 className="text-[27px] font-black tracking-tight text-[#1e1b4b] relative inline-block">
            We value <span className="text-[#6366f1]">your feedback</span>
            {/* Sparkle drawing mimicking the mockup sparkles */}
            <span className="absolute -right-7 -top-1.5 text-[#6366f1] text-xl animate-pulse">
              ✨
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Help us improve by sharing your experience.
          </p>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/50"
        >
          {/* Submission Feedback Alert */}
          <AnimatePresence mode="wait">
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center mb-5"
              >
                <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-emerald-800">Feedback Submitted!</h3>
                <p className="text-xs text-emerald-650 mt-0.5">
                  Thank you! Your feedback helps us build a better CRM.
                </p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center mb-4 text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5"
              >
                <span>⚠️ {errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category Dropdown */}
            <div className="relative">
              <label className="block text-[11px] font-extrabold text-slate-800 mb-2 uppercase tracking-wider">
                Select a category <span className="text-rose-500">*</span>
              </label>
              
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-[#fbfbfe] text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Emoji Feedback Selector (Stars / Rating replacement) */}
            <div className="relative">
              <label className="block text-[11px] font-extrabold text-slate-800 mb-4 uppercase tracking-wider">
                How would you rate us? <span className="text-rose-500">*</span>
              </label>

              {/* Emoji Slider Container */}
              <div className="relative flex justify-between items-center px-2 py-3">
                
                {/* Horizontal Wave Background Line */}
                <div className="absolute left-0 right-0 h-[2px] bg-slate-100 z-0" />

                {EMOJI_RATING_OPTIONS.map((opt, idx) => {
                  const isActive = rating === opt.rating;
                  const isHovered = hoveredIndex === idx;
                  
                  return (
                    <div 
                      key={opt.rating} 
                      className="relative z-10 flex flex-col items-center"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Concentric Pulsing rings when Active */}
                      {isActive && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-[84px] h-[84px] border border-emerald-500/10 rounded-full animate-ping duration-1000" />
                          <div className="w-[70px] h-[70px] border border-emerald-500/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          <div className="w-[56px] h-[56px] border border-emerald-500/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      )}

                      {/* Emoji Circular Button */}
                      <button
                        type="button"
                        onClick={() => setRating(opt.rating)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 relative shadow-sm cursor-pointer ${
                          isActive 
                            ? `bg-gradient-to-tr ${opt.gradient} scale-125 border-2 border-white shadow-md shadow-emerald-500/10 z-10` 
                            : 'bg-white hover:bg-slate-50 border border-slate-150 scale-100 hover:scale-110'
                        }`}
                      >
                        <span className={isActive ? 'animate-pulse' : ''}>{opt.emoji}</span>
                      </button>

                      {/* Tooltip underneath the selected emoji (matching image) */}
                      <AnimatePresence>
                        {(isActive || isHovered) && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            className="absolute top-14 bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-md border border-white/5 whitespace-nowrap z-25"
                          >
                            {opt.label}
                            {/* Tiny caret triangle */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-bottom-slate-900" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback Content */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 mb-2 uppercase tracking-wider">
                Your feedback <span className="text-rose-500">*</span>
              </label>
              
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Share your thoughts, suggestions, or issues..."
                  rows={4}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-[#fbfbfe] text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                  {charCount} / 1000
                </span>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-800 mb-2 uppercase tracking-wider">
                Your email (optional)
              </label>
              
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-3.5 h-3.5 text-slate-450" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 bg-[#fbfbfe] text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-0.5">
                We'll never share your email.
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={status === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-75"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 -rotate-45" />
                  Submit Feedback
                </>
              )}
            </motion.button>
          </form>

          {/* Secure Note */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] font-bold text-slate-400">
            <Lock className="w-3.5 h-3.5 text-[#6366f1]" />
            <span>Your feedback is secure and anonymous.</span>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[460px] md:max-w-[480px] text-center mt-12 mb-4 z-10">
        <p className="text-xs font-extrabold text-slate-500">
          Thank you for helping us improve! <span className="text-[#6366f1] animate-pulse">💜</span>
        </p>
        <p className="text-[10px] font-bold text-slate-450 mt-1.5">
          &copy; 2024 Acowale. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
