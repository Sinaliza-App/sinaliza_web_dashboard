import { useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { Trash2, Shield, AlertTriangle, Users, GraduationCap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommunityManager() {
  const { user: currentUser, isAdmin: isSuperAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reports'
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } else {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setReports(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBanUser = async (authId, userId, userName) => {
    if (!isSuperAdmin) {
      alert('Ação bloqueada: Apenas o Administrador Geral possui permissão para banir contas.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja BANIR o aluno "${userName}"? Esta ação não pode ser desfeita e ele perderá todo o progresso.`)) {
      try {
        const { error } = await supabase.rpc('delete_user_account', { target_user_id: authId });
        if (error) throw error;
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuário banido e excluído com sucesso.');
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Verifique se você tem permissões no banco.');
      }
    }
  };

  const handleToggleRole = async (userId, userName, currentRole, currentAdmin) => {
    if (!isSuperAdmin) {
      alert('Ação restrita: Somente o Administrador do Sistema pode alterar papéis e permissões.');
      return;
    }

    // Alterna entre student -> teacher -> admin -> student
    let nextRole = 'teacher';
    if (currentRole === 'teacher') nextRole = 'admin';
    else if (currentRole === 'admin') nextRole = 'student';

    const willBeAdmin = (nextRole === 'admin');

    if (window.confirm(`Alterar papel de "${userName}" para ${nextRole.toUpperCase()}?`)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: nextRole, is_admin: willBeAdmin })
          .eq('id', userId);

        if (error) throw error;

        setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole, is_admin: willBeAdmin } : u));
      } catch (error) {
        console.error('Erro ao alterar permissão:', error);
        alert('Erro ao alterar permissões no Supabase.');
      }
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (error) {
      console.error('Erro ao resolver report:', error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in bg-slate-950 min-h-screen text-slate-100 font-sans p-8 flex-1">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
            Comunidade & Suporte
          </h1>
          <p className="text-slate-400 mt-2">Gerencie alunos, permissões e denúncias (reports) do aplicativo.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'users'
              ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
        >
          <Users className="w-5 h-5" />
          <span>Usuários e Permissões</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'reports'
              ? 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,51,102,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Caixa de Entrada (Reports)</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
        {loading && activeTab === 'users' && users.length === 0 ? (
          <div className="p-12 text-center text-neon-green flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold tracking-widest text-sm">CARREGANDO...</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                  <th className="p-4 font-medium">Usuário</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium text-center">Papel (Role)</th>
                  <th className="p-4 font-medium text-center">Ofensiva</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const role = user.role || (user.is_admin ? 'admin' : 'student');
                  const isUserAdmin = role === 'admin' || user.is_admin;
                  const isUserTeacher = role === 'teacher';

                  return (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center shrink-0">
                            {user.profile_picture ? (
                              <img src={getProfilePicture(user.profile_picture)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-400">{user.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-slate-200 block">{user.name}</span>
                            <span className="text-[11px] text-slate-500">ID #{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{user.email}</td>
                      <td className="p-4 text-center">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleToggleRole(user.id, user.name, role, user.is_admin)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              isUserAdmin
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30'
                                : isUserTeacher
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                            title="Clique para alternar papel (Aluno -> Professor -> Admin)"
                          >
                            {isUserAdmin ? <Shield className="w-3.5 h-3.5" /> : isUserTeacher ? <GraduationCap className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                            <span>{isUserAdmin ? "ADMIN" : isUserTeacher ? "PROFESSOR" : "ALUNO"}</span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                              isUserAdmin
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                                : isUserTeacher
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-slate-700/50 text-slate-400 border-slate-600'
                            }`}
                          >
                            {isUserAdmin ? <Shield className="w-3.5 h-3.5" /> : isUserTeacher ? <GraduationCap className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                            <span>{isUserAdmin ? "ADMIN" : isUserTeacher ? "PROFESSOR" : "ALUNO"}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 font-medium text-sm">
                          🔥 {user.streak_count || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleBanUser(user.auth_id, user.id, user.name)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Banir Usuário (Ação irreversível de Administrador)"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <span 
                            className="inline-flex items-center text-xs text-slate-500 gap-1 px-2 py-1 rounded bg-slate-800/40 border border-slate-800"
                            title="Apenas o Administrador Geral pode excluir contas."
                          >
                            <Lock size={12} />
                            <span>Protegido</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  Nenhum report recebido.
                </div>
              ) : (
                reports.map((report, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={report.id}
                    className={`bg-slate-900 border p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${report.status === 'resolved'
                        ? 'border-slate-700/50 opacity-60'
                        : 'border-neon-red/30 shadow-[0_0_15px_rgba(255,51,102,0.1)]'
                      }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                          {report.target_type === 'lesson' ? 'LIÇÃO' : 'SINAL'} #{report.target_id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-lg">{report.description}</p>
                    </div>
                    {report.status !== 'resolved' ? (
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="flex items-center space-x-2 bg-neon-green/20 text-neon-green hover:bg-neon-green hover:text-black px-4 py-2 rounded-xl transition-colors font-bold"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>RESOLVER</span>
                      </button>
                    ) : (
                      <span className="flex items-center space-x-1 text-slate-500 font-bold">
                        <CheckCircle className="w-5 h-5" />
                        <span>RESOLVIDO</span>
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
