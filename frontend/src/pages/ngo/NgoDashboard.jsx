import { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ShieldAlert, TrendingUp, Users, MapPin, Building, Activity } from 'lucide-react';
import { getNgoDashboardData } from '../../services/analyticsService';
import { acknowledgeAlert, getAlerts, resolveAlert } from '../../services/alertService';
import { formatDate, toSentenceCase } from '../../utils/formatters';
import { extractApiError } from '../../services/api';
import toast from 'react-hot-toast';

// ── Sample data shown when backend returns empty ─────────────────────────────
const SAMPLE_ALERTS = [
  {
    _id: 'sample-alert-1',
    user: { name: 'Amit Kumar', ageGroup: '19-21', organization: { name: 'MindBridge Global NGO', location: 'Bangalore, India' } },
    assessment: { issueCategory: 'academic', intensityLevel: 'high', distressScore: 8.2 },
    type: 'auto_high',
    severity: 'high',
    status: 'active',
    message: 'High academic distress detected.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'sample-alert-2',
    user: { name: 'Priya Sharma', ageGroup: '16-18', organization: { name: 'Sunrise Academy', location: 'Mumbai, India' } },
    assessment: { issueCategory: 'peers', intensityLevel: 'medium', distressScore: 5.1 },
    type: 'sos',
    severity: 'medium',
    status: 'acknowledged',
    message: 'SOS triggered after peer conflict.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const SAMPLE_DASHBOARD = {
  stats: { totalUsers: 24, totalChats: 38, totalSessions: 12, totalInteractions: 50, activeAlerts: 3, resolvedAlerts: 7 },
  alertsTrend: [
    { _id: { date: new Date(Date.now() - 604800000).toISOString().split('T')[0], severity: 'high' }, count: 2 },
    { _id: { date: new Date(Date.now() - 432000000).toISOString().split('T')[0], severity: 'medium' }, count: 3 },
    { _id: { date: new Date(Date.now() - 259200000).toISOString().split('T')[0], severity: 'high' }, count: 1 },
    { _id: { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], severity: 'medium' }, count: 2 },
  ],
};

