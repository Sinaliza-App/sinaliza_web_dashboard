import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Login() {
  const [isActive, setIsActive] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const { signIn, signUp, signInWithOAuth, resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sinaliza Web | Login';
  }, []);

  const handleRegisterClick = () => {
    // setIsActive(true); // Removido
    setForgotPassword(false);
    setError('');
    setMsg('');
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setForgotPassword(false);
    setError('');
    setMsg('');
  };

  const getPasswordError = (pass) => {
    if (pass.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'A senha deve conter pelo menos uma letra MAIÚSCULA.';
    if (!/[a-z]/.test(pass)) return 'A senha deve conter pelo menos uma letra minúscula.';
    if (!/[0-9]/.test(pass)) return 'A senha deve conter pelo menos um número.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'A senha deve conter um caractere especial (ex: @, #).';
    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    
    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // O redirecionamento e verificação de admin será feito pelo AuthContext
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      setMsg('Cadastro realizado! Por favor, verifique sua caixa de e-mail para confirmar a conta.');
      // Opcionalmente voltar pra tela de login
      setTimeout(() => {
        setIsActive(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    
    if (!email) {
      setError('Digite seu e-mail para recuperar a senha.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setMsg('Um link de recuperação de senha foi enviado para o seu e-mail.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(`Erro ao logar com ${provider}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="login-page-wrapper"
    >
      {/* Container Absoluto para mensagens de Erro Globais (ex: Acesso Negado de Admin) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
         {/* Espaço reservado para alertas se necessário */}
      </div>

      <div className={`container ${isActive ? 'active' : ''}`} id="container">
        
        {/* Formulário de Cadastro Removido para Segurança */}

        {/* Formulário de Login / Recuperação */}
        <div className="form-container sign-in flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!forgotPassword ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
              >
                <h1 className="font-bold text-2xl">Entrar</h1>
                
                <div className="social-icons flex justify-center">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleOAuthLogin('google'); }}>
                    <span className="font-bold">G</span>
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleOAuthLogin('github'); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  </a>
                </div>
                <span className="text-sm">ou use sua conta de e-mail</span>

                <AnimatePresence>
                  {error && !isActive && (
                    <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg w-full mt-3 text-sm overflow-hidden">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-left leading-tight">{error}</span>
                    </motion.div>
                  )}
                  {msg && !isActive && (
                    <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg w-full mt-3 text-sm overflow-hidden">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span className="text-left leading-tight">{msg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className={error || msg ? '!mt-0' : 'mt-3'} />
                <div className="w-full relative m-0 p-0 flex">
                  <input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full !m-0" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 !p-0 !m-0 !bg-transparent !shadow-none !border-none !text-slate-400 hover:!text-emerald-500 !w-auto !transform-none"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); setForgotPassword(true); setError(''); setMsg(''); }}>Esqueceu sua senha?</a>
                <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : 'Acessar'}</button>
              </motion.form>
            ) : (
              <motion.form 
                key="reset-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
              >
                <h1 className="font-bold text-2xl">Recuperar Senha</h1>
                <p className="text-sm text-center text-slate-500 my-4 px-4">Digite seu e-mail cadastrado e enviaremos instruções para redefinir sua senha.</p>
                
                <AnimatePresence>
                  {error && !isActive && (
                    <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg w-full text-sm overflow-hidden">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-left leading-tight">{error}</span>
                    </motion.div>
                  )}
                  {msg && !isActive && (
                    <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg w-full text-sm overflow-hidden">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span className="text-left leading-tight">{msg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                
                <button type="submit" disabled={loading} className="mt-2">{loading ? 'Enviando...' : 'Enviar E-mail'}</button>
                <a href="#" onClick={(e) => { e.preventDefault(); setForgotPassword(false); setError(''); setMsg(''); }} className="mt-4">Voltar ao Login</a>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Painel Lateral */}
        {/* Painel Toggle Removido para simplificar (Acesso Restrito) */}
      </div>
    </motion.div>
  )
}

export default Login
