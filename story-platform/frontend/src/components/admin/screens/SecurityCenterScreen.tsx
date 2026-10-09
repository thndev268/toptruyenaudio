import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Ban,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Globe,
  User,
  X,
  RefreshCw,
} from 'lucide-react';

interface SecurityStats {
  totalEvents: number;
  highRisk: number;
  criticalRisk: number;
  blockedIps: number;
  failedLogins: number;
  suspiciousIps: number;
  eventsToday: number;
  eventsLast24h: number;
}

interface SecurityEvent {
  id: string;
  title: string;
  type: string;
  status: string;
  severity: string;
  description: string;
  ipAddress: string | null;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  action: string;
  riskLevel: string;
  reason: string | null;
  createdAt: string;
  userAgent: string | null;
  country: string | null;
}

interface SuspiciousIp {
  ip: string;
  eventCount: number;
  highRiskCount: number;
  criticalCount: number;
  lastSeen: string | null;
  blocked: boolean;
  blockedReason: string | null;
  blockedExpiresAt: string | null;
}

export const SecurityCenterScreen: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [topIps, setTopIps] = useState<SuspiciousIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIp, setSelectedIp] = useState<SuspiciousIp | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('24h');
  const [filterRiskLevel, setFilterRiskLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/security-events/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterRiskLevel && { riskLevel: filterRiskLevel }),
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`${API_BASE}/admin/security-events/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchTopIps = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/security-events/top-suspicious-ips?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTopIps(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch top IPs:', error);
    }
  };

  const handleBlockIp = async () => {
    if (!selectedIp || !blockReason.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/security-events/block-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ipAddress: selectedIp.ip,
          reason: blockReason,
          duration: blockDuration === 'permanent' ? null : blockDuration,
        }),
      });

      if (response.ok) {
        setShowBlockModal(false);
        setBlockReason('');
        setSelectedIp(null);
        fetchTopIps();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/security-events/unblock-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ipAddress: ip }),
      });

      if (response.ok) {
        fetchTopIps();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchEvents(), fetchTopIps()]);
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchEvents();
      fetchTopIps();
    }, 30000);

    return () => clearInterval(interval);
  }, [page, filterRiskLevel, searchQuery]);

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            Security Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor security events, suspicious IPs, and manage IP blocks
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchEvents();
            fetchTopIps();
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Activity className="w-4 h-4" />
              Total Events
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              High Risk
            </div>
            <div className="text-2xl font-bold text-white">{stats.highRisk}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <ShieldAlert className="w-4 h-4" />
              Critical
            </div>
            <div className="text-2xl font-bold text-white">{stats.criticalRisk}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-rose-400 text-sm mb-2">
              <Ban className="w-4 h-4" />
              Blocked IPs
            </div>
            <div className="text-2xl font-bold text-white">{stats.blockedIps}</div>
          </div>
        </div>
      )}

      {/* Top Suspicious IPs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Top Suspicious IPs
        </h2>
        <div className="space-y-3">
          {topIps.map((ip) => (
            <div
              key={ip.ip}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white">{ip.ip}</span>
                  {ip.blocked && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                      BLOCKED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {ip.eventCount} events • {ip.highRiskCount} HIGH • {ip.criticalCount} CRITICAL
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ip.blocked ? (
                  <button
                    onClick={() => handleUnblockIp(ip.ip)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Unblock
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedIp(ip);
                      setShowBlockModal(true);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Block
                  </button>
                )}
              </div>
            </div>
          ))}
          {topIps.length === 0 && (
            <div className="text-center text-slate-400 py-8">No suspicious IPs found</div>
          )}
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Security Events
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg w-48"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getRiskBadgeColor(event.riskLevel)}`}>
                      {event.riskLevel}
                    </span>
                    <span className="text-white font-medium">{event.title}</span>
                  </div>
                  <div className="text-sm text-slate-400">{event.reason || event.description}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {event.ipAddress || 'Unknown'}
                    </span>
                    {event.endpoint && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {event.method} {event.endpoint}
                      </span>
                    )}
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center text-slate-400 py-8">No security events found</div>
          )}
        </div>
      </div>

      {/* Block IP Modal */}
      {showBlockModal && selectedIp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Block IP Address</h3>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedIp(null);
                  setBlockReason('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">IP Address</label>
                <div className="font-mono text-white bg-slate-800 p-2 rounded">{selectedIp.ip}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter reason for blocking this IP..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration</label>
                <select
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
                >
                  <option value="1h">1 hour</option>
                  <option value="6h">6 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setSelectedIp(null);
                    setBlockReason('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockIp}
                  disabled={!blockReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Block IP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
