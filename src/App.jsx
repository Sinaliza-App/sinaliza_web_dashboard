import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Ranking from './pages/Ranking';
import UsersList from './pages/UsersList';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import './App.css'; 

function PrivateRoute({ children }) {
  const { signed, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
  return signed ? children : <Navigate to="/" />;
}

function PublicRoute({ children }) {
  const { signed, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
  return signed ? <Navigate to="/dashboard" /> : children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="users" element={<UsersList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
