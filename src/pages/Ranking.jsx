import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Trophy, Medal, Shield, Diamond, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    return null;
  };

  const getLeague = (score) => {
    if (score >= 1100) return { name: 'Diamante', color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: '💎' };
    if (score >= 600) return { name: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '🏆' };
    if (score >= 300) return { name: 'Prata', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/30', icon: '🥈' };
    return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30', icon: '🛡️' };
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Ranking';
    async function loadRanking() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('total_score', { ascending: false })
          .limit(50);
        if (error) throw error;
        setRanking(data || []);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, []);

  if (loading && ranking.length === 0) {
    return (
      <div className="p-8 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const topThree = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="p-8 flex-1 bg-slate-950 font-sans text-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <TrendingUp className="text-emerald-500" /> Ranking Global
          </h2>
          <p className="text-slate-400 mt-1">Top 50 alunos da plataforma Sinaliza.</p>
        </div>

        {/* Pódio Top 3 */}
        {topThree.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex items-end justify-center gap-4 md:gap-8 pt-16 pb-4">
              {/* 2º Lugar */}
              {topThree[1] && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center w-28 md:w-32"
                >
                  <div className="w-16 h-16 rounded-2xl border-2 border-slate-300/50 bg-slate-800 overflow-hidden shadow-[0_0_20px_rgba(203,213,225,0.15)] flex items-center justify-center mb-3">
                    {topThree[1].profile_picture ? (
                      <img src={getProfilePicture(topThree[1].profile_picture)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-slate-300 text-xl">{topThree[1].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-t-2xl h-28 flex flex-col items-center justify-center border-t border-slate-400/30">
                    <span className="text-3xl mb-1">🥈</span>
                    <span className="text-slate-300 text-xs truncate w-full text-center px-2 font-medium">{topThree[1].name}</span>
                    <span className="text-emerald-400 font-bold text-sm mt-1">{topThree[1].total_score} XP</span>
                  </div>
                </motion.div>
              )}

              {/* 1º Lugar */}
              {topThree[0] && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center w-32 md:w-40"
                >
                  <div className="w-20 h-20 rounded-2xl border-2 border-yellow-400/50 bg-slate-800 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.25)] flex items-center justify-center mb-3">
                    {topThree[0].profile_picture ? (
                      <img src={getProfilePicture(topThree[0].profile_picture)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-slate-300 text-2xl">{topThree[0].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-t-2xl h-36 flex flex-col items-center justify-center border-t border-yellow-400/50">
                    <span className="text-4xl mb-1">🥇</span>
                    <span className="text-white font-bold text-sm truncate w-full text-center px-2">{topThree[0].name}</span>
                    <span className="text-emerald-400 font-bold text-base mt-1">{topThree[0].total_score} XP</span>
                  </div>
                </motion.div>
              )}

              {/* 3º Lugar */}
              {topThree[2] && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center w-28 md:w-32"
                >
                  <div className="w-16 h-16 rounded-2xl border-2 border-amber-600/50 bg-slate-800 overflow-hidden shadow-[0_0_20px_rgba(217,119,6,0.15)] flex items-center justify-center mb-3">
                    {topThree[2].profile_picture ? (
                      <img src={getProfilePicture(topThree[2].profile_picture)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-slate-300 text-xl">{topThree[2].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-t-2xl h-24 flex flex-col items-center justify-center border-t border-amber-600/50">
                    <span className="text-3xl mb-1">🥉</span>
                    <span className="text-slate-400 text-xs truncate w-full text-center px-2 font-medium">{topThree[2].name}</span>
                    <span className="text-emerald-400 font-bold text-sm mt-1">{topThree[2].total_score} XP</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Tabela Completa */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <th className="p-4 font-medium text-center w-16">#</th>
                <th className="p-4 font-medium">Aluno</th>
                <th className="p-4 font-medium text-center">Liga</th>
                <th className="p-4 font-medium text-center">Ofensiva</th>
                <th className="p-4 font-medium text-right">XP Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((user, index) => {
                const league = getLeague(user.total_score || 0);
                return (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.5) }}
                    className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-300/20 text-slate-300' :
                        index === 2 ? 'bg-amber-700/20 text-amber-500' :
                        'text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center shrink-0">
                          {user.profile_picture ? (
                             <img src={getProfilePicture(user.profile_picture)} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                             <span className="font-bold text-slate-400">{user.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-medium text-slate-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${league.bg} ${league.color} ${league.border}`}>
                        <span>{league.icon}</span>
                        <span>{league.name}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-medium text-sm">
                        🔥 {user.streak_count || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-emerald-400">{user.total_score || 0}</span>
                      <span className="text-sm font-normal text-slate-500 ml-1">XP</span>
                    </td>
                  </motion.tr>
                );
              })}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">Nenhum aluno no ranking ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
