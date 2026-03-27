/**
 * flow-transactions.ts
 *
 * FCL-based transaction and script helpers for IrisBounty on Flow Testnet.
 *
 * All functions read the deployed contract address from:
 *   EXPO_PUBLIC_CONTRACT_ADDRESS  (set in .env after testnet deployment)
 *
 * IPFS bridge:
 *   uploadAndCreateRequest() is the primary UI entry point.
 *   It chains: Storacha upload → on-chain CreateRequest in one async call.
 *
 * Import order is intentional: FCL is require()'d to avoid missing TS
 * declaration errors (the package ships no .d.ts files).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const fcl = require("@onflow/fcl") as any;
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const t = require("@onflow/types") as any;
import { uploadVisionRequest } from "./storage";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function contractAddress(): string {
  const addr = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS;
  if (!addr) {
    throw new Error(
      "EXPO_PUBLIC_CONTRACT_ADDRESS is not set.\n" +
        "Deploy IrisBounty to testnet and add the address to .env."
    );
  }
  // Normalise: FCL addresses must start with 0x.
  return addr.startsWith("0x") ? addr : "0x" + addr;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequestInfo {
  id: string;         // UInt64 as decimal string
  requester: string;  // 0x-prefixed address
  cid: string;
  description: string;
  bountyAmount: string; // UFix64 as decimal string, e.g. "1.00000000"
  status: number;     // 0=open, 1=completed, 2=cancelled
  createdAt: string;
  completedAt: string | null;
  volunteer: string | null;
}

// ---------------------------------------------------------------------------
// Scripts (read-only)
// ---------------------------------------------------------------------------

/**
 * Fetch a single request by ID.
 * Returns null if the ID does not exist.
 */
export async function getRequestInfo(requestID: number): Promise<RequestInfo | null> {
  return fcl.query({
    cadence: `
      import IrisBounty from ${contractAddress()}

      access(all) fun main(requestID: UInt64): IrisBounty.RequestInfo? {
          let manager = getAccount(${contractAddress()})
              .capabilities
              .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
              ?? panic("Could not borrow IrisBounty manager")
          return manager.getRequestInfo(id: requestID)
      }
    `,
    args: (arg: typeof fcl.arg) => [arg(requestID.toString(), t.UInt64)],
  });
}

/**
 * Fetch all open requests.
 */
export async function getOpenRequests(): Promise<RequestInfo[]> {
  return fcl.query({
    cadence: `
      import IrisBounty from ${contractAddress()}

      access(all) fun main(): [IrisBounty.RequestInfo] {
          let manager = getAccount(${contractAddress()})
              .capabilities
              .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
              ?? panic("Could not borrow IrisBounty manager")
          return manager.getOpenRequests()
      }
    `,
    args: () => [],
  });
}

/**
 * Fetch all requests created by a specific requester address.
 */
export async function getRequestsByRequester(address: string): Promise<RequestInfo[]> {
  const addr = address.startsWith("0x") ? address : "0x" + address;
  return fcl.query({
    cadence: `
      import IrisBounty from ${contractAddress()}

      access(all) fun main(addr: Address): [IrisBounty.RequestInfo] {
          let manager = getAccount(${contractAddress()})
              .capabilities
              .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
              ?? panic("Could not borrow IrisBounty manager")
          return manager.getRequestsByRequester(address: addr)
      }
    `,
    args: (arg: typeof fcl.arg) => [arg(addr, t.Address)],
  });
}

/**
 * Returns the total number of requests ever created.
 */
export async function getTotalRequests(): Promise<number> {
  const raw: string = await fcl.query({
    cadence: `
      import IrisBounty from ${contractAddress()}

      access(all) fun main(): UInt64 {
          let manager = getAccount(${contractAddress()})
              .capabilities
              .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
              ?? panic("Could not borrow IrisBounty manager")
          return manager.getTotalRequests()
      }
    `,
    args: () => [],
  });
  return Number(raw);
}

// ---------------------------------------------------------------------------
// Transactions (state-changing)
// ---------------------------------------------------------------------------

/**
 * Create a new vision request, escrowing `bountyAmount` FLOW.
 *
 * The current FCL user (authenticated via flowPasskey.ts) signs the
 * transaction and pays the bounty from their FlowToken vault.
 *
 * @param cid           Storacha IPFS CID from uploadVisionRequest()
 * @param bountyAmount  FLOW amount as a UFix64 string, e.g. "0.5"
 * @returns             Transaction ID (txId)
 */
