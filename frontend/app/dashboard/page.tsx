'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { CursorLight } from '@/components/app/cursor-light';
import { Navbar } from '@/components/app/navbar';
import type { EscalationRecord } from '@/lib/db';

interface Stats {
  total: number;
  open: number;
  urgent: number;
  resolved: number;
}

export default function EscalationDashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, urgent: 0, resolved: 0 });
  const [records, setRecords] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<EscalationRecord | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setError(null);
      try {
        const [statsRes, listRes] = await Promise.all([
          fetch('/api/escalations/stats'),
          fetch('/api/escalations'),
        ]);

        if (!statsRes.ok || !listRes.ok) {
          throw new Error('Unable to load escalation data.');
        }

        const [statsData, listData] = await Promise.all([statsRes.json(), listRes.json()]);
        setStats(statsData);
        setRecords(listData);
        if (selectedRecord) {
          const updatedCurrent = listData.find(
            (r: EscalationRecord) => r.reference_id === selectedRecord.reference_id
          );
          if (updatedCurrent) setSelectedRecord(updatedCurrent);
        }
        setLastRefreshed(new Date());
      } catch (error) {
        console.error('Error fetching escalation dashboard data:', error);
        setError("We couldn't load human-help requests. Please try again.");
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [selectedRecord]
  );

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateStatus = async (
    referenceId: string,
    newStatus: 'open' | 'in_progress' | 'resolved'
  ) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/escalations/${referenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchData(true);
      } else {
        alert('Failed to update request status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating escalation status:', error);
      alert('Network error while updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.reference_id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

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
                Operations Console
              </h1>
              <span className="rounded-full border border-[#0F766E]/30 bg-[#EEF5F3] px-3 py-0.5 text-xs font-bold text-[#0F766E]">
                Human Escalation
              </span>
            </div>
            <p className="mt-1 text-sm text-[#526B67]">
              Monitor healthcare requests requiring human operator assistance
            </p>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#D6E5E1] bg-[#FFFFFF] px-4 py-2 text-xs font-bold text-[#0F766E] shadow-xs transition hover:bg-[#EEF5F3] disabled:opacity-50 md:self-auto"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Console'}
          </button>
        </div>

        {error && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 p-4 text-sm text-[#DC2626]"
            role="alert"
          >
            <ShieldAlert className="size-5 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Operational Metrics (Open Requests & Urgent Visual Focus) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hero Operational Card: OPEN REQUESTS */}
          <div className="glass-panel-light flex flex-col justify-between rounded-3xl border-y border-r border-l-4 border-[#D6E5E1] border-l-[#D6A756] bg-[#FFFFFF] p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-[#D6A756] uppercase">
                Open Requests
              </span>
              <Clock className="size-5 text-[#D6A756]" />
            </div>
            <div className="mt-4">
              <div className="font-heading text-4xl font-extrabold text-[#134E4A]">
                {loading ? '...' : stats.open}
              </div>
              <p className="mt-1 text-xs text-[#526B67]">Awaiting operator review</p>
            </div>
          </div>

          {/* Hero Operational Card: URGENT / EMERGENCY */}
          <div className="glass-panel-light flex flex-col justify-between rounded-3xl border-y border-r border-l-4 border-[#D6E5E1] border-l-[#DC2626] bg-[#FFFFFF] p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-[#DC2626] uppercase">
                Urgent / Emergency
              </span>
              <AlertTriangle className="size-5 animate-bounce text-[#DC2626]" />
            </div>
            <div className="mt-4">
              <div className="font-heading text-4xl font-extrabold text-[#DC2626]">
                {loading ? '...' : stats.urgent}
              </div>
              <p className="mt-1 text-xs text-[#526B67]">Requires immediate triage</p>
            </div>
          </div>

          {/* Secondary Card: Total Escalations */}
          <div className="glass-card-light flex flex-col justify-between rounded-2xl border border-[#D6E5E1] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#526B67] uppercase">Total Escalations</span>
              <Database className="size-4 text-[#0F766E]" />
            </div>
            <div className="mt-4">
              <div className="font-heading text-3xl font-bold text-[#134E4A]">
                {loading ? '...' : stats.total}
              </div>
              <p className="mt-1 text-xs text-[#829A96]">Recorded in SQLite</p>
            </div>
          </div>

          {/* Secondary Card: Resolved Requests */}
          <div className="glass-card-light flex flex-col justify-between rounded-2xl border-y border-r border-l-4 border-[#D6E5E1] border-l-[#22C55E] bg-[#FFFFFF] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#22C55E] uppercase">Resolved</span>
              <CheckCircle2 className="size-4 text-[#22C55E]" />
            </div>
            <div className="mt-4">
              <div className="font-heading text-3xl font-bold text-[#22C55E]">
                {loading ? '...' : stats.resolved}
              </div>
              <p className="mt-1 text-xs text-[#22C55E]">Completed support</p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#829A96]" />
            <input
              type="text"
              aria-label="Search escalation requests"
              placeholder="Search by Ref ID, caller name, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#D6E5E1] bg-[#FFFFFF] py-2.5 pr-4 pl-10 text-xs text-[#16302D] placeholder-[#829A96] shadow-xs transition focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-1">
            <Filter className="mr-1 ml-2 size-3.5 text-[#829A96]" />
            {['all', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                  statusFilter === st
                    ? 'border border-[#D6E5E1] bg-[#FFFFFF] text-[#0F766E] shadow-xs'
                    : 'text-[#526B67] hover:text-[#16302D]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Escalation Request Table */}
        <section className="glass-panel-light overflow-hidden rounded-2xl border border-[#D6E5E1] bg-[#FFFFFF] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#D6E5E1] bg-[#EEF5F3] text-[11px] font-bold tracking-wider text-[#526B67] uppercase">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5">Caller Name</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Urgency</th>
                  <th className="px-6 py-3.5">Language</th>
                  <th className="px-6 py-3.5">Follow-up</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E5E1] text-[#16302D]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#829A96]">
                      <RefreshCw className="mx-auto mb-2 size-5 animate-spin text-[#0F766E]" />
                      Loading escalation records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#829A96]">
                      <div className="mx-auto max-w-xs space-y-2 py-6">
                        <CheckCircle2 className="mx-auto size-10 text-[#0F766E] opacity-80" />
                        <p className="font-heading text-xl font-bold text-[#134E4A]">
                          Everything is currently under control.
                        </p>
                        <p className="text-xs text-[#829A96]">
                          No open requests requiring immediate operator action.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.reference_id}
                      className="cursor-pointer transition hover:bg-[#EEF5F3]/60"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-[#0F766E]">
                        {r.reference_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#16302D]">
                        {r.name || 'Anonymous'}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge urgency={r.urgency} />
                      </td>
                      <td className="px-6 py-4 text-[#526B67]">{r.language || 'English'}</td>
                      <td className="px-6 py-4 text-[#526B67]">
                        {r.preferred_follow_up || 'Standard'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-[#829A96]">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6E5E1] bg-[#EEF5F3] px-3 py-1.5 text-xs font-bold text-[#0F766E] transition hover:bg-[#FFFFFF]"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#D6E5E1] bg-[#EEF5F3] px-6 py-3 text-xs text-[#829A96]">
            <span>
              Showing {filteredRecords.length} of {records.length} escalation requests
            </span>
            <span>
              Auto-refreshing every 5s • Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </section>
      </main>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
          <div className="glass-panel-light relative my-8 w-full max-w-2xl space-y-6 rounded-3xl border border-[#D6E5E1] bg-[#FFFFFF] p-6 text-left shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 rounded-xl p-2 text-[#829A96] transition hover:bg-[#EEF5F3] hover:text-[#16302D]"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#D6E5E1] pb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-[#0F766E] text-white">
                <UserCheck className="size-5" />
              </div>
              <div>
                <h2 className="font-heading flex items-center gap-3 text-xl font-bold text-[#134E4A]">
                  Escalation Request
                  <span className="rounded-md border border-[#D6E5E1] bg-[#EEF5F3] px-2.5 py-0.5 font-mono text-xs font-bold text-[#0F766E]">
                    {selectedRecord.reference_id}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-[#829A96]">
                  Logged at {new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-3.5">
                  <span className="mb-1 block text-[11px] font-bold text-[#526B67] uppercase">
                    Caller Name
                  </span>
                  <span className="font-semibold text-[#16302D]">
                    {selectedRecord.name || 'Anonymous'}
                  </span>
                </div>

                <div className="rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-3.5">
                  <span className="mb-1 block text-[11px] font-bold text-[#526B67] uppercase">
                    Urgency Level
                  </span>
                  <UrgencyBadge urgency={selectedRecord.urgency} />
                </div>

                <div className="rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-3.5">
                  <span className="mb-1 block text-[11px] font-bold text-[#526B67] uppercase">
                    Language &amp; Preferred Follow-up
                  </span>
                  <span className="text-[#16302D]">
                    {selectedRecord.language || 'English'} •{' '}
                    {selectedRecord.preferred_follow_up || 'Standard'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-4">
                <div>
                  <span className="mb-1 block text-[11px] font-bold text-[#526B67] uppercase">
                    Escalation Reason
                  </span>
                  <p className="font-semibold text-[#16302D]">{selectedRecord.reason}</p>
                </div>

                <div>
                  <span className="mb-1 block text-[11px] font-bold text-[#526B67] uppercase">
                    Human-Friendly Summary
                  </span>
                  <p className="rounded-lg border border-[#D6E5E1] bg-[#FFFFFF] p-3 leading-relaxed whitespace-pre-wrap text-[#526B67]">
                    {selectedRecord.summary}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#D6E5E1] pt-2">
                <span className="mb-3 block text-[11px] font-bold text-[#526B67] uppercase">
                  Operator Status Control (SQLite Persisted)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedRecord.reference_id, st)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition ${
                        selectedRecord.status === st
                          ? st === 'open'
                            ? 'bg-[#D6A756] text-white shadow-md'
                            : st === 'in_progress'
                              ? 'bg-[#0F766E] text-white shadow-md'
                              : 'bg-[#22C55E] text-white shadow-md'
                          : 'border border-[#D6E5E1] bg-[#EEF5F3] text-[#526B67] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                  {updatingStatus && <span className="text-xs text-[#0F766E]">Saving...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const u = urgency.toLowerCase();
  switch (u) {
    case 'emergency':
      return (
        <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/20 px-2.5 py-1 text-xs font-extrabold text-[#DC2626]">
          <ShieldAlert className="size-3" /> 🚨 EMERGENCY
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/40 bg-[#F97316]/20 px-2.5 py-1 text-xs font-bold text-[#F97316]">
          ⚠️ High Priority
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/40 bg-[#EEF5F3] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">
          ! Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6E5E1] bg-[#EEF5F3] px-2.5 py-1 text-xs font-medium text-[#829A96]">
          ● Low
        </span>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  switch (s) {
    case 'open':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6A756]/40 bg-[#D6A756]/15 px-2.5 py-1 text-xs font-bold text-[#D6A756]">
          ● Open
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/40 bg-[#EEF5F3] px-2.5 py-1 text-xs font-bold text-[#0F766E]">
          🔄 In Progress
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 px-2.5 py-1 text-xs font-bold text-[#22C55E]">
          ✓ Resolved
        </span>
      );
    default:
      return <span className="text-xs text-[#829A96]">{status}</span>;
  }
}

function formatDate(isoStr: string): string {
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