export default function NgoDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [filters, setFilters] = useState({
    area: 'All',
    org: 'All',
    age: 'All',
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashboardData, alertsData] = await Promise.all([
          getNgoDashboardData(),
          getAlerts(),
        ]);

        const hasData =
          alertsData.length > 0 ||
          (dashboardData.stats && (dashboardData.stats.totalUsers > 0 || dashboardData.stats.totalInteractions > 0));

        if (hasData) {
          setDashboard(dashboardData);
          setAlerts(alertsData);
        } else {
          setUsingSampleData(true);
          setDashboard(SAMPLE_DASHBOARD);
          setAlerts(SAMPLE_ALERTS);
        }
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to load NGO dashboard.'));
        setUsingSampleData(true);
        setDashboard(SAMPLE_DASHBOARD);
        setAlerts(SAMPLE_ALERTS);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleStatusChange = async (alertId, nextStatus) => {
    try {
      if (nextStatus === 'acknowledged') {
        await acknowledgeAlert(alertId);
      } else if (nextStatus === 'resolved') {
        await resolveAlert(alertId, 'Resolved from NGO dashboard.');
      }

      const nextAlerts = await getAlerts();
      setAlerts(nextAlerts);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to update alert status.'));
    }
  };

  const areaOptions = useMemo(() => {
    const uniqueAreas = new Set(alerts.map((alert) => alert.user?.organization?.location).filter(Boolean));
    return ['All', ...Array.from(uniqueAreas)];
  }, [alerts]);

  const organizationOptions = useMemo(() => {
    const uniqueOrganizations = new Set(alerts.map((alert) => alert.user?.organization?.name).filter(Boolean));
    return ['All', ...Array.from(uniqueOrganizations)];
  }, [alerts]);

  const ageOptions = useMemo(() => {
    const uniqueAges = new Set(alerts.map((alert) => alert.user?.ageGroup).filter(Boolean));
    return ['All', ...Array.from(uniqueAges)];
  }, [alerts]);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) => {
        const organization = alert.user?.organization?.name || 'Unknown Organization';
        const area = alert.user?.organization?.location || 'Unknown Area';
        const age = alert.user?.ageGroup || 'Unknown';

        const matchArea = filters.area === 'All' || area === filters.area;
        const matchOrg = filters.org === 'All' || organization === filters.org;
        const matchAge = filters.age === 'All' || age === filters.age;
        return matchArea && matchOrg && matchAge;
      }),
    [alerts, filters]
  );

  const chartData = useMemo(() => {
    const severityMap = { high: 0, medium: 0 };
    const ageMap = {};
    const orgMap = {};

    filteredAlerts.forEach((alert) => {
      const severity = alert.severity || alert.assessment?.intensityLevel || 'medium';
      severityMap[severity] = (severityMap[severity] || 0) + 1;

      const age = alert.user?.ageGroup || 'Unknown';
      ageMap[age] = ageMap[age] || { total: 0, count: 0 };
      ageMap[age].total += alert.assessment?.distressScore || 0;
      ageMap[age].count += 1;

      const organization = alert.user?.organization?.name || 'Unknown';
      orgMap[organization] = (orgMap[organization] || 0) + 1;
    });

    const severityData = Object.entries(severityMap).map(([name, value]) => ({
      name: toSentenceCase(name),
      value,
    }));

    const ageData = Object.entries(ageMap).map(([name, value]) => ({
      name,
      avgDistress: value.count > 0 ? Number((value.total / value.count).toFixed(1)) : 0,
    }));

    const orgData = Object.entries(orgMap).map(([name, total]) => ({
      name,
      total,
    }));

    const alertsTrend = (dashboard?.alertsTrend || []).reduce((accumulator, item) => {
      const existing = accumulator[item._id.date] || {
        date: item._id.date,
        high: 0,
        medium: 0,
      };
      existing[item._id.severity] = item.count;
      accumulator[item._id.date] = existing;
      return accumulator;
    }, {});

    return {
      severityData,
      ageData,
      orgData,
      trendData: Object.values(alertsTrend).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [dashboard?.alertsTrend, filteredAlerts]);

  const kpiStats = useMemo(() => {
    const stats = dashboard?.stats || {};
    return {
      totalUsers: stats.totalUsers || 0,
      totalInteractions: stats.totalInteractions || 0,
      activeAlerts: stats.activeAlerts || 0,
      resolvedAlerts: stats.resolvedAlerts || 0,
      totalAlerts: alerts.length,
    };
  }, [alerts.length, dashboard?.stats]);

  const COLORS = {
    High: '#ef4444',
    Medium: '#f59e0b',
  };

  if (loading) {
    return (
      <div className="p-8 text-white font-semibold flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="bg-background-primary p-3 border border-white/20 rounded-lg shadow-xl text-xs">
        {payload.map((entry) => (
          <p key={`${entry.name}-${entry.value}`} style={{ color: entry.color }} className="font-bold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-12 px-6 pt-6 light-theme min-h-screen">
      {usingSampleData && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <TrendingUp size={16} className="text-accent flex-shrink-0" />
          <p className="text-xs text-accent/80">
            Showing sample data — seed the database for live results.
          </p>
        </div>
      )}

      <div className="flex flex-row justify-between items-end mb-2 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            NGO Oversight Portal <span className="text-2xl">🌐</span>
          </h1>
          <p className="text-white/40 font-semibold uppercase text-xs tracking-widest mt-2">Live backend alert and analytics dashboard</p>
        </div>
        {lastSaved && <span className="text-[10px] uppercase font-bold text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/10 hidden md:block">System Sync: {lastSaved}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Youth Users</span>
          <span className="text-3xl font-bold mt-2 text-white">{kpiStats.totalUsers}</span>
        </div>
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Interactions</span>
          <span className="text-3xl font-bold mt-2 text-blue-400">{kpiStats.totalInteractions}</span>
        </div>
        <div className="bg-yellow-500/10 p-5 rounded-2xl border border-yellow-500/20 flex flex-col justify-between transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/80">Active Alerts</span>
          <span className="text-3xl font-bold mt-2 text-yellow-500">{kpiStats.activeAlerts}</span>
        </div>
        <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 flex flex-col justify-between transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-500/80">Resolved</span>
          <span className="text-3xl font-bold mt-2 text-green-500">{kpiStats.resolvedAlerts}</span>
        </div>
        <div className="bg-accent/10 p-5 rounded-2xl border border-accent/20 flex flex-col justify-between transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">Visible Alerts</span>
          <span className="text-3xl font-bold mt-2 text-accent">{kpiStats.totalAlerts}</span>
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-white/40" />
          <span className="text-[10px] font-bold uppercase text-white/60">Area</span>
          <select
            className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white [&>option]:bg-background-primary focus:outline-none focus:border-accent cursor-pointer"
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
          >
            {areaOptions.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <Building size={16} className="text-white/40" />
          <span className="text-[10px] font-bold uppercase text-white/60">Org</span>
          <select
            className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white [&>option]:bg-background-primary focus:outline-none focus:border-accent cursor-pointer"
            value={filters.org}
            onChange={(e) => setFilters({ ...filters, org: e.target.value })}
          >
            {organizationOptions.map((organization) => (
              <option key={organization} value={organization}>{organization}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <Users size={16} className="text-white/40" />
          <span className="text-[10px] font-bold uppercase text-white/60">Age</span>
          <select
            className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white [&>option]:bg-background-primary focus:outline-none focus:border-accent cursor-pointer"
            value={filters.age}
            onChange={(e) => setFilters({ ...filters, age: e.target.value })}
          >
            {ageOptions.map((age) => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFilters({ area: 'All', org: 'All', age: 'All' })}
          className="ml-auto text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col h-[350px]">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 mb-6">
            <ShieldAlert size={16} className="text-red-400" /> Severity Index
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.severityData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="transparent">
                  {chartData.severityData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#a78b71'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col h-[350px]">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 mb-6">
            <Activity size={16} className="text-green-400" /> Average Distress by Age
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.ageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="avgDistress" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col h-[350px] xl:col-span-1 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 mb-6">
            <TrendingUp size={16} className="text-blue-400" /> Alert Trend
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 mt-2 overflow-hidden">
        <div className="flex flex-row justify-between items-center p-6 border-b border-white/10 bg-black/20">
          <h2 className="flex items-center gap-3 m-0 text-sm font-bold text-white uppercase tracking-widest">
            <ShieldAlert size={20} className="text-accent" /> Active Case Management
          </h2>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="text-[10px] font-bold uppercase opacity-60 text-white">Matches:</span>
            <span className="text-[10px] font-bold text-white">{filteredAlerts.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/10 border-b border-white/10 text-white/40">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest">Ref</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest">Context</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest">Trigger Issue</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center">Intensity</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right pr-6">Status Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAlerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-xs text-white/70">{alert._id.slice(-6).toUpperCase()}</td>
                  <td className="p-4">
                    <div className="text-sm text-white font-medium">{alert.user?.organization?.name || 'Unknown org'}</div>
                    <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                      {(alert.user?.organization?.location || 'Unknown')} • {(alert.user?.ageGroup || 'N/A')}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/80 font-medium">
                    {toSentenceCase(alert.assessment?.issueCategory || alert.type)}
                    <div className="text-xs text-white/35 mt-1">{formatDate(alert.createdAt)}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${COLORS[toSentenceCase(alert.severity)] || '#a78b71'}20`,
                        color: COLORS[toSentenceCase(alert.severity)] || '#a78b71',
                        border: `1px solid ${(COLORS[toSentenceCase(alert.severity)] || '#a78b71')}40`,
                      }}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <select
                      value={alert.status}
                      onChange={(e) => handleStatusChange(alert._id, e.target.value)}
                      className={`bg-transparent rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-1 transition-all ${
                        alert.status === 'active'
                          ? 'text-red-400 border border-red-400/30 hover:bg-red-500/10 focus:ring-red-500/50'
                          : alert.status === 'acknowledged'
                            ? 'text-yellow-400 border border-yellow-400/30 hover:bg-yellow-500/10 focus:ring-yellow-500/50'
                            : 'text-green-400 border border-green-400/30 hover:bg-green-500/10 focus:ring-green-500/50'
                      } [&>option]:bg-background-primary [&>option]:text-white`}
                    >
                      <option value="active">Assess</option>
                      <option value="acknowledged">Treat</option>
                      <option value="resolved">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/40 text-sm">No cases match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
