'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Globe,
  HeartPulse,
  Phone,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface CallAnalytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
}

interface CallRecord {
  call_id: string;
  user_id: string;
  channel: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  outcome: 'successful' | 'failed' | 'ongoing';
  reason?: string;
}

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<CallAnalytics>({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    success_rate: 0,
  });
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalyticsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const [analyticsRes, callsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/calls/recent'),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        throw new Error('Failed to fetch call analytics data.');
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setRecentCalls(callsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching call analytics:', err);
      setError('Analytics are temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Background Glow Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 shadow-lg shadow-cyan-950/50">
              <HeartPulse className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                  MediSathi Call Analytics
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                  Live Metrics
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                Real-time overview of healthcare voice interactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => fetchAnalyticsData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-medium text-slate-900 shadow-md shadow-cyan-950/40 transition hover:bg-cyan-300"
            >
              <ArrowLeft className="size-3.5" />
              Voice Session
            </Link>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Glass Cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Calls */}
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Total Calls
              </span>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-cyan-300">
                {loading ? '...' : analytics.total_calls}
              </span>
              <p className="mt-1 text-xs text-slate-500">Real-time calls recorded in SQLite</p>
            </div>
          </div>

          {/* Card 2: Successful Calls */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                Successful Calls
              </span>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-emerald-400">
                {loading ? '...' : analytics.successful_calls}
              </span>
              <p className="mt-1 text-xs text-emerald-500/80">Useful healthcare outcomes reached</p>
            </div>
          </div>

          {/* Card 3: Failed Calls */}
          <div className="flex flex-col justify-between rounded-2xl border border-rose-500/30 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-rose-300 uppercase">
                Failed Calls
              </span>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400">
                <XCircle className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-rose-400">
                {loading ? '...' : analytics.failed_calls}
              </span>
              <p className="mt-1 text-xs text-rose-500/80">Ended before healthcare outcome</p>
            </div>
          </div>

          {/* Card 4: Success Rate (%) */}
          <div className="flex flex-col justify-between rounded-2xl border border-teal-500/30 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-teal-300 uppercase">
                Success Rate
              </span>
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-2 text-teal-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-teal-300">
                {loading ? '...' : `${analytics.success_rate}%`}
              </span>
              <p className="mt-1 text-xs text-teal-500/80">
                {analytics.total_calls > 0
                  ? 'Calculated from actual database records'
                  : 'No calls recorded yet'}
              </p>
            </div>
          </div>
        </section>

        {/* Recent Calls History */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Recent Calls</h2>
            </div>
            <span className="text-xs text-slate-500">
              Safe Operational Metadata (No Medical Transcripts)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4">Date / Time</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4">Outcome Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto mb-2 size-6 animate-spin text-cyan-400" />
                      Fetching call analytics history...
                    </td>
                  </tr>
                ) : recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No call records found in database yet. Start a browser or SIP voice session to
                      see analytics!
                    </td>
                  </tr>
                ) : (
                  recentCalls.map((c) => (
                    <tr key={c.call_id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-400">
                        {formatTimestamp(c.started_at)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <ChannelBadge channel={c.channel} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {formatDuration(c.duration_seconds)}
                      </td>
                      <td className="px-6 py-4">
                        <OutcomeBadge outcome={c.outcome} />
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-slate-400">
                        {c.reason || 'General health interaction'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-950/40 px-6 py-3 text-xs text-slate-500">
            <span>Showing recent voice interactions</span>
            <span>Auto-refreshing every 5s • Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const isSip = channel.toLowerCase() === 'sip';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
        isSip
          ? 'border border-purple-500/30 bg-purple-500/20 text-purple-300'
          : 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-300'
      }`}
    >
      {isSip ? <Phone className="size-3" /> : <Globe className="size-3" />}
      {isSip ? 'SIP Outbound' : 'Browser'}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const isSuccess = outcome.toLowerCase() === 'successful';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        isSuccess
          ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
          : 'border border-rose-500/40 bg-rose-500/20 text-rose-300'
      }`}
    >
      {isSuccess ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {isSuccess ? 'Successful' : 'Failed'}
    </span>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}
