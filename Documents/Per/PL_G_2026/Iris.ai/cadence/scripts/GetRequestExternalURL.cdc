/// GetRequestExternalURL.cdc
/// Iris.ai — Resolve the MetadataViews.ExternalURL view for a VisionRequest.
///
/// Returns the gateway URL for the IPFS image:
///   "https://w3s.link/ipfs/<cid>"
///
/// Arguments:
///   contractAddress — deployed address of IrisBounty
///   requestID       — the UInt64 ID of the VisionRequest

import IrisBounty from "IrisBounty"
import MetadataViews from "MetadataViews"

access(all) fun main(contractAddress: Address, requestID: UInt64): String {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
        ?? panic("GetRequestExternalURL: could not borrow IrisBounty RequestManager at "
            .concat(contractAddress.toString()))

    let resolver = manager.borrowRequest(requestID)
        ?? panic("GetRequestExternalURL: request #".concat(requestID.toString()).concat(" not found"))

    let view = resolver.resolveView(Type<MetadataViews.ExternalURL>())
        ?? panic("GetRequestExternalURL: ExternalURL view not supported")

    return (view as! MetadataViews.ExternalURL).url
}
