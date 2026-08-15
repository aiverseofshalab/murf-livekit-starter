'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Phone,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { CursorLight } from '@/components/app/cursor-light';
import { Navbar } from '@/components/app/navbar';

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
        throw new Error('Failed to fetch analytics from backend database.');
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setRecentCalls(callsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching call analytics:', err);
      setError("We couldn't load analytics information right now. Please try again.");
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#F7FAF9] font-sans text-[#16302D] antialiased">
      <CursorLight />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#D6E5E1] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-extrabold text-[#134E4A] sm:text-4xl">
                Call Analytics
              </h1>
              <span className="rounded-full border border-[#0F766E]/30 bg-[#EEF5F3] px-3 py-0.5 text-xs font-bold text-[#0F766E]">
                Real-Time SQLite Data
              </span>
            </div>
            <p className="mt-1 text-sm text-[#526B67]">
              Operational overview of MEDISATHI voice health interactions
            </p>
          </div>

          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#D6E5E1] bg-[#FFFFFF] px-4 py-2 text-xs font-bold text-[#0F766E] shadow-xs transition hover:bg-[#EEF5F3] disabled:opacity-50 md:self-auto"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 p-4 text-sm text-[#DC2626]">
            <AlertCircle className="size-5 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Metric Hierarchy: SUCCESS RATE as Visually Dominant Card */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Dominant Hero Card: SUCCESS RATE */}
          <div className="glass-panel-light relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#D6E5E1] bg-[#FFFFFF] p-7 shadow-xl sm:p-8 lg:col-span-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-[#0F766E]/20 bg-[#EEF5F3] p-2.5 text-[#0F766E] shadow-xs">
                  <TrendingUp className="size-5" />
                </div>
                <span className="text-xs font-extrabold tracking-wider text-[#0F766E] uppercase">
                  Success Rate
                </span>
              </div>
              <span className="text-xs font-semibold text-[#526B67]">
                Primary Operational Metric
              </span>
            </div>

            <div className="my-6 flex items-baseline gap-4">
              <div className="font-heading text-5xl font-extrabold tracking-tight text-[#134E4A] sm:text-6xl">
                {loading ? '...' : `${analytics.success_rate}%`}
              </div>
              <div className="max-w-xs text-xs font-semibold text-[#526B67]">
                {analytics.total_calls > 0
                  ? 'Useful healthcare outcomes achieved in voice interactions'
                  : 'No calls recorded in database yet'}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#D6E5E1] pt-4 text-xs text-[#829A96]">
              <span>Goal: &gt; 70.0% operational target</span>
              <span>Updated automatically</span>
            </div>
          </div>

          {/* Secondary Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-6">
            {/* Card: Total Calls */}
            <div className="glass-card-light flex flex-col justify-between rounded-2xl border border-[#D6E5E1] bg-[#FFFFFF] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#526B67] uppercase">Total Calls</span>
                <Activity className="size-4 text-[#0F766E]" />
              </div>
              <div className="mt-4">
                <div className="font-heading text-3xl font-bold text-[#134E4A]">
                  {loading ? '...' : analytics.total_calls}
                </div>
                <p className="mt-1 text-[11px] text-[#829A96]">Recorded in SQLite</p>
              </div>
            </div>

            {/* Card: Successful Calls */}
            <div className="glass-card-light flex flex-col justify-between rounded-2xl border-y border-r border-l-4 border-[#D6E5E1] border-l-[#22C55E] bg-[#FFFFFF] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#22C55E] uppercase">Completed</span>
                <CheckCircle2 className="size-4 text-[#22C55E]" />
              </div>
              <div className="mt-4">
                <div className="font-heading text-3xl font-bold text-[#22C55E]">
                  {loading ? '...' : analytics.successful_calls}
                </div>
                <p className="mt-1 text-[11px] text-[#526B67]">Useful outcomes</p>
              </div>
            </div>

            {/* Card: Failed Calls */}
            <div className="glass-card-light flex flex-col justify-between rounded-2xl border-y border-r border-l-4 border-[#D6E5E1] border-l-[#D6A756] bg-[#FFFFFF] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D6A756] uppercase">Incomplete</span>
                <XCircle className="size-4 text-[#D6A756]" />
              </div>
              <div className="mt-4">
                <div className="font-heading text-3xl font-bold text-[#D6A756]">
                  {loading ? '...' : analytics.failed_calls}
                </div>
                <p className="mt-1 text-[11px] text-[#829A96]">Ended early</p>
              </div>
            </div>
          </div>
        </section>

        {/* Prominent Privacy Notice Section */}
        <section className="glass-panel-light flex items-start gap-4 rounded-2xl border border-[#D6E5E1] bg-[#FFFFFF] p-5 text-left shadow-xs">
          <div className="shrink-0 rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-2.5 text-[#0F766E]">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#134E4A]">Privacy-Conscious by Design</h3>
            <p className="text-xs leading-relaxed text-[#526B67]">
              Analytics display high-level operational metadata only (timestamps, channel, duration,
              and completion status). Sensitive medical details, PINs, OTPs, and full conversation
              transcripts are never displayed here or stored in analytics logs.
            </p>
          </div>
        </section>

        {/* Recent Voice Interactions Table */}
        <section className="glass-panel-light overflow-hidden rounded-2xl border border-[#D6E5E1] bg-[#FFFFFF] shadow-lg">
          <div className="flex items-center justify-between border-b border-[#D6E5E1] px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#0F766E]" />
              <h2 className="font-heading text-lg font-bold text-[#134E4A]">
                Recent Voice Interactions
              </h2>
            </div>
            <span className="text-xs text-[#829A96]">Operational Metadata</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#D6E5E1] bg-[#EEF5F3] text-[11px] font-bold tracking-wider text-[#526B67] uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date / Time</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Outcome</th>
                  <th className="px-6 py-3.5">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E5E1] text-[#16302D]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#829A96]">
                      <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-[#0F766E]" />
                      Loading call history...
                    </td>
                  </tr>
                ) : recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#829A96]">
                      No call records found in database yet. Start a voice session to generate real
                      metrics!
                    </td>
                  </tr>
                ) : (
                  recentCalls.map((c) => (
                    <tr key={c.call_id} className="transition hover:bg-[#EEF5F3]/60">
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-[#829A96]">
                        {formatTimestamp(c.started_at)}
                      </td>
                      <td className="px-6 py-4">
                        <ChannelBadge channel={c.channel} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-[#16302D]">
                        {formatDuration(c.duration_seconds)}
                      </td>
                      <td className="px-6 py-4">
                        <OutcomeBadge outcome={c.outcome} />
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-[#526B67]">
                        {c.reason || 'General health interaction'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#D6E5E1] bg-[#EEF5F3] px-6 py-3 text-xs text-[#829A96]">
            <span>Showing recent voice calls</span>
            <span>Auto-refreshing every 5s • Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const isSip = channel.toLowerCase() === 'sip';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
        isSip
          ? 'border border-[#D6A756]/40 bg-[#D6A756]/15 text-[#D6A756]'
          : 'border border-[#0F766E]/30 bg-[#EEF5F3] text-[#0F766E]'
      }`}
    >
      {isSip ? <Phone className="size-3" /> : <Globe className="size-3" />}
      {isSip ? 'SIP Outbound' : 'Browser Voice'}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const isSuccess = outcome.toLowerCase() === 'successful';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        isSuccess
          ? 'border border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
          : 'border border-[#829A96]/40 bg-[#EEF5F3] text-[#526B67]'
      }`}
    >
      {isSuccess ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {isSuccess ? 'Completed' : 'Call Not Completed'}
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
