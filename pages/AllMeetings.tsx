import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types';

type StatusFilter = 'all' | Meeting['status'];
type SourceFilter = 'all' | Meeting['source'];
type DateRangeFilter = 'all' | '7d' | '30d' | '3m';
type SortBy = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

const SOURCE_OPTIONS: Meeting['source'][] = ['Zoom', 'Meet', 'Teams', 'Live', 'Upload', 'In-Person'];
const STATUS_OPTIONS: Meeting['status'][] = ['Done', 'Processing', 'Scheduled'];

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  all: 'All time',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '3m': 'Last 3 months',
};

const SORT_LABELS: Record<SortBy, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title_asc: 'Title A → Z',
  title_desc: 'Title Z → A',
};

const parseDate = (dateStr: string): Date => {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const isWithinRange = (dateStr: string, range: DateRangeFilter): boolean => {
  if (range === 'all') return true;
  const date = parseDate(dateStr);
  const now = new Date();
  const msMap: Record<Exclude<DateRangeFilter, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
  };
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - msMap[range as Exclude<DateRangeFilter, 'all'>]);
  return date >= cutoff;
};

const AllMeetings: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters =
    statusFilter !== 'all' || sourceFilter !== 'all' || dateFilter !== 'all' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFilter('all');
    setSortBy('newest');
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    let pollTimer: number | undefined;

    const loadMeetings = (initial = false) => {
      if (initial) setIsLoadingMeetings(true);
      setMeetingsError(null);
      meetingService
        .listMeetings()
        .then((data) => {
          if (!mounted) return;
          setMeetings(data);
          const hasProcessing = data.some((m) => m.status === 'Processing');
          if (hasProcessing && pollTimer === undefined) {
            pollTimer = window.setInterval(() => loadMeetings(false), 8000);
          }
          if (!hasProcessing && pollTimer !== undefined) {
            window.clearInterval(pollTimer);
            pollTimer = undefined;
          }
        })
        .catch((error) => {
          if (mounted) setMeetingsError(error instanceof Error ? error.message : 'Failed to load meetings');
        })
        .finally(() => {
          if (mounted && initial) setIsLoadingMeetings(false);
        });
    };

    loadMeetings(true);
    return () => {
      mounted = false;
      if (pollTimer !== undefined) window.clearInterval(pollTimer);
    };
  }, []);

  const filteredMeetings = useMemo(() => {
    let result = meetings.filter((m) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.summarySnippet.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q) ||
        m.date.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || m.source === sourceFilter;
      const matchesDate = isWithinRange(m.date, dateFilter);

      return matchesSearch && matchesStatus && matchesSource && matchesDate;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'oldest') return parseDate(a.date).getTime() - parseDate(b.date).getTime();
      return parseDate(b.date).getTime() - parseDate(a.date).getTime(); // newest
    });

    return result;
  }, [meetings, searchTerm, statusFilter, sourceFilter, dateFilter, sortBy]);

  const toggleDropdown = (name: string) =>
    setOpenDropdown((prev) => (prev === name ? null : name));

  const filterButtonClass = (active: boolean) =>
    `whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
      active
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'text-text-muted hover:text-text-main dark:hover:text-white hover:bg-background-light dark:hover:bg-background-dark border-transparent hover:border-border-light dark:hover:border-border-dark'
    }`;

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white mb-2">All Meetings</h1>
          <p className="text-text-muted">
            {isLoadingMeetings ? 'Loading...' : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/meetings/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-bold text-white shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Meeting
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex flex-col gap-3">
        {/* Search row */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-text-main dark:text-white placeholder:text-text-muted transition-all outline-none"
            placeholder="Search by title, keyword, source, or date..."
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter chips row */}
        <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
          {/* Date Range */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('date')}
              className={filterButtonClass(dateFilter !== 'all')}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {dateFilter === 'all' ? 'Date Range' : DATE_RANGE_LABELS[dateFilter]}
              <span className="material-symbols-outlined text-[16px]">{openDropdown === 'date' ? 'expand_less' : 'expand_more'}</span>
            </button>
            {openDropdown === 'date' && (
              <div className="absolute top-full left-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-30 min-w-[160px] py-1 overflow-hidden">
                {(Object.entries(DATE_RANGE_LABELS) as [DateRangeFilter, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setDateFilter(val); setOpenDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${dateFilter === val ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                  >
                    {label}
                    {dateFilter === val && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Source */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('source')}
              className={filterButtonClass(sourceFilter !== 'all')}
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              {sourceFilter === 'all' ? 'Source' : sourceFilter}
              <span className="material-symbols-outlined text-[16px]">{openDropdown === 'source' ? 'expand_less' : 'expand_more'}</span>
            </button>
            {openDropdown === 'source' && (
              <div className="absolute top-full left-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-30 min-w-[150px] py-1 overflow-hidden">
                <button
                  onClick={() => { setSourceFilter('all'); setOpenDropdown(null); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${sourceFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                >
                  All sources
                  {sourceFilter === 'all' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                {SOURCE_OPTIONS.map((src) => (
                  <button
                    key={src}
                    onClick={() => { setSourceFilter(src); setOpenDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${sourceFilter === src ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                  >
                    {src}
                    {sourceFilter === src && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('status')}
              className={filterButtonClass(statusFilter !== 'all')}
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              {statusFilter === 'all' ? 'Status' : statusFilter}
              <span className="material-symbols-outlined text-[16px]">{openDropdown === 'status' ? 'expand_less' : 'expand_more'}</span>
            </button>
            {openDropdown === 'status' && (
              <div className="absolute top-full left-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-30 min-w-[140px] py-1 overflow-hidden">
                <button
                  onClick={() => { setStatusFilter('all'); setOpenDropdown(null); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${statusFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                >
                  All statuses
                  {statusFilter === 'all' && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(st); setOpenDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${statusFilter === st ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                  >
                    {st}
                    {statusFilter === st && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <button
              onClick={() => toggleDropdown('sort')}
              className={filterButtonClass(sortBy !== 'newest')}
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
              {SORT_LABELS[sortBy]}
              <span className="material-symbols-outlined text-[16px]">{openDropdown === 'sort' ? 'expand_less' : 'expand_more'}</span>
            </button>
            {openDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-30 min-w-[170px] py-1 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setSortBy(val); setOpenDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-4 ${sortBy === val ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark'}`}
                  >
                    {label}
                    {sortBy === val && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-2 py-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Clear all
            </button>
          )}
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border-light dark:border-border-dark">
            <span className="text-xs text-text-muted">Active:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')}><span className="material-symbols-outlined text-[12px]">close</span></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
              </span>
            )}
            {sourceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Source: {sourceFilter}
                <button onClick={() => setSourceFilter('all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {DATE_RANGE_LABELS[dateFilter]}
                <button onClick={() => setDateFilter('all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
              </span>
            )}
            <span className="text-xs text-text-muted ml-auto">
              {filteredMeetings.length} result{filteredMeetings.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {meetingsError && (
          <div className="px-6 py-3 text-xs text-red-500 border-b border-border-light dark:border-border-dark">
            {meetingsError}
          </div>
        )}
        {isLoadingMeetings ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <span className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : filteredMeetings.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50">
                    <th className="py-4 pl-6 pr-4 text-xs font-bold uppercase tracking-wider text-text-muted w-[35%]">Title & Summary</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-text-muted w-[15%]">Date</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-text-muted w-[15%]">Source</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-text-muted w-[15%]">Participants</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-text-muted w-[15%]">Status</th>
                    <th className="py-4 pl-4 pr-6 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredMeetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                      className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 pl-6 pr-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{meeting.title}</span>
                          <div className="flex gap-1.5 items-start">
                            <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 shrink-0">auto_awesome</span>
                            <span className="text-xs text-text-muted line-clamp-2 leading-relaxed">{meeting.summarySnippet}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="text-sm text-text-main dark:text-gray-200 font-bold">{meeting.date}</div>
                        <div className="text-xs text-text-muted">{meeting.time}</div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">videocam</span>
                          </div>
                          <span className="text-sm text-text-main dark:text-gray-300 font-medium">{meeting.source}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all">
                          {meeting.participants.slice(0, 3).map((avatar, i) => (
                            <div
                              key={i}
                              className="inline-block size-8 rounded-full ring-2 ring-surface-light dark:ring-surface-dark bg-gray-200 bg-cover bg-center"
                              style={{ backgroundImage: `url("${avatar}")` }}
                            />
                          ))}
                          {meeting.participants.length > 3 && (
                            <div className="inline-block size-8 rounded-full ring-2 ring-surface-light dark:ring-surface-dark bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                              +{meeting.participants.length - 3}
                            </div>
                          )}
                          {meeting.participants.length === 0 && (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          meeting.status === 'Done'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : meeting.status === 'Processing'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            meeting.status === 'Done' ? 'bg-green-500' : meeting.status === 'Processing' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          {meeting.status}
                        </span>
                      </td>
                      <td className="py-4 pl-4 pr-6 align-middle text-right">
                        <button
                          className="p-2 rounded-full hover:bg-background-light dark:hover:bg-gray-700 text-text-muted hover:text-text-main transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto border-t border-border-light dark:border-border-dark bg-background-light/30 dark:bg-background-dark/30 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-text-muted">
                Showing{' '}
                <span className="font-bold text-text-main dark:text-white">{filteredMeetings.length}</span>
                {hasActiveFilters && (
                  <> of <span className="font-bold text-text-main dark:text-white">{meetings.length}</span></>
                )}{' '}
                meeting{filteredMeetings.length !== 1 ? 's' : ''}
              </span>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-sm font-medium text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="bg-background-light dark:bg-background-dark p-6 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-text-muted opacity-50">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">No meetings found</h3>
            <p className="text-text-muted max-w-sm mx-auto text-sm">
              {hasActiveFilters
                ? 'No meetings match your current filters. Try adjusting or clearing them.'
                : 'No meetings yet. Create your first meeting to get started.'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-6 text-primary font-bold hover:underline text-sm">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMeetings;
