/// ClaimBounty.cdc
/// Iris.ai — Volunteer marks a vision request complete and claims the bounty.
///
/// Arguments:
///   requestID   — ID of the open VisionRequest to complete
///   description — AI-generated scene description (must be non-empty)
///
/// The signer is the volunteer. Their FlowToken receiver vault is credited
/// with the full escrowed bounty atomically. The request is permanently
/// recorded on-chain with status = completed.

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import IrisBounty from "IrisBounty"

transaction(requestID: UInt64, description: String) {

    /// Receiver reference — bounty will be deposited here.
    let volunteerReceiver: &{FungibleToken.Receiver}

    /// Public handle on the contract's RequestManager.
    let manager: &{IrisBounty.RequestManagerPublic}

    /// Address of the signing volunteer.
    let volunteerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        // Borrow the volunteer's FlowToken receiver.
        // Most accounts expose this at the standard public path.
        self.volunteerReceiver = signer.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("ClaimBounty: signer does not have a FlowToken vault at /storage/flowTokenVault")

        // Borrow the IrisBounty RequestManager.
        self.manager = getAccount(IrisBounty.contractAddress)
            .capabilities
            .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
            ?? panic("ClaimBounty: could not borrow IrisBounty RequestManager")

        self.volunteerAddress = signer.address
    }

    pre {
        description.length > 0: "ClaimBounty: description must not be empty"
    }

    execute {
        self.manager.claimBounty(
            requestID: requestID,
            volunteer: self.volunteerAddress,
            description: description,
            recipientVault: self.volunteerReceiver
        )

        log("IrisBounty: volunteer ".concat(self.volunteerAddress.toString())
            .concat(" claimed bounty for request #").concat(requestID.toString()))
    }
}
