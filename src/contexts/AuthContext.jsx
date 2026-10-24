/* eslint-disable react-refresh/only-export-components */
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
          
          const userRole = userData.role || (userData.is_admin ? 'admin' : 'student');
          const isStaff = userRole === 'teacher' || userRole === 'admin' || userData.is_admin === true;

          // Se for aluno sem permissão pedagógica, armazena estado para permitir ativação via chave institucional
          if (!isStaff) {
            setUser({
              ...userData,
              role: userRole,
              isAdmin: false,
              isTeacher: false,
              needsTeacherActivation: true
            });
            setLoading(false);
            return;
          }

          setUser({
            ...userData,
            role: userRole,
            isAdmin: userRole === 'admin',
            isTeacher: userRole === 'teacher' || userRole === 'admin',
            needsTeacherActivation: false
          });
        } catch (error) {
          console.error("Erro ao buscar dados do usuário na tabela public.users:", error);
          await supabase.auth.signOut();
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
      email: email.trim().toLowerCase(),
      password,
    });
    
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Seu e-mail ainda não foi confirmado. Enviamos um link de confirmação para o seu e-mail. Por favor, confirme antes de acessar.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'E-mail ou senha incorretos.';
      }
      throw new Error(msg);
    }
    
    api.defaults.headers.Authorization = `Bearer ${data.session.access_token}`;
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (fetchError) throw fetchError;

      const userRole = userData.role || (userData.is_admin ? 'admin' : 'student');
      const isStaff = userRole === 'teacher' || userRole === 'admin' || userData.is_admin === true;

      if (!isStaff) {
        setUser({
          ...userData,
          role: userRole,
          isAdmin: false,
          isTeacher: false,
          needsTeacherActivation: true
        });
        throw new Error("Acesso Restrito: Sua conta está registrada como Aluno. Insira sua Chave Institucional para ativar seu acesso de Educador.");
      }

      const enriched = {
        ...userData,
        role: userRole,
        isAdmin: userRole === 'admin',
        isTeacher: userRole === 'teacher' || userRole === 'admin',
        needsTeacherActivation: false
      };
      setUser(enriched);
      return data;
    } catch (err) {
      if (!err.message?.includes('Acesso Restrito')) {
        await supabase.auth.signOut();
        throw new Error(err.message || "Conta não encontrada! Certifique-se de que sua conta possui acesso de Educador.", { cause: err });
      }
      throw err;
    }
  }

  async function registerTeacher(name, email, password, code) {
    if (!code || !code.trim()) {
      throw new Error('Informe a Chave Institucional fornecida pela coordenação.');
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Tenta validar o código no backend (se disponível)
    try {
      const verifyRes = await api.post('/auth/verify-teacher-code', { code: cleanCode });
      if (verifyRes.data && verifyRes.data.valid === false) {
        throw new Error('Código institucional de acesso docente incorreto ou inativo.');
      }
    } catch (apiErr) {
      if (apiErr.response?.data?.message) {
        throw new Error(apiErr.response.data.message);
      }
      // Fallback: se a API não estiver respondendo, valida com código padrão
      if (cleanCode !== 'PROF-SINALIZA-2026') {
        throw new Error('Código institucional de acesso docente incorreto.');
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Realiza o cadastro no Supabase Auth com link de redirecionamento dinâmico
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name: name.trim(),
          role: 'teacher',
          institution_code: cleanCode
        }
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new Error('Este endereço de e-mail já está cadastrado no sistema.');
      }
      throw error;
    }

    // Se o Supabase retornou identities vazio, significa que o e-mail já existe
    if (data?.user?.identities && data.user.identities.length === 0) {
      throw new Error('Este e-mail já possui cadastro. Faça o login normalmente ou redefina sua senha.');
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session
    };
  }

  async function claimTeacher(code) {
    if (!code || !code.trim()) {
      throw new Error('Digite a sua Chave Institucional.');
    }
    const cleanCode = code.trim().toUpperCase();

    // Tenta atualizar via API backend autenticada
    try {
      const response = await api.post('/auth/claim-teacher', { code: cleanCode });
      if (user) {
        setUser(prev => ({
          ...prev,
          role: response.data?.role || 'teacher',
          isTeacher: true,
          needsTeacherActivation: false
        }));
      }
      return response.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // Fallback direto via Supabase se o código institucional bater
      if (cleanCode === 'PROF-SINALIZA-2026' && user) {
        const { error: updateErr } = await supabase
          .from('users')
          .update({ role: 'teacher' })
          .eq('auth_id', user.auth_id);
        if (updateErr) throw updateErr;

        setUser(prev => ({
          ...prev,
          role: 'teacher',
          isTeacher: true,
          needsTeacherActivation: false
        }));
        return { success: true };
      }
      throw new Error('Chave institucional inválida.');
    }
  }

  async function resendConfirmationEmail(email) {
    if (!email) throw new Error('E-mail não informado.');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
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
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name: name.trim()
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
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
      signed: !!user && !user.needsTeacherActivation, 
      user, 
      role: user?.role || 'student',
      isAdmin: user?.isAdmin || false,
      isTeacher: user?.isTeacher || false,
      needsTeacherActivation: !!user?.needsTeacherActivation,
      signIn, 
      signUp, 
      registerTeacher,
      claimTeacher,
      resendConfirmationEmail,
      signOut, 
      signInWithOAuth,
      resetPassword,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
