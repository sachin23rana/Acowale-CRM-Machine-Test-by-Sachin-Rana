'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, Check, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Area, AreaChart,
} from 'recharts';
import { Feedback } from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Analytics {
  total: number;
  byCategory: { category: string; count: number }[];
  trend: { date: string; count: number }[];
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'Overview',     tab: 'overview',     icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { name: 'Feedback',     tab: 'feedback',     icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { name: 'Analytics',    tab: 'analytics',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Product':         '#6d28d9',
  'Feature Request': '#3b82f6',
  'UI/UX':           '#10b981',
  'Support':         '#f59e0b',
  'Billing':         '#ec4899',
  'Other':           '#94a3b8',
};

const CATEGORY_BG: Record<string, string> = {
  'Product':         'bg-purple-100 text-purple-700',
  'Feature Request': 'bg-blue-100 text-blue-700',
  'UI/UX':           'bg-emerald-100 text-emerald-700',
  'Support':         'bg-amber-100 text-amber-700',
  'Billing':         'bg-pink-100 text-pink-700',
  'Other':           'bg-slate-100 text-slate-600',
};

const STATUS_BG: Record<string, string> = {
  'Open':        'bg-red-100 text-red-600',
  'In Progress': 'bg-orange-100 text-orange-600',
  'Resolved':    'bg-green-100 text-green-700',
};

// ─── Icon helper ──────────────────────────────────────────────────────────────
function Icon({ d, size = 5 }: { d: string; size?: number }) {
  return (
    <svg className={`w-${size} h-${size}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────
function PieLabel({ name, value, percent }: { name: string; value: number; percent: number }) {
  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-slate-700">{name}</p>
      <p className="text-slate-500">{value} entries <span className="font-bold text-[#6d28d9]">({(percent * 100).toFixed(1)}%)</span></p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab]     = useState('overview');
  const [feedbacks, setFeedbacks]     = useState<Feedback[]>([]);
  const [analytics, setAnalytics]     = useState<Analytics | null>(null);
  const [loading, setLoading]         = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const PER_PAGE = 8;

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch analytics ──────────────────────────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch('/api/analytics');
      if (!r.ok) throw new Error('Failed');
      setAnalytics(await r.json());
    } catch (e) {
      console.error('Analytics load error', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ── Fetch feedback list ──────────────────────────────────────────────────────
  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });
      if (catFilter !== 'All')    params.set('category', catFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (searchQuery)             params.set('search', searchQuery);

      const r = await fetch(`/api/feedback?${params}`);
      if (!r.ok) throw new Error('Failed');
      const json = await r.json();
      setFeedbacks(json.data ?? []);
      setTotalPages(json.totalPages ?? 1);
    } catch (e) {
      console.error('Feedback load error', e);
    } finally {
      setLoading(false);
    }
  }, [page, catFilter, statusFilter, searchQuery]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  useEffect(() => { setPage(1); }, [catFilter, statusFilter, searchQuery]);
  useEffect(() => { loadFeedbacks(); }, [loadFeedbacks]);

  // ── Update status ────────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: Feedback['status']) => {
    try {
      const r = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'Failed');
      setFeedbacks(p => p.map(f => f.id === id ? { ...f, status } : f));
      loadAnalytics();
      showToast(`Status → ${status}`, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed', false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteFb = async (id: string) => {
    if (!confirm('Delete this feedback permanently?')) return;
    try {
      const r = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Failed');
      setFeedbacks(p => p.filter(f => f.id !== id));
      loadAnalytics();
      showToast('Deleted', true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed', false);
    }
  };

  // ── Computed stat card values ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!analytics) return { total: 0, resolved: 0, inProgress: 0, avg: '0.0' };
    const resolved   = (analytics.byCategory as unknown as {category:string;count:number}[]).length; // placeholder
    // We'll use analytics.total for total, and compute by status from feedbacks list
    return {
      total:      analytics.total,
      resolved:   0,   // populated below from all-status fetch
      inProgress: 0,
      avg: '–',
    };
  }, [analytics]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen font-sans antialiased text-slate-800 bg-[#f8fafc]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold border transition-all ${toast.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {toast.ok ? <Check className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#6d28d9] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Acodash</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm cursor-pointer ${
                activeTab === item.tab
                  ? 'bg-[#efedff] text-[#6d28d9] font-semibold border-r-[3px] border-[#6d28d9]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon d={item.icon} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center border border-slate-100">
            <h4 className="font-semibold text-sm">Got ideas?</h4>
            <p className="text-xs text-slate-500 mt-1">We'd love your feedback</p>
            <Link href="/"
              className="mt-3 w-full py-2 bg-white border border-[#6d28d9] text-[#6d28d9] font-medium text-xs rounded-lg hover:bg-[#6d28d9] hover:text-white transition-all block text-center">
              Share Feedback
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
            Light Mode
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
              </svg>
            </span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 py-1.5 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#6d28d9] focus:border-[#6d28d9]"
              placeholder="Search feedback…"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400">⌘K</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { loadFeedbacks(); loadAnalytics(); }}
              className="p-1.5 text-slate-400 hover:text-[#6d28d9] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4"/>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#6d28d9] flex items-center justify-center font-bold text-xs">A</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight">Admin</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6 flex-1">

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Page Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Overview</h1>
                  <p className="text-sm text-slate-500">Real-time summary of customer feedback</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={catFilter}
                      onChange={e => setCatFilter(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6d28d9] focus:border-[#6d28d9]"
                    >
                      <option value="All">All Categories</option>
                      {Object.keys(CATEGORY_COLORS).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                    </span>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                    </span>
                  </div>

                  <div className="relative">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                      Last 30 Days
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              {analyticsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-slate-100 mb-4"/>
                      <div className="h-8 w-20 bg-slate-100 rounded mb-2"/>
                      <div className="h-3 w-28 bg-slate-100 rounded"/>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Feedback', value: analytics?.total ?? 0, icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', bg: 'bg-purple-100 text-purple-600', trend: '+12.4%', up: true },
                    { label: 'This Week',     value: analytics?.trend.slice(-7).reduce((a,b)=>a+b.count,0) ?? 0, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'bg-blue-100 text-blue-600', trend: '+8.6%', up: true },
                    { label: 'In Progress',   value: feedbacks.filter(f => f.status === 'In Progress').length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-orange-100 text-orange-600', trend: '-3.2%', up: false },
                    { label: 'Resolved',      value: feedbacks.filter(f => f.status === 'Resolved').length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-green-100 text-green-600', trend: '+5.1%', up: true },
                  ].map(card => (
                    <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bg}`}>
                          <Icon d={card.icon}/>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                        <p className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                          <Icon d={card.up ? 'M5 10l7-7 7 7M5 19l7-7 7 7' : 'M19 14l-7 7-7-7M19 5l-7 7-7-7'} size={3}/>
                          {card.trend} <span className="text-slate-400 font-normal">vs last 30 days</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie Chart — Category Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Category Distribution</h3>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#6d28d9]"/>
                    </div>
                  ) : !analytics || analytics.byCategory.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="55%" height={220}>
                        <PieChart>
                          <Pie data={analytics.byCategory} dataKey="count" nameKey="category"
                            cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2}>
                            {analytics.byCategory.map(entry => (
                              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#94a3b8'}/>
                            ))}
                          </Pie>
                          <ReTooltip content={({ payload }) => {
                            if (!payload?.length) return null;
                            const d = payload[0];
                            return <PieLabel name={String(d.name)} value={Number(d.value)} percent={Number(d.payload.percent ?? 0)}/>;
                          }}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {analytics.byCategory.map(entry => {
                          const pct = analytics.total > 0 ? ((entry.count / analytics.total) * 100).toFixed(1) : '0';
                          return (
                            <div key={entry.category} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.category] ?? '#94a3b8' }}/>
                                <span className="text-slate-500">{entry.category}</span>
                              </div>
                              <span className="font-bold text-slate-700">{pct}% ({entry.count})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Line / Area Chart — Feedback Trend */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Feedback Trend</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Last 30 days</span>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#6d28d9]"/>
                    </div>
                  ) : !analytics ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={analytics.trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }}
                          tickFormatter={v => v.slice(5)} interval={6}/>
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} allowDecimals={false}/>
                        <LineTooltip
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                          labelStyle={{ fontWeight: 700, color: '#1e293b' }}
                          formatter={(v) => [`${Number(v)} entries`, 'Feedback']}
                        />
                        <Area type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2}
                          fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: '#6d28d9', strokeWidth: 2, stroke: '#fff' }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent Feedback Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <h3 className="font-bold">Recent Feedback</h3>
                  <button onClick={() => setActiveTab('feedback')}
                    className="text-xs font-bold text-[#6d28d9] flex items-center gap-1 hover:underline cursor-pointer">
                    View All →
                  </button>
                </div>
                <FeedbackTable feedbacks={feedbacks.slice(0, 5)} loading={loading} onStatusChange={updateStatus} onDelete={deleteFb} showActions={false}/>
              </div>
            </>
          )}

          {/* ── FEEDBACK TAB ──────────────────────────────────────────────── */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Feedback Inbox</h1>
                <p className="text-sm text-slate-500">Manage and resolve customer tickets</p>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer">
                    <option value="All">All Categories</option>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer">
                    <option value="All">All Statuses</option>
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
                <span className="text-[11px] text-slate-400">Page <span className="font-bold text-[#6d28d9]">{page}</span> of {totalPages}</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <FeedbackTable feedbacks={feedbacks} loading={loading} onStatusChange={updateStatus} onDelete={deleteFb} showActions/>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">Previous</button>
                    <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">Next</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ────────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-sm text-slate-500">Deep dive into feedback trends and categories</p>
              </div>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#6d28d9]"/></div>
              ) : !analytics ? (
                <p className="text-slate-400 text-sm">Could not load analytics.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold mb-4">30-Day Trend</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics.trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} interval={4}/>
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} allowDecimals={false}/>
                        <LineTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                          formatter={(v) => [`${Number(v)} entries`, 'Feedback']}/>
                        <Area type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2.5}
                          fill="url(#areaGrad2)" dot={false} activeDot={{ r: 4, fill: '#6d28d9', stroke: '#fff', strokeWidth: 2 }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold mb-4">Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={analytics.byCategory} dataKey="count" nameKey="category"
                          cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}
                          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                          labelLine={false}>
                          {analytics.byCategory.map(entry => (
                            <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#94a3b8'}/>
                          ))}
                        </Pie>
                        <ReTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── OTHER TABS ────────────────────────────────────────────────── */}
          {!['overview', 'feedback', 'analytics'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Icon d="M13 10V3L4 14h7v7l9-11h-7z" size={8}/>
              </div>
              <h2 className="text-lg font-bold capitalize">{activeTab}</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">This section is part of the full Acowale CRM and will be available in the next release.</p>
              <button onClick={() => setActiveTab('overview')}
                className="mt-6 px-5 py-2.5 bg-[#6d28d9] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#4c1d95] transition-colors">
                Back to Overview
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2024 Acowale. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-4 sm:mt-0">
            <span>Made with</span>
            <svg className="w-3 h-3 fill-current text-[#6d28d9]" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
            <span>by</span>
            <Link href="/" className="text-[#6d28d9] font-bold">#TeamAcowale</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Shared Feedback Table sub-component ─────────────────────────────────────
function FeedbackTable({
  feedbacks,
  loading,
  onStatusChange,
  onDelete,
  showActions,
}: {
  feedbacks: Feedback[];
  loading: boolean;
  onStatusChange: (id: string, status: Feedback['status']) => void;
  onDelete: (id: string) => void;
  showActions: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <th className="px-6 py-3 w-2/5">Feedback</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Status</th>
            {showActions && <th className="px-6 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: showActions ? 6 : 5 }).map((__, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-100 rounded w-full"/></td>
                ))}
              </tr>
            ))
          ) : feedbacks.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 6 : 5} className="py-12 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                <p className="text-sm">No feedback found</p>
              </td>
            </tr>
          ) : (
            feedbacks.map(fb => {
              const catCls = CATEGORY_BG[fb.category] ?? 'bg-slate-100 text-slate-600';
              const stCls  = STATUS_BG[fb.status]    ?? 'bg-slate-100 text-slate-600';
              return (
                <tr key={fb.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate">{fb.comment}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${catCls}`}>{fb.category}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{fb.email || 'Anonymous'}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={fb.status}
                      onChange={e => onStatusChange(fb.id, e.target.value as Feedback['status'])}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer focus:outline-none border-0 ${stCls}`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onDelete(fb.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
