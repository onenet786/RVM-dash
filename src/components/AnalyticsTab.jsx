import React, { useState, useEffect } from 'react';
import { Award, Trophy, Users, RefreshCw, BarChart2, PieChart as PieIcon, Shield } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

export default function AnalyticsTab() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/leaderboard');
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 t-text-muted gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Computing Advanced Analytics & Leaderboards...</p>
      </div>
    );
  }

  const chartData = leaderboard.slice(0, 8).map(u => ({
    name: u.userName || u._id.slice(0, 8),
    points: u.totalPoints,
    bottles: u.totalBottles,
    cups: u.totalCups
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Analytics Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Leaderboard & Insights</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Top Recycler Insights</h2>
          <p className="text-xs t-text-secondary mt-1">Ranking eco-champions by cumulative points and material volume.</p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Leaderboard Chart & Top Champions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Top 8 Champions Points Comparison
          </h3>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} 
                />
                <Bar dataKey="points" name="Total Points" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Podiums */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold t-text-primary flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              Top Eco Champions
            </h3>

            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((champion, rank) => (
                <div 
                  key={champion._id} 
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    rank === 0 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : rank === 1 
                      ? 't-bg-sec border t-border t-text-primary' 
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${
                      rank === 0 ? 'bg-amber-400 text-slate-950' : rank === 1 ? 'bg-slate-300 text-slate-950' : 'bg-orange-400 text-slate-950'
                    }`}>
                      #{rank + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm t-text-primary">{champion.userName || 'Anonymous User'}</div>
                      <div className="text-xs t-text-muted mono">{champion._id}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-base mono">{champion.totalPoints} pts</div>
                    <div className="text-[11px] t-text-muted font-medium">
                      {champion.totalBottles} bottles • {champion.totalCups} cups
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-semibold">
            Keep rewarding users to promote sustainable recycling habit!
          </div>
        </div>
      </div>

      {/* Leaderboard Detailed Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-base font-bold t-text-primary">Full Leaderboard Ranking</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-border t-text-muted uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4 text-center">Sessions</th>
                <th className="py-3 px-4 text-center">Bottles</th>
                <th className="py-3 px-4 text-center">Cups</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {leaderboard.map((user, idx) => (
                <tr key={user._id} className="hover:t-bg-hover">
                  <td className="py-3 px-4 font-bold text-emerald-400 mono">#{idx + 1}</td>
                  <td className="py-3 px-4 font-bold t-text-primary">{user.userName || 'Anonymous'}</td>
                  <td className="py-3 px-4 mono t-text-secondary">{user._id}</td>
                  <td className="py-3 px-4 text-center mono font-semibold t-text-primary">{user.totalSessions}</td>
                  <td className="py-3 px-4 text-center mono text-emerald-400 font-bold">{user.totalBottles}</td>
                  <td className="py-3 px-4 text-center mono text-amber-400 font-bold">{user.totalCups}</td>
                  <td className="py-3 px-4 text-right mono font-extrabold text-cyan-400 text-sm">{user.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
