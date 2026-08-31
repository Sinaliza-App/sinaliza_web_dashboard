import { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Helper function to resolve profile picture URL
  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    if (!path.includes('.')) {
      return `data:image/jpeg;base64,${path}`;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return { title: 'Visão Geral', sub: 'Acompanhe as métricas do SINALIZA' };
    if (location.pathname === '/dashboard/ranking') return { title: 'Ranking', sub: 'Top 50 alunos com ligas' };
    if (location.pathname === '/dashboard/users') return { title: 'Comunidade', sub: 'Gerenciamento de alunos e reports' };
    if (location.pathname === '/dashboard/content') return { title: 'Conteúdo', sub: 'Gerencie módulos, lições e dicionário' };
    if (location.pathname === '/dashboard/notifications') return { title: 'Notificações', sub: 'Envie avisos para os alunos' };
    if (location.pathname === '/dashboard/settings') return { title: 'Configurações', sub: 'Gerencie seu perfil' };
    return { title: '', sub: '' };
  };

  const pageInfo = getPageTitle();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex h-screen bg-slate-900 overflow-hidden text-slate-200"
    >
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative bg-slate-950">
        {/* Header Global */}
        <header className="min-h-[5rem] border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{pageInfo.title}</h2>
            <p className="text-sm text-slate-400">{pageInfo.sub}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-emerald-400">{user?.email || 'admin@sinaliza.com'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-emerald-500 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profile_picture ? (
                 <img src={getProfilePicture(user.profile_picture)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                 <span className="font-bold text-slate-300">{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico das Rotas */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col absolute inset-0 overflow-y-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
};

export default DashboardLayout;
