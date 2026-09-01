import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Escutar se o usuário já tem uma sessão válida 
  // (O Supabase loga o usuário automaticamente ao clicar no link do email)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Sessão inválida ou expirada. Solicite a recuperação novamente.');
      }
    });
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    // Validação da Senha
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('A senha deve ter pelo menos uma letra maiúscula.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('A senha deve ter pelo menos uma letra minúscula.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('A senha deve ter pelo menos um número.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('A senha deve ter pelo menos um símbolo especial.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMsg('Senha atualizada com sucesso!');
      
      // Desloga por segurança e manda para o Login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 font-sans overflow-hidden">
      {/* Background Decorativo Dinâmico */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-emerald-700/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 mx-4 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl"
      >
        <div className="text-center mb-8">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.2, type: "spring" }}
             className="inline-flex items-center justify-center mb-4"
          >
            <div className="p-4 bg-emerald-500/10 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Redefinir Senha</h1>
          <p className="text-slate-400 mt-2 text-sm">Crie uma nova senha de acesso forte.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            {msg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl text-sm text-center"
              >
                {msg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Nova Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Confirmar Nova Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300"
              required
            />
          </div>
          
          <div className="text-center pb-2">
            <p className="text-xs text-red-400/80">Obrigatório: Min 8 chars, 1 maiúscula, 1 minúscula, 1 número e 1 símbolo.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : "Atualizar Senha"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
