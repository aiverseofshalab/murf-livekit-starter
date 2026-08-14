'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Filter,
  HeartPulse,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<EscalationRecord | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const [statsRes, listRes] = await Promise.all([
          fetch('/api/escalations/stats'),
          fetch('/api/escalations'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (listRes.ok) {
          const listData = await listRes.json();
          setRecords(listData);
          // If modal is open, update selected record with fresh data from database
          if (selectedRecord) {
            const updatedCurrent = listData.find(
              (r: EscalationRecord) => r.reference_id === selectedRecord.reference_id
            );
            if (updatedCurrent) setSelectedRecord(updatedCurrent);
          }
        }
        setLastRefreshed(new Date());
      } catch (error) {
        console.error('Error fetching escalation dashboard data:', error);
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [selectedRecord]
  );

  // Initial fetch and auto-refresh every 5 seconds
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
        alert('Failed to update status. Please try again.');
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Background Decorative Blur */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation / Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 shadow-lg shadow-cyan-950/50">
              <HeartPulse className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                  MediSathi
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                  Operations
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                Human Escalation Dashboard — Monitor healthcare requests requiring human assistance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              title="Refresh SQLite data"
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

        {/* Statistics Cards Grid */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Escalations */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Total Escalations
              </span>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                <Database className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-50">
                {stats.total}
              </span>
              <p className="mt-1 text-xs text-slate-500">Recorded in SQLite database</p>
            </div>
          </div>

          {/* Card 2: Open Requests */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
                Open Requests
              </span>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-400">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-amber-300">
                {stats.open}
              </span>
              <p className="mt-1 text-xs text-amber-500/80">Awaiting human review</p>
            </div>
          </div>

          {/* Card 3: Urgent / Emergency Requests */}
          <div className="flex flex-col justify-between rounded-2xl border border-rose-500/30 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-rose-300 uppercase">
                Urgent / Emergency
              </span>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400">
                <AlertTriangle className="size-4 animate-bounce" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-rose-400">
                {stats.urgent}
              </span>
              <p className="mt-1 text-xs text-rose-500/80">High urgency or red-flag care</p>
            </div>
          </div>

          {/* Card 4: Resolved Requests */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                Resolved Requests
              </span>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
                {stats.resolved}
              </span>
              <p className="mt-1 text-xs text-emerald-500/80">Completed human support</p>
            </div>
          </div>
        </section>

        {/* Search and Filters Bar */}
        <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Ref ID, name, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pr-4 pl-10 text-sm text-slate-200 placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <Filter className="mr-1 ml-2 size-3.5 text-slate-400" />
            {['all', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? 'border border-cyan-400/30 bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Escalation Request Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4">Reference ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Urgency</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Follow-up</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto mb-2 size-6 animate-spin text-cyan-400" />
                      Loading escalation database...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      No escalation requests found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.reference_id}
                      className="cursor-pointer transition hover:bg-white/[0.02]"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-cyan-300">
                        {r.reference_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {r.name || 'Anonymous'}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge urgency={r.urgency} />
                      </td>
                      <td className="px-6 py-4 text-slate-400">{r.language || 'English'}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {r.preferred_follow_up || 'None'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-400">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-slate-700"
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
          <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-950/40 px-6 py-3 text-xs text-slate-500">
            <span>
              Showing {filteredRecords.length} of {records.length} escalation requests
            </span>
            <span>
              Auto-refreshing every 5s • Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </section>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="grid size-10 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <UserCheck className="size-5" />
              </div>
              <div>
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-50">
                  Request Details
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-950 px-2.5 py-0.5 font-mono text-sm font-semibold text-cyan-300">
                    {selectedRecord.reference_id}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Created at {new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Modal Details Grid */}
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    Caller Name
                  </span>
                  <span className="font-medium text-slate-200">
                    {selectedRecord.name || 'Not provided'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    User / Caller ID
                  </span>
                  <span className="font-mono text-xs break-all text-slate-300">
                    {selectedRecord.user_id}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    Urgency Level
                  </span>
                  <UrgencyBadge urgency={selectedRecord.urgency} />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    Language & Follow-up
                  </span>
                  <span className="text-slate-200">
                    {selectedRecord.language || 'English'} •{' '}
                    {selectedRecord.preferred_follow_up || 'Standard'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    Escalation Reason
                  </span>
                  <p className="font-medium text-slate-200">{selectedRecord.reason}</p>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                    Human-Friendly Summary
                  </span>
                  <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                    {selectedRecord.summary}
                  </p>
                </div>

                {selectedRecord.what_was_checked && (
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                      What Was Checked / Prior Triage
                    </span>
                    <p className="text-xs leading-normal text-slate-400">
                      {selectedRecord.what_was_checked}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Update Control */}
              <div className="border-t border-slate-800 pt-2">
                <span className="mb-3 block text-xs font-semibold text-slate-400 uppercase">
                  Operator Status Control (SQLite Persisted)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedRecord.reference_id, st)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wider uppercase transition ${
                        selectedRecord.status === st
                          ? st === 'open'
                            ? 'bg-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-950/50'
                            : st === 'in_progress'
                              ? 'bg-cyan-500 font-bold text-slate-950 shadow-lg shadow-cyan-950/50'
                              : 'bg-emerald-500 font-bold text-slate-950 shadow-lg shadow-emerald-950/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                  {updatingStatus && <span className="text-xs text-cyan-400">Saving...</span>}
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
        <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-xs font-extrabold text-rose-300">
          <ShieldAlert className="size-3" /> EMERGENCY
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300">
          HIGH
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-300">
          MEDIUM
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          LOW
        </span>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  switch (s) {
    case 'open':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
          OPEN
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-300">
          IN PROGRESS
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          RESOLVED
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">{status}</span>;
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
