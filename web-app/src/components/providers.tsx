"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ApolloProvider } from "@/lib/graphql/provider";
import { PendingDepositsProvider } from "@/contexts/PendingDepositsContext";
import { config } from "@/lib/wagmi";
import { useWalletValidator } from "@/hooks/useWalletValidator";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false, // Prevents 1-minute hang when switching tabs
      retry: 1,
    },
  },
});

/**
 * WalletValidator Component
 * AUDIT FIX: Validates wallet connection on mount and clears stale state
 */
function WalletValidator({ children }: { children: React.ReactNode }) {
  useWalletValidator();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider>
          <PendingDepositsProvider>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: "#6366f1",
                accentColorForeground: "white",
                borderRadius: "medium",
              })}
            >
              <WalletValidator>
                {children}
              </WalletValidator>
              <Toaster 
                theme="dark"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                  },
                }}
                richColors
                closeButton
              />
            </RainbowKitProvider>
          </PendingDepositsProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
