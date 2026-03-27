/**
 * flowPasskey.ts
 *
 * Flow FCL authentication layer for Iris.ai.
 *
 * UX model: user taps Connect → Face ID / Touch ID prompt → FCL Discovery
 * opens (Blocto, Dapper, Lilico, etc.) → wallet authenticates → FCL session
 * is stored in memory.  A local SecureStore entry caches the last-known
 * address so the UI can display it without a network round-trip.
 *
 * FCL is configured for Flow Testnet.  Swap the access node and Discovery URL
 * to `mainnet` for production.
 */

// @onflow/fcl ships no TypeScript declarations — import as any and re-type locally.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const fcl = require("@onflow/fcl") as any;
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Internal FCL user shape (FCL has no official TS declarations)
// ---------------------------------------------------------------------------

type FclUser = {
  loggedIn: boolean | null;
  addr?: string;
};

// ---------------------------------------------------------------------------
// FCL Configuration (Testnet)
// ---------------------------------------------------------------------------

const APP_NAME = "Iris.ai";
const APP_DESCRIPTION = "AI-powered vision-request bounty platform on Flow";
const APP_ICON = "https://iris-ai.app/icon.png";
const APP_URL = "https://iris-ai.app";

/** URI scheme registered in app.json — used for FCL deep-link callback. */
const APP_SCHEME = "iris-ai";
const BUNDLE_ID = "com.irisai.app";

const ACCESS_NODE = process.env.EXPO_PUBLIC_FLOW_ACCESS_NODE ?? "https://rest-testnet.onflow.org";
const DISCOVERY_WALLET = "https://fcl-discovery.onflow.org/testnet/authn";
const FLOW_NETWORK = process.env.EXPO_PUBLIC_FLOW_NETWORK ?? "testnet";

fcl.config({
  "app.detail.title": APP_NAME,
  "app.detail.description": APP_DESCRIPTION,
  "app.detail.icon": APP_ICON,
  "app.detail.url": APP_URL,

  /** WalletConnect / FCL deep-link redirect for React Native. */
  "app.detail.uiid": Platform.OS === "ios" ? BUNDLE_ID : APP_SCHEME,

  "accessNode.api": ACCESS_NODE,
  "discovery.wallet": DISCOVERY_WALLET,
  "discovery.wallet.method": "IFRAME/RPC",

  "flow.network": FLOW_NETWORK,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlowAccount = {
  /** Canonical 0x-prefixed Flow address returned by FCL. */
  address: string;
  /** Hex-encoded public key of the signing key (empty string if unavailable). */
  publicKeyHex: string;
};

// ---------------------------------------------------------------------------
// SecureStore cache key
// ---------------------------------------------------------------------------

const STORE_KEY = "iris_flow_account_v2";

// ---------------------------------------------------------------------------
// Biometrics helpers
// ---------------------------------------------------------------------------

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

/**
 * Gate an async action behind the device biometric / passcode prompt.
 * Returns true if the user authenticated successfully.
 */
export async function promptPasskey(
  reason: string = "Authenticate to access your Iris.ai wallet"
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Use Device Passcode",
    disableDeviceFallback: false,
    cancelLabel: "Cancel",
  });
  return result.success;
}

// ---------------------------------------------------------------------------
// FCL account management
// ---------------------------------------------------------------------------

/**
 * Load the cached Flow account from SecureStore.
 * Returns null if no account has been authenticated in this installation.
 */
export async function loadAccount(): Promise<FlowAccount | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as FlowAccount;
}

/**
 * Authenticate with Flow via the FCL Discovery service.
 *
 * Flow:
 *   1. Prompt biometrics — abort early if the user cancels.
 *   2. Call `fcl.authenticate()` — opens the Discovery UI (Blocto / Dapper /
 *      Lilico / etc.) via an in-app browser or WalletConnect deep link.
 *   3. Subscribe to `fcl.currentUser()` to get the resolved address.
 *   4. Cache the account in SecureStore for fast UI re-renders.
 *
 * @throws If biometrics fail or the user cancels wallet authentication.
 */
export async function createAccount(): Promise<FlowAccount> {
  // Gate behind biometrics before opening the wallet UI.
  const authed = await promptPasskey("Authenticate to connect your Flow wallet");
  if (!authed) {
    throw new Error("Biometric authentication cancelled");
  }

  // Trigger FCL wallet discovery / authentication.
  await fcl.authenticate();

  // Wait for FCL to resolve the current user (resolves after wallet callback).
  const user = await new Promise<FclUser>((resolve, reject) => {
    const unsub = fcl.currentUser().subscribe((u: FclUser) => {
      if (u.loggedIn) {
        unsub();
        resolve(u);
      }
    });
    // Safety timeout — reject if wallet never returns.
    setTimeout(() => {
      unsub();
      reject(new Error("FCL authentication timed out after 120 s"));
    }, 120_000);
  });

  if (!user.addr) {
    throw new Error("FCL returned a logged-in session with no address");
  }

  const account: FlowAccount = {
    address: user.addr,
    publicKeyHex: "", // populated later if key-listing is needed
  };

  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(account));
  return account;
}

/**
 * Sign out of FCL and clear the cached account.
 */
export async function deleteAccount(): Promise<void> {
  fcl.unauthenticate();
  await SecureStore.deleteItemAsync(STORE_KEY);
}

/**
 * Return the currently logged-in FCL user, or null if not authenticated.
 * Does NOT re-authenticate — call `createAccount()` for that.
 */
export async function getCurrentUser(): Promise<FlowAccount | null> {
  return new Promise((resolve) => {
    const unsub = fcl.currentUser().subscribe((u: FclUser) => {
      unsub();
      if (u.loggedIn && u.addr) {
        resolve({ address: u.addr, publicKeyHex: "" });
      } else {
        resolve(null);
      }
    });
  });
}
