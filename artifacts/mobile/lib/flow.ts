import type { FlowUser } from '@/context/AppContext';

interface FCLModule {
  config(settings: Record<string, string>): void;
  authenticate(): Promise<{ addr: string; loggedIn: boolean }>;
  unauthenticate(): Promise<void>;
  mutate(opts: {
    cadence: string;
    args?: (
      arg: (val: string, type: unknown) => unknown,
      t: { String: unknown }
    ) => unknown[];
    proposer?: unknown;
    payer?: unknown;
    authorizations?: unknown[];
    limit?: number;
  }): Promise<string>;
  authz: unknown;
}

const MOCK_USER: FlowUser = {
  addr: '0xf8d6e0586b0a20c7',
  loggedIn: true,
};

/**
 * Set EXPO_PUBLIC_USE_MOCK_FCL=true to bypass FCL entirely (UI demos, Expo Go).
 * By default the app attempts real Flow Testnet auth and falls back to mock on error.
 */
const USE_MOCK_FCL = process.env.EXPO_PUBLIC_USE_MOCK_FCL === 'true';

async function loadFCL(): Promise<FCLModule | null> {
  try {
    const mod = await import('@onflow/fcl');
    const fcl = (mod.default ?? mod) as FCLModule;
    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
      'app.detail.title': 'Iris.ai',
      'app.detail.icon': '',
    });
    return fcl;
  } catch (e) {
    console.warn('[Iris] FCL failed to load, using mock auth:', e);
    return null;
  }
}

function mockAuth(): Promise<FlowUser> {
  return new Promise<FlowUser>((resolve) =>
    setTimeout(() => resolve(MOCK_USER), 1000)
  );
}

export async function authenticate(): Promise<FlowUser> {
  if (USE_MOCK_FCL) {
    return mockAuth();
  }

  const fcl = await loadFCL();
  if (!fcl) return mockAuth();

  try {
    const user = await fcl.authenticate();
    return { addr: user.addr, loggedIn: !!user.loggedIn };
  } catch (e) {
    console.warn('[Iris] FCL authenticate failed, falling back to mock:', e);
    return mockAuth();
  }
}

export async function unauthenticate(): Promise<void> {
  if (USE_MOCK_FCL) return;

  const fcl = await loadFCL();
  if (!fcl) return;

  try {
    await fcl.unauthenticate();
  } catch (e) {
    console.warn('[Iris] FCL unauthenticate failed:', e);
  }
}

/**
 * Calls CreateRequest(cid: String) on the IrisBounty contract on Flow Testnet.
 * Falls back to a mock transaction when FCL is unavailable.
 */
export async function mintVisionNFT(cid: string): Promise<string> {
  if (USE_MOCK_FCL) {
    await new Promise<void>((r) => setTimeout(r, 800));
    const mockTxId = 'tx_' + Math.random().toString(36).slice(2, 18);
    console.log('[Iris] Mock FCL: CreateRequest(cid:', cid, ') → txId:', mockTxId);
    return mockTxId;
  }

  const fcl = await loadFCL();
  if (!fcl) {
    const fallbackTxId = 'tx_fallback_' + Math.random().toString(36).slice(2, 10);
    console.warn('[Iris] FCL unavailable, mock mint:', fallbackTxId);
    return fallbackTxId;
  }

  try {
    const contractAddress =
      process.env.EXPO_PUBLIC_IRIS_BOUNTY_ADDRESS ?? '0xYOUR_CONTRACT_ADDRESS';

    const txId = await fcl.mutate({
      cadence: `
        import IrisBounty from ${contractAddress}

        transaction(cid: String) {
          prepare(signer: &Account) {
            IrisBounty.createRequest(cid: cid, signer: signer)
          }
        }
      `,
      args: (arg, t) => [arg(cid, t.String)],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999,
    });
    return txId;
  } catch (e) {
    console.warn('[Iris] FCL mintVisionNFT failed, using mock tx:', e);
    return 'tx_error_fallback';
  }
}

export function formatAddr(addr: string): string {
  if (!addr || addr.length < 8) return '0x???';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}
