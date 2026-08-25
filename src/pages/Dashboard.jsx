import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, accesses_today: 0, total_streaks: 0 });
  const [topRank, setTopRank] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Visão Geral';
    
    async function loadData() {
      try {
        const [statsRes, rankRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/ranking')
        ]);
        setStats(statsRes.data);
        setTopRank(rankRes.data.slice(0, 3)); // Pega os 3 melhores
      } catch (error) {
        console.error('Erro ao buscar dados do painel:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  return (
    <div className="p-8 flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Total de Usuários</h3>
          <p className="text-3xl font-bold text-slate-100">{loading ? '...' : stats.total_users}</p>
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
            <span>Registrados no banco</span>
          </p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Acessos Ativos (24h)</h3>
          <p className="text-3xl font-bold text-slate-100">{loading ? '...' : stats.accesses_today}</p>
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
            <span>Alunos praticando hoje</span>
          </p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-emerald-100 text-sm font-medium mb-2">Alunos em Ofensiva 🔥</h3>
            <p className="text-3xl font-bold text-white">{loading ? '...' : stats.total_streaks}</p>
            <p className="text-emerald-200 text-sm mt-2">Mantendo a chama acesa!</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-90"></div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-8 min-h-[400px]">
        <h3 className="text-xl font-bold text-slate-100 mb-6">Pódio Atual (Top 3)</h3>
        
        {loading ? (
           <p className="text-slate-400">Carregando dados...</p>
        ) : topRank.length > 0 ? (
          <div className="flex flex-col md:flex-row items-end justify-center gap-8 mt-12 md:mt-24 h-64">
            
            {/* 2º LUGAR */}
            {topRank[1] && (
              <div className="flex flex-col items-center w-32 relative">
                <div className="absolute -top-16 w-16 h-16 rounded-full border-4 border-slate-300 bg-slate-700 overflow-hidden shadow-[0_0_15px_rgba(203,213,225,0.3)] z-10">
                  {topRank[1].profile_picture ? (
                    <img src={getProfilePicture(topRank[1].profile_picture)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full font-bold text-slate-300 text-xl">{topRank[1].name.charAt(0)}</span>
                  )}
                </div>
                <div className="w-full bg-slate-700 rounded-t-lg h-32 flex flex-col items-center justify-end pb-4 border-t-4 border-slate-300 relative shadow-inner">
                  <span className="text-slate-300 font-black text-2xl mb-1">2</span>
                  <span className="text-slate-400 text-xs truncate w-full text-center px-2">{topRank[1].name}</span>
                  <span className="text-emerald-400 font-bold text-sm mt-1">{topRank[1].total_score} XP</span>
                </div>
              </div>
            )}

            {/* 1º LUGAR */}
            {topRank[0] && (
              <div className="flex flex-col items-center w-40 relative">
                <div className="absolute -top-20 w-20 h-20 rounded-full border-4 border-yellow-400 bg-slate-700 overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20">
                  {topRank[0].profile_picture ? (
                    <img src={getProfilePicture(topRank[0].profile_picture)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full font-bold text-slate-300 text-2xl">{topRank[0].name.charAt(0)}</span>
                  )}
                </div>
                {/* Coroa SVG */}
                <svg className="w-8 h-8 text-yellow-400 absolute -top-28 z-30 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
                
                <div className="w-full bg-slate-600 rounded-t-lg h-40 flex flex-col items-center justify-end pb-4 border-t-4 border-yellow-400 relative shadow-inner z-10">
                  <span className="text-yellow-400 font-black text-3xl mb-1">1</span>
                  <span className="text-slate-200 font-bold text-sm truncate w-full text-center px-2">{topRank[0].name}</span>
                  <span className="text-emerald-400 font-bold text-base mt-1">{topRank[0].total_score} XP</span>
                </div>
              </div>
            )}

            {/* 3º LUGAR */}
            {topRank[2] && (
              <div className="flex flex-col items-center w-32 relative">
                <div className="absolute -top-16 w-16 h-16 rounded-full border-4 border-amber-600 bg-slate-700 overflow-hidden shadow-[0_0_15px_rgba(217,119,6,0.3)] z-10">
                  {topRank[2].profile_picture ? (
                    <img src={getProfilePicture(topRank[2].profile_picture)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full font-bold text-slate-300 text-xl">{topRank[2].name.charAt(0)}</span>
                  )}
                </div>
                <div className="w-full bg-slate-700 rounded-t-lg h-24 flex flex-col items-center justify-end pb-4 border-t-4 border-amber-600 relative shadow-inner">
                  <span className="text-amber-600 font-black text-2xl mb-1">3</span>
                  <span className="text-slate-400 text-xs truncate w-full text-center px-2">{topRank[2].name}</span>
                  <span className="text-emerald-400 font-bold text-sm mt-1">{topRank[2].total_score} XP</span>
                </div>
              </div>
            )}

          </div>
        ) : (
           <div className="text-center text-slate-400 py-12">Nenhum aluno no ranking ainda.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
