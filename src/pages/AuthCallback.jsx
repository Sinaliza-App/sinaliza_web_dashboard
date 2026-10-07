import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();

  const { signed, loading } = useContext(AuthContext);

  useEffect(() => {
    // Só redireciona quando o AuthContext terminar de carregar e confirmar o admin
    if (!loading) {
      if (signed) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [signed, loading, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      <p className="text-slate-400">Autenticando sessão...</p>
    </div>
  );
}
