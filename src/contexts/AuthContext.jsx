import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase } from '../services/supabase';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta as mudanças de estado de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const token = session.access_token;
        api.defaults.headers.Authorization = `Bearer ${token}`;
        
        try {
          const response = await api.get('/users/me');
          
          // Bloqueia acesso web se não for administrador
          if (!response.data.is_admin) {
            await supabase.auth.signOut();
            setUser(null);
            alert("Acesso Negado: Apenas administradores podem acessar este painel.");
            return;
          }

          setUser(response.data);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário", error);
          setUser(null);
        }
      } else {
        api.defaults.headers.Authorization = null;
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // O useEffect(onAuthStateChange) cuidará de buscar os dados em /users/me
    return data;
  }

  async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });

    if (error) throw new Error(error.message);
    return data;
  }

  async function signUp(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // ATENÇÃO: Dependendo das configurações do Supabase, o usuário pode precisar confirmar o email
    // antes de conseguir logar.
    return data;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      signInWithOAuth,
      resetPassword,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
