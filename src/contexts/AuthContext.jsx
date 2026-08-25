import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedUser = localStorage.getItem('@Sinaliza:user');
      const storedToken = localStorage.getItem('@Sinaliza:token');

      if (storedUser && storedToken) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
          localStorage.setItem('@Sinaliza:user', JSON.stringify(response.data));
        } catch (error) {
          console.error("Token inválido ou expirado", error);
          localStorage.removeItem('@Sinaliza:user');
          localStorage.removeItem('@Sinaliza:token');
          setUser(null);
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn(email, password) {
    const response = await api.post('/users/login', { email, password });
    
    const { user, token } = response.data;

    localStorage.setItem('@Sinaliza:user', JSON.stringify(user));
    localStorage.setItem('@Sinaliza:token', token);

    setUser(user);
  }

  async function signUp(name, email, password) {
    await api.post('/users/register', { name, email, password });
    // After sign up, automatically log in
    await signIn(email, password);
  }

  function signOut() {
    localStorage.removeItem('@Sinaliza:user');
    localStorage.removeItem('@Sinaliza:token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
