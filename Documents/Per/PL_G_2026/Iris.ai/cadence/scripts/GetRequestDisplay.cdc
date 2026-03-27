/// GetRequestDisplay.cdc
/// Iris.ai — Resolve the MetadataViews.Display view for a VisionRequest.
///
/// Returns a Display struct containing:
///   name        — "Iris.ai Request #<id>"
///   description — AI description (open requests show a placeholder)
///   thumbnail   — MetadataViews.IPFSFile with the Storacha CID
///
/// Arguments:
///   contractAddress — deployed address of IrisBounty
///   requestID       — the UInt64 ID of the VisionRequest

import IrisBounty from "IrisBounty"
import MetadataViews from "MetadataViews"

access(all) fun main(contractAddress: Address, requestID: UInt64): MetadataViews.Display {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
        ?? panic("GetRequestDisplay: could not borrow IrisBounty RequestManager at "
            .concat(contractAddress.toString()))

    let resolver = manager.borrowRequest(requestID)
        ?? panic("GetRequestDisplay: request #".concat(requestID.toString()).concat(" not found"))

    let view = resolver.resolveView(Type<MetadataViews.Display>())
        ?? panic("GetRequestDisplay: Display view not supported")

    return view as! MetadataViews.Display
}
