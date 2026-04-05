import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, ChevronDown, ChevronRight, Globe, Monitor, Clock, MapPin, Wifi } from 'lucide-react';

interface LoginEvent {
  id: string;
  username: string;
  ip_address: string;
  country: string;
  city: string;
  user_agent: string;
  logged_in_at: string;
}

interface UserLoginGroup {
  username: string;
  events: LoginEvent[];
  lastLogin: string | null;
}

function parseDevice(ua: string): string {
  if (!ua) return 'Unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function parseBrowser(ua: string): string {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  return 'Unknown';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

interface Props {
  filterUsername?: string;
}

export default function LoginActivityViewer({ filterUsername }: Props) {
  const [groups, setGroups] = useState<UserLoginGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [nextRefresh, setNextRefresh] = useState<number>(Date.now() + REFRESH_INTERVAL_MS);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('user_login_events')
      .select('*')
      .order('logged_in_at', { ascending: false });

    if (filterUsername) {
      query = query.eq('username', filterUsername);
    }

    const { data } = await query;
    const events: LoginEvent[] = data || [];

    const map: Record<string, LoginEvent[]> = {};
    for (const e of events) {
      if (!map[e.username]) map[e.username] = [];
      map[e.username].push(e);
    }

    const result: UserLoginGroup[] = Object.entries(map).map(([username, evs]) => ({
      username,
      events: evs,
      lastLogin: evs[0]?.logged_in_at ?? null,
    }));

    result.sort((a, b) => {
      if (!a.lastLogin) return 1;
      if (!b.lastLogin) return -1;
      return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
    });

    setGroups(result);
    setLoading(false);
    setNextRefresh(Date.now() + REFRESH_INTERVAL_MS);
  }, [filterUsername]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, nextRefresh - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextRefresh]);

  function toggleExpanded(username: string) {
    setExpanded((prev) => ({ ...prev, [username]: !prev[username] }));
  }

  const totalEvents = groups.reduce((s, g) => s + g.events.length, 0);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Login Activity</h3>
          {!loading && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {totalEvents} event{totalEvents !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={10} />
            Auto-refresh in {countdown}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh now
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <RefreshCw size={16} className="animate-spin mr-2" />
          <span className="text-xs">Loading activity…</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
          No login events recorded yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {groups.map((group) => (
            <div key={group.username} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggleExpanded(group.username)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                {expanded[group.username]
                  ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                }
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white">{group.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">{group.username}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                    {group.events.length} login{group.events.length !== 1 ? 's' : ''}
                  </span>
                  {group.lastLogin && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(group.lastLogin)}
                    </span>
                  )}
                  {group.events[0]?.country && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {group.events[0].country}
                    </span>
                  )}
                </div>
              </button>

              {expanded[group.username] && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {group.events.map((event) => (
                    <div key={event.id} className="px-4 py-3 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock size={11} className="text-slate-400 shrink-0" />
                          <span>{formatDateTime(event.logged_in_at)}</span>
                          <span className="text-slate-400">({timeAgo(event.logged_in_at)})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Wifi size={11} className="text-slate-400 shrink-0" />
                          <span className="font-mono">{event.ip_address || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span>
                            {[event.city, event.country].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Monitor size={11} className="text-slate-400 shrink-0" />
                          <span>{parseBrowser(event.user_agent)} on {parseDevice(event.user_agent)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
