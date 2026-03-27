/// CreateRequest.cdc
/// Iris.ai — User deposits a FLOW micro-bounty and opens a vision request.
///
/// Arguments:
///   cid          — IPFS CID of the image uploaded via Storacha
///   bountyAmount — amount of FLOW tokens to lock as the bounty
///
/// The signer's FlowToken vault is debited by `bountyAmount`. Those tokens
/// are transferred atomically into the contract's escrow. On success the
/// new request ID is logged.

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import IrisBounty from "IrisBounty"

transaction(cid: String, bountyAmount: UFix64) {

    /// Reference to the signer's FlowToken vault (withdraw-entitled).
    let signerVault: auth(FungibleToken.Withdraw) &FlowToken.Vault

    /// Public handle on the contract's RequestManager.
    let manager: &{IrisBounty.RequestManagerPublic}

    /// Address of the signing account — stored for the createRequest call.
    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        // Borrow the signer's FlowToken vault with withdraw entitlement.
        self.signerVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("CreateRequest: signer does not have a FlowToken vault at /storage/flowTokenVault")

        // Borrow the IrisBounty RequestManager public capability.
        self.manager = getAccount(IrisBounty.contractAddress)
            .capabilities
            .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
            ?? panic("CreateRequest: could not borrow IrisBounty RequestManager")

        self.signerAddress = signer.address
    }

    execute {
        // Withdraw the bounty from the signer's vault.
        let bounty <- self.signerVault.withdraw(amount: bountyAmount)

        // Create the request — tokens transferred into escrow here.
        let id = self.manager.createRequest(
            requester: self.signerAddress,
            cid: cid,
            bounty: <-bounty
        )

        log("IrisBounty: created request #".concat(id.toString())
            .concat(" | CID: ").concat(cid)
            .concat(" | bounty: ").concat(bountyAmount.toString()).concat(" FLOW"))
    }
}
