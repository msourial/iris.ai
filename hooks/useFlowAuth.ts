/**
 * useFlowAuth.ts
 *
 * React hook that wraps the Iris.ai passkey-style Flow wallet connection.
 *
 * State machine:
 *   idle  ──connect()──►  connecting  ──success──►  connected
 *                                      └─cancel/err─►  idle
 *   connected  ──disconnect()──►  idle
 */

import { useCallback, useEffect, useState } from "react";
import {
  type FlowAccount,
  createAccount,
  deleteAccount,
  isBiometricAvailable,
  loadAccount,
  promptPasskey,
} from "../lib/flowPasskey";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthStatus = "idle" | "connecting" | "connected" | "error";

export type FlowAuthState = {
  status: AuthStatus;
  account: FlowAccount | null;
  errorMessage: string | null;
  hasBiometrics: boolean;
  /** Trigger passkey prompt → create / load account */
  connect: () => Promise<void>;
  /** Clear stored account → return to idle */
  disconnect: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFlowAuth(): FlowAuthState {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [account, setAccount] = useState<FlowAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // On mount: check biometrics and restore any previously stored account
  useEffect(() => {
    isBiometricAvailable().then(setHasBiometrics);
    loadAccount().then((stored) => {
      if (stored) {
        setAccount(stored);
        setStatus("connected");
      }
    });
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setErrorMessage(null);
    try {
      const authed = await promptPasskey();
      if (!authed) {
        // User cancelled — return to idle without an error
        setStatus("idle");
        return;
      }
      // Load existing account or create a new one
      const existing = await loadAccount();
      const flowAccount = existing ?? (await createAccount());
      setAccount(flowAccount);
      setStatus("connected");
    } catch (err) {
      setErrorMessage((err as Error).message ?? "Authentication failed");
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await deleteAccount();
    setAccount(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return { status, account, errorMessage, hasBiometrics, connect, disconnect };
}
