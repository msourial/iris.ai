/// GetRequestByID.cdc
/// Iris.ai — Returns a single VisionRequest by its ID.
///
/// Arguments:
///   contractAddress — deployed address of IrisBounty
///   requestID       — the UInt64 ID of the request
///
/// Returns nil if the ID does not exist.

import IrisBounty from "IrisBounty"

access(all) fun main(contractAddress: Address, requestID: UInt64): IrisBounty.RequestInfo? {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
        ?? panic("GetRequestByID: could not borrow IrisBounty RequestManager at address "
            .concat(contractAddress.toString()))

    return manager.getRequestInfo(id: requestID)
}
