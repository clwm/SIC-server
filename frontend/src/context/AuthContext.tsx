import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  isUserAuthenticated: boolean;
  loginAdmin: () => void;
  loginUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 초기 상태를 localStorage에서 읽기
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(() => {
    return localStorage.getItem('isUserAuthenticated') === 'true';
  });

  const loginAdmin = () => {
    setIsAdminAuthenticated(true);
    setIsUserAuthenticated(true);
    localStorage.setItem('isAdminAuthenticated', 'true');
    localStorage.setItem('isUserAuthenticated', 'true');
  };

  const loginUser = () => {
    setIsUserAuthenticated(true);
    setIsAdminAuthenticated(false);
    localStorage.setItem('isUserAuthenticated', 'true');
    localStorage.setItem('isAdminAuthenticated', 'false');
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    setIsUserAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('isUserAuthenticated');
  };

  return (
    <AuthContext.Provider
      value={{ isAdminAuthenticated, isUserAuthenticated, loginAdmin, loginUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};