export async function createRequest(cid: string, bountyAmount: string): Promise<string> {
  const txId = await fcl.mutate({
    cadence: `
      import FungibleToken from "FungibleToken"
      import FlowToken from "FlowToken"
      import IrisBounty from ${contractAddress()}

      transaction(cid: String, bountyAmount: UFix64) {
          prepare(signer: auth(Storage) &Account) {
              let vault = signer.storage
                  .borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                      from: /storage/flowTokenVault
                  ) ?? panic("Could not borrow FlowToken vault")

              let bounty <- vault.withdraw(amount: bountyAmount)

              let manager = getAccount(${contractAddress()})
                  .capabilities
                  .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
                  ?? panic("Could not borrow IrisBounty manager")

              manager.createRequest(
                  requester: signer.address,
                  cid: cid,
                  bounty: <-bounty
              )
          }
      }
    `,
    args: (arg: typeof fcl.arg) => [
      arg(cid, t.String),
      arg(bountyAmount, t.UFix64),
    ],
    proposer: fcl.currentUser,
    payer: fcl.currentUser,
    authorizations: [fcl.currentUser],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();
  return txId;
}

/**
 * Claim the bounty for a completed vision request.
 *
 * The current FCL user is the volunteer — they provide the AI description
 * and receive the escrowed FLOW into their FlowToken vault.
 *
 * @param requestID   The UInt64 ID of the request to complete
 * @param description AI-generated description of the image
 * @returns           Transaction ID
 */
export async function claimBounty(requestID: number, description: string): Promise<string> {
  const txId = await fcl.mutate({
    cadence: `
      import FungibleToken from "FungibleToken"
      import FlowToken from "FlowToken"
      import IrisBounty from ${contractAddress()}

      transaction(requestID: UInt64, description: String) {
          prepare(signer: auth(Storage) &Account) {
              let recipientVault = signer.storage
                  .borrow<&{FungibleToken.Receiver}>(from: /storage/flowTokenVault)
                  ?? panic("Could not borrow FlowToken receiver vault")

              let manager = getAccount(${contractAddress()})
                  .capabilities
                  .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
                  ?? panic("Could not borrow IrisBounty manager")

              manager.claimBounty(
                  requestID: requestID,
                  volunteer: signer.address,
                  description: description,
                  recipientVault: recipientVault
              )
          }
      }
    `,
    args: (arg: typeof fcl.arg) => [
      arg(requestID.toString(), t.UInt64),
      arg(description, t.String),
    ],
    proposer: fcl.currentUser,
    payer: fcl.currentUser,
    authorizations: [fcl.currentUser],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();
  return txId;
}

/**
 * Cancel an open request and reclaim the escrowed bounty.
 *
 * Only the original requester can cancel. The FLOW is returned to
 * their FlowToken vault.
 *
 * @param requestID  The UInt64 ID of the request to cancel
 * @returns          Transaction ID
 */
export async function cancelRequest(requestID: number): Promise<string> {
  const txId = await fcl.mutate({
    cadence: `
      import FungibleToken from "FungibleToken"
      import FlowToken from "FlowToken"
      import IrisBounty from ${contractAddress()}

      transaction(requestID: UInt64) {
          prepare(signer: auth(Storage) &Account) {
              let refundVault = signer.storage
                  .borrow<&{FungibleToken.Receiver}>(from: /storage/flowTokenVault)
                  ?? panic("Could not borrow FlowToken refund vault")

              let manager = getAccount(${contractAddress()})
                  .capabilities
                  .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
                  ?? panic("Could not borrow IrisBounty manager")

              manager.cancelRequest(
                  requestID: requestID,
                  requester: signer.address,
                  refundVault: refundVault
              )
          }
      }
    `,
    args: (arg: typeof fcl.arg) => [arg(requestID.toString(), t.UInt64)],
    proposer: fcl.currentUser,
    payer: fcl.currentUser,
    authorizations: [fcl.currentUser],
    limit: 999,
  });

  await fcl.tx(txId).onceSealed();
  return txId;
}

// ---------------------------------------------------------------------------
// IPFS Bridge — Storacha upload → on-chain CreateRequest in one call
// ---------------------------------------------------------------------------

export interface CreateRequestResult {
  /** IPFS CID stored on-chain — use ipfsUrl(cid) to preview the image. */
  cid: string;
  /** w3s.link gateway URL for immediate image display. */
  imageUrl: string;
  /** Flow transaction ID — link to https://testnet.flowdiver.io/tx/<txId> */
  txId: string;
  /** On-chain request ID returned by IrisBounty.createRequest(). */
  requestID: number;
}

/**
 * Upload an image to Storacha/IPFS and create an IrisBounty request in one
 * atomic user flow.
 *
 * Steps:
 *   1. Upload `imageUri` to Storacha → receive IPFS CID
 *   2. Submit CreateRequest transaction to Flow testnet with the CID
 *   3. Wait for the transaction to seal and return all relevant identifiers
 *
 * @param imageUri     Local file URI from expo-camera / expo-image-picker
 * @param bountyAmount FLOW amount as a UFix64 string, e.g. "0.5"
 * @returns            CID, gateway URL, txId, and on-chain requestID
 *
 * @throws If the Storacha upload fails, the FCL user is not authenticated,
 *         or the Flow transaction is reverted.
 */
export async function uploadAndCreateRequest(
  imageUri: string,
  bountyAmount: string
): Promise<CreateRequestResult> {
  // Step 1: Upload image to Storacha and get the IPFS CID.
  const { cid, url: imageUrl } = await uploadVisionRequest(imageUri);

  // Step 2: Read the total requests BEFORE the transaction so we know the
  //         new request's ID (IrisBounty assigns IDs as sequential UInt64).
  const idBefore = await getTotalRequests();

  // Step 3: Submit the on-chain CreateRequest transaction.
  const txId = await createRequest(cid, bountyAmount);

  return {
    cid,
    imageUrl,
    txId,
    requestID: idBefore, // IDs are 0-indexed: next ID == totalRequests before tx
  };
}
