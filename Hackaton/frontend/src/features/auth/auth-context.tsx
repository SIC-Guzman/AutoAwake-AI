import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { loginRequest, LoginResponse } from "./api/login";
import { storeToken, getStoredToken } from "../../app/api/client";

type AuthState = {
  token: string | null;
  role: string | null;
  email: string | null;
};

type AuthContextValue = {
  user: AuthState;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthState>({
    token: getStoredToken(),
    role: null,
    email: null,
  });

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      storeToken(data.token);
      setUser({
        token: data.token,
        role: data.role,
        email: data.email ?? null,
      });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await mutation.mutateAsync({ email, password });
      return res;
    },
    [mutation],
  );

  const logout = useCallback(() => {
    storeToken(null);
    setUser({ token: null, role: null, email: null });
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user.token),
    }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
