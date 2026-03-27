/// CancelRequest.cdc
/// Iris.ai — Original requester cancels an open vision request and reclaims
/// the full bounty.
///
/// Arguments:
///   requestID — ID of the open VisionRequest to cancel
///
/// The contract verifies that the transaction signer is the original requester.
/// The full escrowed bounty is returned to the signer's FlowToken vault.
/// The request is permanently recorded on-chain with status = cancelled.

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import IrisBounty from "IrisBounty"

transaction(requestID: UInt64) {

    /// Signer's FlowToken vault — refund is deposited here.
    let signerVault: &FlowToken.Vault

    /// Public handle on the contract's RequestManager.
    let manager: &{IrisBounty.RequestManagerPublic}

    /// Address of the signing requester (used to verify ownership).
    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        // Borrow the signer's FlowToken vault (as receiver for the refund).
        self.signerVault = signer.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("CancelRequest: signer does not have a FlowToken vault at /storage/flowTokenVault")

        // Borrow the IrisBounty RequestManager.
        self.manager = getAccount(IrisBounty.contractAddress)
            .capabilities
            .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
            ?? panic("CancelRequest: could not borrow IrisBounty RequestManager")

        self.signerAddress = signer.address
    }

    execute {
        self.manager.cancelRequest(
            requestID: requestID,
            requester: self.signerAddress,
            refundVault: self.signerVault
        )

        log("IrisBounty: requester ".concat(self.signerAddress.toString())
            .concat(" cancelled request #").concat(requestID.toString())
            .concat(" — bounty refunded"))
    }
}
