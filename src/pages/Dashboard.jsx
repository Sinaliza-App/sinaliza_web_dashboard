import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion';
import { Users, Activity, Flame, AlertTriangle, Check, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 shadow-xl">
        <p className="text-slate-300 text-xs">{label}</p>
        <p className="text-white font-bold text-sm">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, active_streaks: 0, total_reports: 0 });
  const [topRank, setTopRank] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [usersByWeek, setUsersByWeek] = useState([]);
  const [levelDistribution, setLevelDistribution] = useState([]);
  const [xpOverTime, setXpOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    return null;
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Visão Geral';

    async function loadData() {
      try {
        const [usersRes, rankRes, reportsRes, streakRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('*').order('total_score', { ascending: false }).limit(3),
          supabase.from('reports').select(`*, users(name, profile_picture)`).order('id', { ascending: false }).limit(4),
          supabase.from('users').select('id', { count: 'exact', head: true }).gt('streak_count', 0),
        ]);

        const totalUsers = usersRes.count || 0;
        const activeStreaks = streakRes.count || 0;

        // Get recent users separately
        const { data: recentUsersData } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);

        // Get total reports count
        const { count: totalReports } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');

        setStats({ total_users: totalUsers, active_streaks: activeStreaks, total_reports: totalReports || 0 });
        setTopRank(rankRes.data || []);
        setRecentUsers(recentUsersData || []);

        // === PROCESSAMENTO DOS GRÁFICOS ===
        // 1. Novos Usuários por Semana (últimas 6 semanas)
        const { data: allUsersForCharts } = await supabase.from('users').select('created_at, total_score');
        const usersData = allUsersForCharts || [];
        
        const weekLabels = [];
        const weekCounts = [];
        for (let i = 5; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const count = usersData.filter(u => {
            const d = new Date(u.created_at);
            return d >= weekStart && d < weekEnd;
          }).length;
          
          const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
          weekLabels.push(label);
          weekCounts.push(count);
        }
        setUsersByWeek(weekLabels.map((label, i) => ({ name: label, usuarios: weekCounts[i] })));

        // 2. Distribuição por Nível
        const getLevelName = (score) => {
          if (score < 100) return 'Iniciante';
          if (score < 300) return 'Curioso';
          if (score < 600) return 'Dedicado';
          if (score < 1100) return 'Avançado';
          return 'Mestre';
        };
        const levelMap = {};
        usersData.forEach(u => {
          const lvl = getLevelName(u.total_score || 0);
          levelMap[lvl] = (levelMap[lvl] || 0) + 1;
        });
        setLevelDistribution(Object.entries(levelMap).map(([name, value]) => ({ name, value })));

        // 3. Evolução de XP médio por semana
        const xpData = [];
        for (let i = 5; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const usersInWeek = usersData.filter(u => new Date(u.created_at) <= weekEnd);
          const avgXp = usersInWeek.length > 0 
            ? Math.round(usersInWeek.reduce((sum, u) => sum + (u.total_score || 0), 0) / usersInWeek.length)
            : 0;
          
          xpData.push({ name: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`, xp: avgXp });
        }
        setXpOverTime(xpData);
        // === FIM DOS GRÁFICOS ===

        if (reportsRes.error) {
          console.error('❌ ERRO NA QUERY DE REPORTS (JOIN FALHOU):', reportsRes.error);
          // Fallback: Busca sem o JOIN caso a chave estrangeira esteja quebrada
          const fallbackReports = await supabase.from('reports').select('*').order('id', { ascending: false }).limit(4);

          if (fallbackReports.data && fallbackReports.data.length > 0) {
            // Busca os usuários manualmente para não ficar "Anônimo"
            const userIds = [...new Set(fallbackReports.data.map(r => r.user_id).filter(Boolean))];
            if (userIds.length > 0) {
              const numIds = userIds.filter(id => !isNaN(id) && typeof id !== 'string');
              const strIds = userIds.filter(id => typeof id === 'string');

              const [res1, res2] = await Promise.all([
                numIds.length > 0 ? supabase.from('users').select('id, auth_id, name, profile_picture').in('id', numIds) : Promise.resolve({ data: [] }),
                strIds.length > 0 ? supabase.from('users').select('id, auth_id, name, profile_picture').in('auth_id', strIds) : Promise.resolve({ data: [] })
              ]);

              const allUsers = [...(res1.data || []), ...(res2.data || [])];

              const enrichedReports = fallbackReports.data.map(r => {
                const user = allUsers.find(u => u.id === r.user_id || u.auth_id === r.user_id);
                return { ...r, users: user || null };
              });
              setRecentReports(enrichedReports);
            } else {
              setRecentReports(fallbackReports.data);
            }
          } else {
            setRecentReports([]);
          }
        } else {
          setRecentReports(reportsRes.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do painel:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-8 flex-1 font-sans text-slate-100">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Visão Geral</h2>
        <p className="text-slate-400 mt-2 text-lg">Métricas em tempo real da plataforma Sinaliza.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Total de Alunos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg overflow-hidden group hover:border-emerald-500/50 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Users size={24} />
              </div>
              <h3 className="text-slate-300 font-medium">Total de Alunos</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.total_users}</p>
            <p className="text-emerald-400 text-sm mt-3 font-medium">Contas registradas</p>
          </div>
        </motion.div>

        {/* Card: Alunos em Ofensiva */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg overflow-hidden group hover:border-orange-500/50 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                <Flame size={24} />
              </div>
              <h3 className="text-slate-200 font-medium">Alunos em Ofensiva</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.active_streaks}</p>
            <p className="text-orange-300 text-sm mt-3 font-medium">Mantendo a chama acesa! 🔥</p>
          </div>
        </motion.div>

        {/* Card: Reports Pendentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg overflow-hidden group hover:border-rose-500/50 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-slate-300 font-medium">Reports Pendentes</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.total_reports}</p>
            <p className="text-rose-400 text-sm mt-3 font-medium">{stats.total_reports === 0 ? 'Tudo limpo! ✨' : 'Precisam de atenção'}</p>
          </div>
        </motion.div>
      </div>

      {/* === SEÇÃO DE GRÁFICOS === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Gráfico de Barras: Novos Usuários por Semana */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-white font-bold">Novos Alunos / Semana</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usersByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usuarios" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pizza: Distribuição por Nível */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Users size={20} />
            </div>
            <h3 className="text-white font-bold">Distribuição por Nível</h3>
          </div>
          {levelDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {levelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {levelDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-slate-300">{entry.name}</span>
                    <span className="text-slate-500 font-bold">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">Nenhum dado disponível</div>
          )}
        </motion.div>

        {/* Gráfico de Área: XP Médio ao Longo do Tempo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-white font-bold">XP Médio da Turma</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={xpOverTime}>
              <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={2} fill="url(#xpGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

      </div>
      {/* === FIM DA SEÇÃO DE GRÁFICOS === */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Coluna Esquerda: Ranking e Heatmap */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">

          {/* Top 3 Ranking Lateral */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 250 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <h3 className="text-xl font-bold text-white">Pódio Atual</h3>
              <TrendingUp className="text-emerald-500" size={24} />
            </div>

            {loading && topRank.length === 0 ? (
              <p className="text-slate-400 animate-pulse">Carregando heróis...</p>
            ) : topRank.length > 0 ? (
              <div className="flex flex-col gap-4">
                {topRank.map((user, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1), type: "spring" }}
                    key={user.id}
                    className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}>
                      {index + 1}º
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                      {user.profile_picture ? <img src={getProfilePicture(user.profile_picture)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{user.name?.charAt(0)}</div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-emerald-400">{user.total_score} XP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">Nenhum aluno no ranking ainda.</div>
            )}
          </motion.div>

          {/* Sinais com Mais Dificuldade */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 250 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 relative overflow-hidden flex flex-col flex-1"
          >
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white">Sinais com Dificuldade</h3>
              <Activity className="text-amber-500" size={24} />
            </div>
            <div className="space-y-4">
              {[
                { sign: 'Letra H', percent: 85, color: 'bg-rose-500' },
                { sign: 'Letra X', percent: 65, color: 'bg-amber-500' },
                { sign: 'Bom dia', percent: 40, color: 'bg-yellow-500' },
                { sign: 'Por favor', percent: 25, color: 'bg-blue-500' }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{item.sign}</span>
                    <span className="text-slate-500">{item.percent}% erros</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-6 text-center italic">*Baseado no tempo médio de acerto (simulado)</p>
          </motion.div>

        </div>

        {/* Últimos Usuários & Reports */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">

          {/* Últimos Alunos Cadastrados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 250 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 flex-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white">Novos Alunos</h3>
              <Users className="text-emerald-500" size={24} />
            </div>

            {loading && recentUsers.length === 0 ? (
              <p className="text-slate-400 animate-pulse">Carregando alunos...</p>
            ) : recentUsers.length === 0 ? (
              <div className="text-center text-slate-400 py-12">Nenhum aluno cadastrado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentUsers.map((user, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (index * 0.1), type: "spring" }}
                    key={user.id}
                    className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 hover:border-emerald-500/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-300">
                      {user.profile_picture ? (
                        <img src={getProfilePicture(user.profile_picture)} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        user.name ? user.name.charAt(0).toUpperCase() : '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-200 font-bold truncate">{user.name}</h4>
                      <p className="text-slate-400 text-xs truncate">{user.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full">{user.total_score || 0} XP</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Últimos Reports (Denúncias) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 250 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 flex-1 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-bold text-white">Reports Recentes</h3>
              <AlertTriangle className="text-rose-500" size={24} />
            </div>

            {loading && recentReports.length === 0 ? (
              <p className="text-slate-400 animate-pulse">Carregando reports...</p>
            ) : recentReports.length === 0 ? (
              <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                <Check size={48} className="text-slate-600 mb-4" />
                <p>Tudo limpo! Nenhum problema reportado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentReports.map((report, index) => {
                  const isResolved = report.status === 'resolved';
                  const baseColor = isResolved ? 'emerald' : 'rose';

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + (index * 0.1), type: "spring" }}
                      key={report.id}
                      className={`flex flex-col gap-2 bg-${baseColor}-500/5 p-4 rounded-2xl border border-${baseColor}-500/20 hover:border-${baseColor}-500/40 transition-all`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">
                            {report.users?.profile_picture ? (
                              <img src={getProfilePicture(report.users.profile_picture)} alt={report.users?.name} className="w-full h-full object-cover" />
                            ) : (
                              report.users?.name ? report.users.name.charAt(0).toUpperCase() : '?'
                            )}
                          </div>
                          <span className="text-slate-300 text-sm font-medium">{report.users?.name || 'Anônimo'}</span>
                        </div>
                        <span className={`text-xs bg-${baseColor}-500/20 text-${baseColor}-400 px-2 py-1 rounded-md font-bold`}>
                          {isResolved ? 'Resolvido' : report.target_type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">"{report.description}"</p>
                      <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
