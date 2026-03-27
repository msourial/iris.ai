/// GetUserRequests.cdc
/// Iris.ai — Returns all VisionRequests (any status) created by a given address.
///
/// Arguments:
///   contractAddress  — deployed address of IrisBounty
///   requesterAddress — the user whose request history to fetch
///
/// Useful for populating the History screen in the app.

import IrisBounty from "IrisBounty"

access(all) fun main(contractAddress: Address, requesterAddress: Address): [IrisBounty.RequestInfo] {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)
        ?? panic("GetUserRequests: could not borrow IrisBounty RequestManager at address "
            .concat(contractAddress.toString()))

    return manager.getRequestsByRequester(address: requesterAddress)
}
