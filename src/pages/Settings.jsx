import { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Camera, Save, AlertCircle, User } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    document.title = 'Sinaliza Web | Configurações';
    if (user) {
      setName(user.name || '');
      setPreview(getProfilePicture(user.profile_picture));
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Exibe o preview (Base64 completo com data:image)
        
        // Removemos a parte 'data:image/jpeg;base64,' antes de enviar para manter padrão do flutter
        const base64Data = reader.result.split(',')[1];
        setProfilePicture(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const payload = {};
      if (name && name !== user.name) payload.name = name;
      if (password) payload.password = password;
      if (profilePicture) payload.profile_picture = profilePicture;

      if (Object.keys(payload).length === 0) {
        setMessage({ text: 'Nenhuma alteração foi feita.', type: 'info' });
        setLoading(false);
        return;
      }

      await api.put('/users/me', payload);
      setMessage({ text: 'Perfil atualizado com sucesso! Faça login novamente para ver todas as alterações se necessário.', type: 'success' });
      setPassword(''); // Limpa a senha
      
      // Atualiza a página para pegar dados frescos do AuthContext
      setTimeout(() => {
         window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ text: error.response?.data?.message || 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('CUIDADO! Você está prestes a excluir SUA CONTA DE ADMINISTRADOR permanentemente. Todo o seu progresso e acesso serão perdidos. Tem certeza absoluta?')) {
      try {
        await api.delete('/users/me');
        alert('Conta excluída com sucesso.');
        signOut();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao excluir conta.');
      }
    }
  };

  return (
    <div className="p-8 flex-1 max-w-4xl mx-auto w-full space-y-8">
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-sm ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Informações Pessoais Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-8">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <User size={18} />
            </span>
            Informações Pessoais
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar Picker */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-full bg-slate-700 border-4 border-slate-600 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-emerald-500 shadow-xl">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-4xl text-slate-400">{name ? name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg border-2 border-slate-800 hover:scale-110">
                <Camera size={18} />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/jpeg, image/png" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            
            <div className="flex-1 w-full space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Nome de Exibição</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">E-mail (Apenas Leitura)</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Segurança Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-8">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            Segurança
          </h2>
          
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Nova Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-2">Deixe em branco se não quiser alterar sua senha atual.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 hover:-translate-y-0.5"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Todas Alterações'}
          </button>
        </div>
      </form>

      {/* Zona de Perigo */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-8 mt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -z-10"></div>
        <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Zona de Perigo
        </h3>
        <p className="text-slate-400 mb-6 text-sm max-w-2xl">A exclusão da conta é permanente e não pode ser desfeita. Todo o seu histórico e acesso administrativo serão apagados para sempre.</p>
        <button 
          onClick={handleDeleteAccount}
          className="bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white px-6 py-3 rounded-xl font-medium transition-all border border-rose-500/20 hover:border-transparent hover:shadow-lg hover:shadow-rose-500/20"
        >
          Excluir Minha Conta Permanentemente
        </button>
      </div>
    </div>
  );
};

export default Settings;
