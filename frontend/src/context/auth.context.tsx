import authService from "@/services/auth.service";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

interface AuthContextValue {
  user: any | null;
  setCurrentUser: (userData: any) => void;
  logout: () => void;
  loaderUser: () => void;
  loading:boolean
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setloading] = useState(true);

  const setCurrentUser = (user:any) => {
    setloading(false);
    if (user) {
      setUser(user);
    } else {
      setUser(undefined);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const loaderUser = async () => {
    try {
      const authData: any = await authService.getCurrentUser();
      setCurrentUser(authData);
    } catch (error) {
      setCurrentUser(undefined);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      setCurrentUser,
      logout,
      loading,
      loaderUser,
      setloading,
    }),
    [user, loading]
  );

  useEffect(() => {
    loaderUser();
  }, []);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
