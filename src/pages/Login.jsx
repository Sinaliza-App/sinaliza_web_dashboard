import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

function Login() {
  const [isActive, setIsActive] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sinaliza Web | Login';
  }, []);

  const handleRegisterClick = () => {
    setIsActive(true);
    setError('');
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Diferenciar erros específicos do backend
      if (err.message === 'Network Error') {
        setError('O servidor está offline ou inacessível. Tente novamente mais tarde.');
      } else {
        const msg = err.response?.data?.message || 'Erro inesperado ao fazer login.';
        if (msg.toLowerCase().includes('senha')) {
          setError('⚠️ Senha incorreta. Verifique e tente novamente.');
        } else if (msg.toLowerCase().includes('e-mail')) {
          setError('✉️ E-mail não encontrado ou inválido.');
        } else {
          setError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um formato de e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('O servidor está offline ou inacessível.');
      } else {
        setError(err.response?.data?.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
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
      <div className={`container ${isActive ? 'active' : ''}`} id="container">
        <div className="form-container sign-up">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Criar Conta</h1>
            {error && isActive && <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded w-full my-2 text-sm">{error}</div>}
            <input type="text" placeholder="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : 'Cadastrar'}</button>
          </form>
        </div>
        <div className="form-container sign-in">
          <form onSubmit={handleLoginSubmit}>
            <h1>Entrar</h1>
            {error && !isActive && <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded w-full my-2 text-sm">{error}</div>}
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            <a href="#">Esqueceu sua senha?</a>
            <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : 'Acessar'}</button>
          </form>
        </div>
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Bem-vindo de volta!</h1>
              <p>Acesse o painel do Sinaliza com seus dados pessoais para continuar.</p>
              <button type="button" className="ghost-btn" id="login" onClick={handleLoginClick}>Entrar</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Olá, Visitante!</h1>
              <p>Cadastre-se com seus dados e comece a usar a plataforma do Sinaliza hoje mesmo.</p>
              <button type="button" className="ghost-btn" id="register" onClick={handleRegisterClick}>Cadastrar</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Login
