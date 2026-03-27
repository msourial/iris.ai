/// GetOpenRequests.cdc
/// Iris.ai — Returns all currently open VisionRequests.
///
/// Arguments:
///   contractAddress — deployed address of IrisBounty
///
/// Returns an array of RequestInfo structs. Each struct is a read-only
/// snapshot; callers cannot mutate contract state via scripts.

import IrisBounty from "IrisBounty"

access(all) fun main(contractAddress: Address): [IrisBounty.RequestInfo] {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
        ?? panic("GetOpenRequests: could not borrow IrisBounty RequestManager at address "
            .concat(contractAddress.toString()))

    return manager.getOpenRequests()
}
