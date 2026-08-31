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
          // Busca os dados diretamente do Supabase no Frontend
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (fetchError) {
            console.error("Fetch Error details:", fetchError);
            throw fetchError;
          }
          
          // Bloqueia acesso web se não for administrador
          if (!userData.is_admin) {
            await supabase.auth.signOut();
            setUser(null);
            alert("Acesso Negado: Este painel é exclusivo para Administradores/Professores do SINALIZA.");
            return;
          }

          setUser(userData);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário na tabela public.users:", error);
          await supabase.auth.signOut();
          setUser(null);
          alert("Conta não encontrada! Se você está tentando acessar o painel, certifique-se de que sua conta foi criada primeiro através do Aplicativo Sinaliza e que você possui permissão de Administrador.");
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
    
    api.defaults.headers.Authorization = `Bearer ${data.session.access_token}`;
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!userData.is_admin) {
        await supabase.auth.signOut();
        throw new Error("Acesso Negado: Este painel é exclusivo para Administradores/Professores do SINALIZA.");
      }
      setUser(userData);
    } catch (err) {
      await supabase.auth.signOut();
      throw new Error(err.message || "Conta não encontrada! Se você está tentando acessar o painel, certifique-se de que sua conta foi criada primeiro através do Aplicativo Sinaliza e que você possui permissão de Administrador.");
    }
    
    return data;
  }

  async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback'
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
