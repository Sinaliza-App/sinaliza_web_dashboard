import { useState, useEffect } from 'react';
import api from '../services/api';

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Ranking';
    async function loadRanking() {
      try {
        const response = await api.get('/ranking');
        setRanking(response.data);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, []);

  return (
    <div className="p-8 flex-1 max-w-5xl mx-auto w-full">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando ranking...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <th className="p-4 font-medium text-center w-16">Posição</th>
                <th className="p-4 font-medium">Aluno</th>
                <th className="p-4 font-medium text-right">XP Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((user, index) => (
                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-slate-300/20 text-slate-300' :
                      index === 2 ? 'bg-amber-700/20 text-amber-500' :
                      'text-slate-500'
                    }`}>
                      {index + 1}º
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center shrink-0">
                        {user.profile_picture ? (
                           <img src={getProfilePicture(user.profile_picture)} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="font-bold text-slate-400">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-slate-200">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-400">
                    {user.total_score} <span className="text-sm font-normal text-slate-500">XP</span>
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">Nenhum aluno no ranking ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Ranking;
