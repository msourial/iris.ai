/// IrisBounty.cdc
/// Iris.ai — Vision Request Bounty Escrow
///
/// State machine per request:
///   Open ──► Completed  (volunteer calls ClaimBounty transaction)
///   Open ──► Cancelled  (requester calls CancelRequest transaction)
///
/// Design note: totalRequests and minimumBounty live inside the RequestManager
/// resource (accessed via self.*) rather than at contract level. This avoids
/// IrisBounty.X self-references within resource methods, which the test
/// framework's emulator cannot resolve during compilation-before-deployment.
///
/// Cadence 1.0 Entitlements:
///   Volunteer — required to call VisionRequest.complete()
///   Requester — required to call VisionRequest.cancel()
///   RequestManager is the sole gatekeeper: it holds the requests dict
///   (access(self)) and therefore issues itself auth references of either
///   type. External callers can never obtain auth(&VisionRequest) directly.

import FungibleToken from "FungibleToken"
import ViewResolver from "ViewResolver"
import MetadataViews from "MetadataViews"

access(all) contract IrisBounty {

    // -------------------------------------------------------------------------
    // Entitlements
    // -------------------------------------------------------------------------

    /// Grants the right to call VisionRequest.complete() — i.e., to record an
    /// AI description and withdraw the escrow as a volunteer payout.
    access(all) entitlement Volunteer

    /// Grants the right to call VisionRequest.cancel() — i.e., to mark the
    /// request cancelled and withdraw the escrow as a refund to the requester.
    access(all) entitlement Requester

    // -------------------------------------------------------------------------
    // Events  (enriched for frontend indexing)
    // -------------------------------------------------------------------------

    access(all) event RequestCreated(
        id: UInt64,
        requester: Address,
        cid: String,
        bountyAmount: UFix64,
        createdAt: UFix64,
        /// Pre-built gateway URL so listeners can render the image immediately.
        gatewayURL: String
    )

    access(all) event RequestCompleted(
        id: UInt64,
        volunteer: Address,
        /// Requester included so listeners can correlate without re-scanning.
        requester: Address,
        cid: String,
        /// AI description written by the volunteer.
        description: String,
        bountyAmount: UFix64,
        completedAt: UFix64
    )

    access(all) event RequestCancelled(
        id: UInt64,
        requester: Address,
        /// CID included so listeners can invalidate any cached image state.
        cid: String,
        bountyAmount: UFix64,
        cancelledAt: UFix64
    )

    // -------------------------------------------------------------------------
    // Contract-level storage paths (no state vars — avoids self-ref at deploy)
    // -------------------------------------------------------------------------

    access(all) let RequestManagerStoragePath: StoragePath
    access(all) let RequestManagerPublicPath: PublicPath

    /// Public address of this contract's account — safe to read from transactions.
    access(all) let contractAddress: Address

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    access(all) enum RequestStatus: UInt8 {
        access(all) case open
        access(all) case completed
        access(all) case cancelled
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    /// Read-only snapshot of a VisionRequest — safe to return from scripts.
    /// view init: only field assignments, no side effects — allows toInfo()
    /// and getRequestInfo() to remain view functions.
    access(all) struct RequestInfo {
        access(all) let id: UInt64
        access(all) let requester: Address
        access(all) let cid: String
        access(all) let description: String
        access(all) let bountyAmount: UFix64
        access(all) let status: RequestStatus
        access(all) let createdAt: UFix64
        access(all) let completedAt: UFix64?
        access(all) let volunteer: Address?

        view init(
            id: UInt64,
            requester: Address,
            cid: String,
            description: String,
            bountyAmount: UFix64,
            status: RequestStatus,
            createdAt: UFix64,
            completedAt: UFix64?,
            volunteer: Address?
        ) {
            self.id = id
            self.requester = requester
            self.cid = cid
            self.description = description
            self.bountyAmount = bountyAmount
            self.status = status
            self.createdAt = createdAt
            self.completedAt = completedAt
            self.volunteer = volunteer
        }
    }

    // -------------------------------------------------------------------------
    // VisionRequest Resource
    // -------------------------------------------------------------------------

    access(all) resource VisionRequest: ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let requester: Address
        access(all) let cid: String
        access(all) var description: String
        access(all) let bountyAmount: UFix64
        access(self) var escrow: @{FungibleToken.Vault}
        access(all) var status: RequestStatus
        access(all) let createdAt: UFix64
        access(all) var completedAt: UFix64?
        access(all) var volunteer: Address?

        init(
            id: UInt64,
            requester: Address,
            cid: String,
            bounty: @{FungibleToken.Vault}
        ) {
            self.id = id
            self.requester = requester
            self.cid = cid
            self.description = ""
            self.bountyAmount = bounty.balance
            self.escrow <- bounty
            self.status = RequestStatus.open
            self.createdAt = getCurrentBlock().timestamp
            self.completedAt = nil
            self.volunteer = nil
        }

        // ------------------------------------------------------------------
        // Entitlement-gated write methods
        //
        // access(Volunteer) / access(Requester) means a caller must hold an
        // auth(&VisionRequest) bearing the matching entitlement. Only
        // RequestManager can issue such references (it owns the requests dict).
        // ------------------------------------------------------------------

        /// Record the AI description and release escrow to the volunteer.
        access(Volunteer) fun complete(
            volunteer: Address,
            description: String
        ): @{FungibleToken.Vault} {
            pre {
                self.status == RequestStatus.open:
                    "IrisBounty: request is not open"
                description.length > 0:
                    "IrisBounty: description cannot be empty"
                volunteer != self.requester:
                    "IrisBounty: requester cannot claim their own bounty"
            }
            self.status = RequestStatus.completed
            self.volunteer = volunteer
            self.description = description
            self.completedAt = getCurrentBlock().timestamp
            let payout <- self.escrow.withdraw(amount: self.escrow.balance)
            return <-payout
        }

        /// Mark cancelled and release escrow back to the requester.
        access(Requester) fun cancel(): @{FungibleToken.Vault} {
            pre {
                self.status == RequestStatus.open:
                    "IrisBounty: request is not open"
            }
            self.status = RequestStatus.cancelled
            let refund <- self.escrow.withdraw(amount: self.escrow.balance)
            return <-refund
        }

        // ------------------------------------------------------------------
        // MetadataViews — ViewResolver.Resolver implementation
        // ------------------------------------------------------------------

        /// Four supported view types:
        ///   Display     — name, description, HTTP thumbnail for wallets/explorers
        ///   ExternalURL — direct w3s.link IPFS gateway link
        ///   HTTPFile    — raw HTTP image URL (used by marketplaces that prefer HTTP)
        ///   Traits      — bountyAmount, status, cid as on-chain searchable traits
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.HTTPFile>(),
                Type<MetadataViews.Traits>()
            ]
        }

        /// Resolves a metadata view.
        ///
        /// Display     — thumbnail is an HTTPFile pointing to the w3s.link gateway
        ///               so wallets and block explorers render the image inline.
        ///               Description shows the AI output once completed, or a
        ///               pending placeholder for open requests.
        ///
        /// ExternalURL — links to the full image page on the IPFS gateway.
        ///
        /// HTTPFile    — the raw image URL; useful for marketplaces / dApps that
        ///               consume a plain HTTP URL rather than an IPFS CID.
        ///
        /// Traits      — structured on-chain attributes for explorer search/filter:
        ///               bountyAmount (number), status (string), cid (string).
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            let gatewayURL = "https://w3s.link/ipfs/".concat(self.cid)

            switch view {
                case Type<MetadataViews.Display>():
                    let thumb = MetadataViews.HTTPFile(url: gatewayURL)
                    let desc = self.description.length > 0
                        ? self.description
                        : "Open vision request — AI description pending"
                    return MetadataViews.Display(
                        name: "Iris.ai Request #".concat(self.id.toString()),
                        description: desc,
                        thumbnail: thumb
                    )

                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL(gatewayURL)

                case Type<MetadataViews.HTTPFile>():
                    return MetadataViews.HTTPFile(url: gatewayURL)

                case Type<MetadataViews.Traits>():
                    return MetadataViews.Traits([
                        MetadataViews.Trait(
                            name: "bountyAmount",
                            value: self.bountyAmount,
                            displayType: "number",
                            rarity: nil
                        ),
                        MetadataViews.Trait(
                            name: "status",
                            value: self.status.rawValue.toString(),
                            displayType: "string",
                            rarity: nil
                        ),
                        MetadataViews.Trait(
                            name: "cid",
                            value: self.cid,
                            displayType: "string",
                            rarity: nil
                        )
                    ])

                default:
                    return nil
            }
        }

        // ------------------------------------------------------------------

        /// view-safe: RequestInfo.init is view, no side effects.
        access(all) view fun toInfo(): RequestInfo {
            return RequestInfo(
                id: self.id,
                requester: self.requester,
                cid: self.cid,
                description: self.description,
                bountyAmount: self.bountyAmount,
                status: self.status,
                createdAt: self.createdAt,
                completedAt: self.completedAt,
                volunteer: self.volunteer
            )
        }
    }

    // -------------------------------------------------------------------------
    // RequestManager Public Interface
    // -------------------------------------------------------------------------

    access(all) resource interface RequestManagerPublic {
        access(all) fun createRequest(
            requester: Address,
            cid: String,
            bounty: @{FungibleToken.Vault}
        ): UInt64

        access(all) fun claimBounty(
            requestID: UInt64,
            volunteer: Address,
            description: String,
            recipientVault: &{FungibleToken.Receiver}
        )

        access(all) fun cancelRequest(
            requestID: UInt64,
            requester: Address,
            refundVault: &{FungibleToken.Receiver}
        )

        /// Array-building — Array.append is not pure, cannot be view.
        /// Scripts (read-only, not strict-view) may call these freely.
        access(all) fun getOpenRequests(): [RequestInfo]
        access(all) fun getRequestsByRequester(address: Address): [RequestInfo]

        /// Single-item lookup — toInfo() is view, so these remain view.
        access(all) view fun getRequestInfo(id: UInt64): RequestInfo?
        access(all) view fun getTotalRequests(): UInt64
        access(all) view fun getMinimumBounty(): UFix64

        /// Borrow a VisionRequest as a ViewResolver.Resolver so callers can
        /// invoke resolveView() without the manager needing to expose the resource
        /// itself. Returns nil if the request ID does not exist.
        access(all) view fun borrowRequest(_ id: UInt64): &{ViewResolver.Resolver}?
    }

    // -------------------------------------------------------------------------
    // RequestManager Resource
    // -------------------------------------------------------------------------

    access(all) resource RequestManager: RequestManagerPublic {

        /// Monotonic counter — lives here to avoid IrisBounty.X self-references.
        access(all) var totalRequests: UInt64

        /// Minimum bounty — also here for the same reason.
        access(all) let minimumBounty: UFix64

        access(self) var requests: @{UInt64: VisionRequest}

        init() {
            self.totalRequests = 0
            self.minimumBounty = 0.001   // 0.001 FLOW minimum
            self.requests <- {}
        }

        // ------------------------------------------------------------------
        // Write: User — create a new vision request
        // ------------------------------------------------------------------

        access(all) fun createRequest(
            requester: Address,
            cid: String,
            bounty: @{FungibleToken.Vault}
        ): UInt64 {
            pre {
                cid.length > 0:
                    "IrisBounty: CID cannot be empty"
                bounty.balance >= self.minimumBounty:
                    "IrisBounty: bounty must be at least "
                    .concat(self.minimumBounty.toString())
                    .concat(" FLOW")
            }

            let id = self.totalRequests
            self.totalRequests = self.totalRequests + 1

            let bountyAmount = bounty.balance
            let ts = getCurrentBlock().timestamp

            let request <- create VisionRequest(
                id: id,
                requester: requester,
                cid: cid,
                bounty: <-bounty
            )
            self.requests[id] <-! request

            emit RequestCreated(
                id: id,
                requester: requester,
                cid: cid,
                bountyAmount: bountyAmount,
                createdAt: ts,
                gatewayURL: "https://w3s.link/ipfs/".concat(cid)
            )
            return id
        }

        // ------------------------------------------------------------------
        // Write: Volunteer — complete a request and claim the bounty
        //
        // Issues an auth(Volunteer) reference to the stored VisionRequest.
        // This is safe because RequestManager owns the requests dict
        // (access(self)) and has verified the pre-conditions below.
        // ------------------------------------------------------------------

        access(all) fun claimBounty(
            requestID: UInt64,
            volunteer: Address,
            description: String,
            recipientVault: &{FungibleToken.Receiver}
        ) {
            pre {
                self.requests[requestID] != nil:
                    "IrisBounty: request does not exist"
            }

            // auth(Volunteer) reference — grants access to complete().
            let reqRef = (&self.requests[requestID] as auth(Volunteer) &VisionRequest?)!

            let bountyAmount = reqRef.bountyAmount
            let requesterAddr = reqRef.requester
            let cid = reqRef.cid
            let ts = getCurrentBlock().timestamp

            let payout <- reqRef.complete(volunteer: volunteer, description: description)
            recipientVault.deposit(from: <-payout)

            emit RequestCompleted(
                id: requestID,
                volunteer: volunteer,
                requester: requesterAddr,
                cid: cid,
                description: description,
                bountyAmount: bountyAmount,
                completedAt: ts
            )
        }

        // ------------------------------------------------------------------
        // Write: Requester — cancel an open request and reclaim the bounty
        //
        // Issues an auth(Requester) reference to the stored VisionRequest.
        // Ownership and requester-identity are validated before cancel() fires.
        // ------------------------------------------------------------------

        access(all) fun cancelRequest(
            requestID: UInt64,
            requester: Address,
            refundVault: &{FungibleToken.Receiver}
        ) {
            pre {
                self.requests[requestID] != nil:
                    "IrisBounty: request does not exist"
            }

            // auth(Requester) reference — grants access to cancel().
            let reqRef = (&self.requests[requestID] as auth(Requester) &VisionRequest?)!

            assert(
                reqRef.requester == requester,
                message: "IrisBounty: only the requester can cancel this request"
            )

            let bountyAmount = reqRef.bountyAmount
            let cid = reqRef.cid
            let ts = getCurrentBlock().timestamp

            let refund <- reqRef.cancel()
            refundVault.deposit(from: <-refund)

            emit RequestCancelled(
                id: requestID,
                requester: requester,
                cid: cid,
                bountyAmount: bountyAmount,
                cancelledAt: ts
            )
        }

        // ------------------------------------------------------------------
        // Read
        // ------------------------------------------------------------------

        access(all) fun getOpenRequests(): [RequestInfo] {
            var result: [RequestInfo] = []
            for id in self.requests.keys {
                let ref = (&self.requests[id] as &VisionRequest?)!
                if ref.status == RequestStatus.open {
                    result.append(ref.toInfo())
                }
            }
            return result
        }

        access(all) view fun getRequestInfo(id: UInt64): RequestInfo? {
            if let ref = &self.requests[id] as &VisionRequest? {
                return ref.toInfo()
            }
            return nil
        }

        access(all) fun getRequestsByRequester(address: Address): [RequestInfo] {
            var result: [RequestInfo] = []
            for id in self.requests.keys {
                let ref = (&self.requests[id] as &VisionRequest?)!
                if ref.requester == address {
                    result.append(ref.toInfo())
                }
            }
            return result
        }

        access(all) view fun getTotalRequests(): UInt64 {
            return self.totalRequests
        }

        access(all) view fun getMinimumBounty(): UFix64 {
            return self.minimumBounty
        }

        access(all) view fun borrowRequest(_ id: UInt64): &{ViewResolver.Resolver}? {
            if let ref = &self.requests[id] as &VisionRequest? {
                return ref
            }
            return nil
        }
    }

    // -------------------------------------------------------------------------
    // Contract initializer
    // -------------------------------------------------------------------------

    init() {
        self.RequestManagerStoragePath = /storage/IrisBountyManager
        self.RequestManagerPublicPath  = /public/IrisBountyManager
        self.contractAddress = self.account.address

        self.account.storage.save(
            <-create RequestManager(),
            to: self.RequestManagerStoragePath
        )

        let cap = self.account.capabilities.storage.issue<&{RequestManagerPublic}>(
            self.RequestManagerStoragePath
        )
        self.account.capabilities.publish(cap, at: self.RequestManagerPublicPath)
    }
}
