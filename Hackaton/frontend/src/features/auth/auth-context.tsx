import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "./api/login";
import type { LoginResponse } from "./types";
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
  isLoggingIn: boolean;
  loginError: string | null;
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
        role: data.role ?? null,
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
      isLoggingIn: mutation.isPending,
      loginError: mutation.isError
        ? (mutation.error as Error | { message?: string })?.message ??
          "No se pudo iniciar sesión"
        : null,
    }),
    [login, logout, mutation.error, mutation.isError, mutation.isPending, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
