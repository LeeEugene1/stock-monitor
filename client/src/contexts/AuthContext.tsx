import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

interface User {
  id: number;
  nickname: string;
  profileImage: string | null;
  email: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // OAuth 콜백에서 돌아온 경우 URL에서 토큰 추출
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      setToken(urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      const saved = localStorage.getItem('auth_token');
      if (saved) setToken(saved);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
