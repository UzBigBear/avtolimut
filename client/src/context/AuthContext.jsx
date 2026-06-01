import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('uzavto_token');
    const storedUser = localStorage.getItem('uzavto_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('uzavto_token');
        localStorage.removeItem('uzavto_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('uzavto_token', newToken);
    localStorage.setItem('uzavto_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('uzavto_token');
    localStorage.removeItem('uzavto_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      isAdmin: user?.role === 'admin',
      isLoggedIn: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
