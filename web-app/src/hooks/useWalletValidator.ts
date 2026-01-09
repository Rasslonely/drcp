"use client";

import { useEffect } from "react";
import { useAccount, useDisconnect, useConnectorClient } from "wagmi";

/**
 * useWalletValidator
 * 
 * AUDIT FIX: Validates that the wallet connection is actually active.
 * Disconnects if there's a desync between stored state and actual provider.
 * 
 * This hook should be used in the Providers component to ensure
 * stale wallet connections are cleared on app load.
 */
export function useWalletValidator() {
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: connectorClient, isError } = useConnectorClient();

  useEffect(() => {
    // If wagmi thinks we're connected but we can't get the connector client,
    // it means the actual provider connection is stale/broken
    if (isConnected && isError) {
      console.warn(
        "[DRCP] Wallet state desync detected. " +
        "Stored connection doesn't match actual provider. Disconnecting..."
      );
      disconnect();
    }
  }, [isConnected, isError, disconnect]);

  useEffect(() => {
    // Additional check: verify the connector is actually available
    const validateConnection = async () => {
      if (isConnected && connector) {
        try {
          // Attempt to get accounts from the connector
          const accounts = await connector.getAccounts?.();
          if (!accounts || accounts.length === 0) {
            console.warn(
              "[DRCP] Connector has no accounts. Clearing stale connection..."
            );
            disconnect();
          }
        } catch (error) {
          console.warn(
            "[DRCP] Connector validation failed. Clearing stale connection...",
            error
          );
          disconnect();
        }
      }
    };

    // Small delay to allow connector to initialize
    const timer = setTimeout(validateConnection, 1000);
    return () => clearTimeout(timer);
  }, [isConnected, connector, disconnect]);

  return { isValidConnection: isConnected && !isError };
}
