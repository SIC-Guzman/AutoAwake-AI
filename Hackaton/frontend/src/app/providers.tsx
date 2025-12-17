import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../features/auth/auth-context";
import { MqttProvider } from "../features/mqtt/mqtt-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MqttProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0a1224",
              color: "#e8efff",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            },
          }}
        />
      </MqttProvider>
    </AuthProvider>
  </QueryClientProvider>
);
