import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Podium, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useContext(AuthContext);

  // Inicializa o estado lendo do localStorage, padrão é false (aberta)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('@Sinaliza:sidebarCollapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('@Sinaliza:sidebarCollapsed', newState);
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const menuItems = [
    { name: 'Visão Geral', path: '/dashboard', icon: <LayoutDashboard size={20} className="shrink-0" /> },
    { name: 'Ranking', path: '/dashboard/ranking', icon: <Podium size={20} className="shrink-0" /> },
    { name: 'Usuários', path: '/dashboard/users', icon: <Users size={20} className="shrink-0" /> },
    { name: 'Configurações', path: '/dashboard/settings', icon: <Settings size={20} className="shrink-0" /> },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} relative bg-slate-800 border-r border-slate-700 h-screen flex flex-col transition-all duration-300 z-50 shrink-0`}>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-md z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 flex items-center gap-3 border-b border-slate-700 ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <img src="/letra_s.png" alt="Sinaliza Logo" className={`${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} object-contain drop-shadow-md transition-all duration-300`} />
        {!isCollapsed && <h1 className="text-xl font-bold text-slate-50 tracking-wide transition-opacity duration-300">SINALIZA</h1>}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              title={isCollapsed ? item.name : ""}
            >
              {item.icon}
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sair da Conta" : ""}
          className={`flex w-full items-center gap-3 py-3 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">Sair da Conta</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
