import type { FlowUser } from '@/context/AppContext';

/**
 * Set to false to use real @onflow/fcl with Flow Testnet.
 * Default true for Expo Go stability — mock auth returns a fake wallet address.
 */
export const USE_MOCK_FCL = true;

const MOCK_USER: FlowUser = {
  addr: '0xf8d6e0586b0a20c7',
  loggedIn: true,
};

export async function authenticate(): Promise<FlowUser> {
  if (USE_MOCK_FCL) {
    await new Promise<void>((r) => setTimeout(r, 1500));
    return MOCK_USER;
  }

  try {
    const fclModule = await import('@onflow/fcl');
    const fcl = (fclModule as any).default ?? fclModule;

    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
      'app.detail.title': 'Iris.ai',
      'app.detail.icon': '',
    });

    const user = await fcl.authenticate();
    return { addr: user.addr, loggedIn: !!user.loggedIn };
  } catch (e) {
    console.warn('[Iris] FCL failed, using mock auth:', e);
    return MOCK_USER;
  }
}

export async function unauthenticate(): Promise<void> {
  if (USE_MOCK_FCL) return;
  try {
    const fclModule = await import('@onflow/fcl');
    const fcl = (fclModule as any).default ?? fclModule;
    await fcl.unauthenticate();
  } catch (e) {
    console.warn('[Iris] FCL unauthenticate failed:', e);
  }
}

/**
 * Calls CreateRequest(cid: String) on the IrisBounty contract.
 * Mocked by default.
 */
export async function mintVisionNFT(cid: string): Promise<string> {
  if (USE_MOCK_FCL) {
    await new Promise<void>((r) => setTimeout(r, 800));
    const mockTxId = 'tx_' + Math.random().toString(36).substr(2, 16);
    console.log('[Iris] Mock FCL: CreateRequest(cid:', cid, ') → txId:', mockTxId);
    return mockTxId;
  }

  try {
    const fclModule = await import('@onflow/fcl');
    const fcl = (fclModule as any).default ?? fclModule;

    const txId = await fcl.mutate({
      cadence: `
        import IrisBounty from 0xYOUR_CONTRACT_ADDRESS
        transaction(cid: String) {
          prepare(signer: AuthAccount) {
            IrisBounty.createRequest(cid: cid, signer: signer)
          }
        }
      `,
      args: (arg: any, t: any) => [arg(cid, t.String)],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999,
    });
    return txId;
  } catch (e) {
    console.warn('[Iris] FCL mintVisionNFT failed:', e);
    return 'mock_fallback_tx';
  }
}

export function formatAddr(addr: string): string {
  if (!addr) return '0x???';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}
