import { useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { Camera, Save, AlertCircle, User, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (!path.includes('.')) return `data:image/jpeg;base64,${path}`;
    return null;
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
        setPreview(reader.result);
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
      // Password validation
      if (password) {
        if (password.length < 8) {
          setMessage({ text: 'A senha deve ter no mínimo 8 caracteres.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!/[A-Z]/.test(password)) {
          setMessage({ text: 'A senha deve conter pelo menos uma letra maiúscula.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!/[a-z]/.test(password)) {
          setMessage({ text: 'A senha deve conter pelo menos uma letra minúscula.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!/[0-9]/.test(password)) {
          setMessage({ text: 'A senha deve conter pelo menos um número.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          setMessage({ text: 'A senha deve conter pelo menos um símbolo especial.', type: 'error' });
          setLoading(false);
          return;
        }
      }

      // Build profile update payload
      const profilePayload = {};
      if (name && name !== user.name) profilePayload.name = name;
      if (profilePicture) profilePayload.profile_picture = profilePicture;
      
      const hasProfileChanges = Object.keys(profilePayload).length > 0;
      const hasPasswordChange = password.length > 0;

      if (!hasProfileChanges && !hasPasswordChange) {
        setMessage({ text: 'Nenhuma alteração foi feita.', type: 'info' });
        setLoading(false);
        return;
      }

      // Update profile data in public.users via Supabase
      if (hasProfileChanges) {
        const { error } = await supabase
          .from('users')
          .update(profilePayload)
          .eq('auth_id', user.auth_id);
        
        if (error) throw error;
      }

      // Update password via Supabase Auth
      if (hasPasswordChange) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }

      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setPassword('');

      // Reload to refresh user data from AuthContext
      setTimeout(() => {
         window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ text: error.message || 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('CUIDADO! Você está prestes a excluir SUA CONTA DE ADMINISTRADOR permanentemente. Todo o seu progresso e acesso serão perdidos. Tem certeza absoluta?')) {
      try {
        await supabase.rpc('delete_user_account', { target_user_id: user.auth_id });
        alert('Conta excluída com sucesso.');
        signOut();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao excluir conta.');
      }
    }
  };

  return (
    <div className="p-8 flex-1 max-w-4xl mx-auto w-full space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
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
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-lg p-8 relative overflow-hidden">
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
                  className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 flex justify-between items-center">
                  <span>Nova Senha</span>
                  <span className="text-xs text-slate-500 font-normal">Opcional</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
                    placeholder="Deixe em branco se não quiser alterar"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-emerald-500 transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 símbolo.
                </div>
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

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 hover:-translate-y-0.5"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Zona de Perigo */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-8 mt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -z-10"></div>
        <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Zona de Perigo
        </h3>
        <p className="text-slate-400 mb-6 text-sm relative z-10 max-w-2xl">A exclusão da conta é permanente e não pode ser desfeita. Todo o seu histórico e acesso administrativo serão apagados para sempre.</p>
        <button 
          onClick={handleDeleteAccount}
          className="relative z-10 px-6 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
        >
          Excluir Minha Conta Permanentemente
        </button>
      </div>
    </div>
  );
};

export default Settings;
