import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2 } from 'lucide-react';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Usuários';
    loadUsers();
  }, []);

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja BANIR o aluno "${userName}"? Esta ação não pode ser desfeita e todo o progresso será perdido.`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        // Atualiza a lista localmente
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuário banido com sucesso.');
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário.');
      }
    }
  };

  return (
    <div className="p-8 flex-1 w-full mx-auto">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando usuários...</div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <th className="p-4 font-medium">Aluno</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium text-center">Ofensiva (Dias)</th>
                <th className="p-4 font-medium text-center">Membro desde</th>
                <th className="p-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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
                      <span className="font-medium text-slate-200">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{user.email}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 font-medium text-sm">
                      🔥 {user.streak_count || 0}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Banir Usuário"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Nenhum aluno cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersList;
