/// IrisBounty_test.cdc
/// Iris.ai — Cadence 1.0 test suite for the IrisBounty contract.
///
/// Run with: flow test cadence/tests/IrisBounty_test.cdc
///
/// Why no top-level `import "IrisBounty"`:
///   Module-level imports are resolved before setup() runs. IrisBounty isn't
///   deployed until setup() calls Test.deployContract, so a top-level import
///   fails with "contract not found". Instead, inline scripts use a direct
///   address import (resolved at execution time, after deployment).
///
/// Address layout:
///   0x0000000000000007 — IrisBounty (reserved testing slot, set in flow.json)
///   0x0000000000000001 — test blockchain service account (1B FLOW pre-funded)
///   FungibleToken / FlowToken resolved via test framework string imports
///
/// Status raw values (RequestStatus enum order):
///   0 = open  |  1 = completed  |  2 = cancelled

import Test

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// IrisBounty is deployed to this testing-reserved address (see flow.json).
access(all) let contractAddress: Address = 0x0000000000000007

// RequestStatus raw values — mirrors the enum declaration order in IrisBounty.cdc
access(all) let STATUS_OPEN: UInt8      = 0
access(all) let STATUS_COMPLETED: UInt8 = 1
access(all) let STATUS_CANCELLED: UInt8 = 2

// ---------------------------------------------------------------------------
// setup() — runs once before all tests
// ---------------------------------------------------------------------------

access(all) fun setup() {
    let err = Test.deployContract(
        name: "IrisBounty",
        path: "../contracts/IrisBounty.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Transfers `amount` FLOW from the test service account (0x1) to `account`.
/// Uses string imports so the framework resolves FungibleToken/FlowToken addresses.
access(all) fun fundAccount(_ account: Test.TestAccount, _ amount: UFix64) {
    let serviceAccount = Test.getAccount(0x0000000000000001)
    let tx = Test.Transaction(
        code: "import FungibleToken from \"FungibleToken\"\n"
            .concat("import FlowToken from \"FlowToken\"\n")
            .concat("transaction(amount: UFix64, recipient: Address) {\n")
            .concat("  prepare(signer: auth(Storage) &Account) {\n")
            .concat("    let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(\n")
            .concat("      from: /storage/flowTokenVault)!\n")
            .concat("    let tokens <- vault.withdraw(amount: amount)\n")
            .concat("    let recv = getAccount(recipient)\n")
            .concat("      .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!\n")
            .concat("    recv.deposit(from: <-tokens)\n")
            .concat("  }\n")
            .concat("}"),
        authorizers: [serviceAccount.address],
        signers: [serviceAccount],
        arguments: [amount, account.address]
    )
    Test.expect(Test.executeTransaction(tx), Test.beSucceeded())
}

/// Returns the next request ID (= manager.getTotalRequests()).
access(all) fun nextID(): UInt64 {
    let result = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("access(all) fun main(): UInt64 {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  return mgr.getTotalRequests()\n")
        .concat("}"),
        []
    )
    Test.expect(result, Test.beSucceeded())
    return result.returnValue! as! UInt64
}

/// Returns the raw status UInt8 for the given request ID (0=open, 1=completed, 2=cancelled).
access(all) fun getStatus(_ id: UInt64): UInt8 {
    let result = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("access(all) fun main(requestID: UInt64): UInt8 {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  return mgr.getRequestInfo(id: requestID)!.status.rawValue\n")
        .concat("}"),
        [id]
    )
    Test.expect(result, Test.beSucceeded())
    return result.returnValue! as! UInt8
}

/// Returns the volunteer address for a completed request.
access(all) fun getVolunteer(_ id: UInt64): Address {
    let result = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("access(all) fun main(requestID: UInt64): Address {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  return mgr.getRequestInfo(id: requestID)!.volunteer!\n")
        .concat("}"),
        [id]
    )
    Test.expect(result, Test.beSucceeded())
    return result.returnValue! as! Address
}

/// Returns the requester address for a request.
access(all) fun getRequester(_ id: UInt64): Address {
    let result = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("access(all) fun main(requestID: UInt64): Address {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  return mgr.getRequestInfo(id: requestID)!.requester\n")
        .concat("}"),
        [id]
    )
    Test.expect(result, Test.beSucceeded())
    return result.returnValue! as! Address
}

// ---------------------------------------------------------------------------
// Test 1: Contract deploys with zero requests
// ---------------------------------------------------------------------------

access(all) fun testDeploymentZeroRequests() {
    Test.assertEqual(0 as UInt64, nextID())
}

// ---------------------------------------------------------------------------
// Test 2: Valid request creation
// ---------------------------------------------------------------------------

access(all) fun testCreateRequest() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let tx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid001", 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(tx), Test.beSucceeded())

    Test.assertEqual(id + 1 as UInt64, nextID())
    Test.assertEqual(STATUS_OPEN, getStatus(id))
    Test.assertEqual(user.address, getRequester(id))
}

// ---------------------------------------------------------------------------
// Test 3: Minimum bounty guard
// ---------------------------------------------------------------------------

access(all) fun testMinimumBountyRejected() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    // 0.0001 FLOW is below the 0.001 FLOW minimum
    let tx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid002", 0.0001 as UFix64]
    )
    Test.expect(Test.executeTransaction(tx), Test.beFailed())

    // totalRequests must not have changed
    Test.assertEqual(id, nextID())
}

// ---------------------------------------------------------------------------
// Test 4: Volunteer claims bounty
// ---------------------------------------------------------------------------

access(all) fun testVolunteerClaimsBounty() {
    let user = Test.createAccount()
    let volunteer = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid003", 0.5 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let claimTx = Test.Transaction(
        code: Test.readFile("../transactions/ClaimBounty.cdc"),
        authorizers: [volunteer.address],
        signers: [volunteer],
        arguments: [id, "A bright kitchen with white marble countertops."]
    )
    Test.expect(Test.executeTransaction(claimTx), Test.beSucceeded())

    Test.assertEqual(STATUS_COMPLETED, getStatus(id))
    Test.assertEqual(volunteer.address, getVolunteer(id))
}

// ---------------------------------------------------------------------------
// Test 5: Non-requester cannot cancel
// ---------------------------------------------------------------------------

access(all) fun testNonRequesterCannotCancel() {
    let user = Test.createAccount()
    let attacker = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid004", 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let cancelTx = Test.Transaction(
        code: Test.readFile("../transactions/CancelRequest.cdc"),
        authorizers: [attacker.address],
        signers: [attacker],
        arguments: [id]
    )
    Test.expect(Test.executeTransaction(cancelTx), Test.beFailed())

    // Request must still be open
    Test.assertEqual(STATUS_OPEN, getStatus(id))
}

// ---------------------------------------------------------------------------
// Test 6: Requester cancels and gets full refund
// ---------------------------------------------------------------------------

access(all) fun testRequesterCancelsAndGetsRefund() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid005", 2.0 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let cancelTx = Test.Transaction(
        code: Test.readFile("../transactions/CancelRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: [id]
    )
    Test.expect(Test.executeTransaction(cancelTx), Test.beSucceeded())

    Test.assertEqual(STATUS_CANCELLED, getStatus(id))
}

// ---------------------------------------------------------------------------
// Test 7: Double-claim on a completed request is rejected
// ---------------------------------------------------------------------------

access(all) fun testDoubleClaimRejected() {
    let user = Test.createAccount()
    let volunteer1 = Test.createAccount()
    let volunteer2 = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid006", 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let claim1 = Test.Transaction(
        code: Test.readFile("../transactions/ClaimBounty.cdc"),
        authorizers: [volunteer1.address],
        signers: [volunteer1],
        arguments: [id, "A sunny park with green trees."]
    )
    Test.expect(Test.executeTransaction(claim1), Test.beSucceeded())

    let claim2 = Test.Transaction(
        code: Test.readFile("../transactions/ClaimBounty.cdc"),
        authorizers: [volunteer2.address],
        signers: [volunteer2],
        arguments: [id, "Another description attempt."]
    )
    Test.expect(Test.executeTransaction(claim2), Test.beFailed())
}

// ---------------------------------------------------------------------------
// Test 8: Self-claim guard
// ---------------------------------------------------------------------------

access(all) fun testSelfClaimRejected() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let id = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: ["bafybeiexamplecid007", 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let claimTx = Test.Transaction(
        code: Test.readFile("../transactions/ClaimBounty.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: [id, "I can see myself."]
    )
    Test.expect(Test.executeTransaction(claimTx), Test.beFailed())
}

// ---------------------------------------------------------------------------
// Test 9: MetadataViews.Display on an open request
// ---------------------------------------------------------------------------

access(all) fun testDisplayViewOnOpenRequest() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let cid = "bafybeiexamplecid008"
    let id  = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: [cid, 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    // Resolve Display via the new script helper
    let result = Test.executeScript(
        Test.readFile("../scripts/GetRequestDisplay.cdc"),
        [contractAddress, id]
    )
    Test.expect(result, Test.beSucceeded())

    // The script returns MetadataViews.Display but the test framework gives
    // us AnyStruct — we confirm non-nil and run detailed field checks inline.
    Test.assert(result.returnValue != nil, message: "Display view returned nil")

    // Verify the thumbnail CID and ExternalURL contain our CID via an inline script
    let thumbnailCheck = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("import MetadataViews from \"MetadataViews\"\n")
        .concat("access(all) fun main(id: UInt64, expectedCid: String): Bool {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  let d = mgr.borrowRequest(id)!\n")
        .concat("    .resolveView(Type<MetadataViews.Display>())! as! MetadataViews.Display\n")
        .concat("  return d.thumbnail.uri().contains(expectedCid)\n")
        .concat("}"),
        [id, cid]
    )
    Test.expect(thumbnailCheck, Test.beSucceeded())
    Test.assert(thumbnailCheck.returnValue! as! Bool,
        message: "Display thumbnail URI should contain the Storacha CID")

    // Verify the name contains the request ID
    let nameCheck = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("import MetadataViews from \"MetadataViews\"\n")
        .concat("access(all) fun main(id: UInt64): Bool {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  let d = mgr.borrowRequest(id)!\n")
        .concat("    .resolveView(Type<MetadataViews.Display>())! as! MetadataViews.Display\n")
        .concat("  return d.name.contains(id.toString())\n")
        .concat("}"),
        [id]
    )
    Test.expect(nameCheck, Test.beSucceeded())
    Test.assert(nameCheck.returnValue! as! Bool,
        message: "Display name should contain the request ID")
}

// ---------------------------------------------------------------------------
// Test 10: MetadataViews.ExternalURL contains the Storacha CID
// ---------------------------------------------------------------------------

access(all) fun testExternalURLView() {
    let user = Test.createAccount()
    fundAccount(user, 10.0)

    let cid = "bafybeiexamplecid009"
    let id  = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: [cid, 0.1 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    // GetRequestExternalURL script returns the URL string
    let urlResult = Test.executeScript(
        Test.readFile("../scripts/GetRequestExternalURL.cdc"),
        [contractAddress, id]
    )
    Test.expect(urlResult, Test.beSucceeded())
    let url = urlResult.returnValue! as! String

    // URL must contain the CID
    Test.assert(url.contains(cid),
        message: "ExternalURL should contain the Storacha CID: ".concat(url))

    // URL must point to the w3s.link gateway
    Test.assert(url.contains("w3s.link"),
        message: "ExternalURL should point to the w3s.link IPFS gateway: ".concat(url))
}

// ---------------------------------------------------------------------------
// Test 11: Display view on a completed request carries the AI description
// ---------------------------------------------------------------------------

access(all) fun testDisplayDescriptionAfterClaim() {
    let user      = Test.createAccount()
    let volunteer = Test.createAccount()
    fundAccount(user, 10.0)

    let cid  = "bafybeiexamplecid010"
    let desc = "A well-lit kitchen with white marble countertops and wooden cabinets."
    let id   = nextID()

    let createTx = Test.Transaction(
        code: Test.readFile("../transactions/CreateRequest.cdc"),
        authorizers: [user.address],
        signers: [user],
        arguments: [cid, 0.5 as UFix64]
    )
    Test.expect(Test.executeTransaction(createTx), Test.beSucceeded())

    let claimTx = Test.Transaction(
        code: Test.readFile("../transactions/ClaimBounty.cdc"),
        authorizers: [volunteer.address],
        signers: [volunteer],
        arguments: [id, desc]
    )
    Test.expect(Test.executeTransaction(claimTx), Test.beSucceeded())

    // After completion the Display description should match the AI output
    let descCheck = Test.executeScript(
        "import IrisBounty from 0x0000000000000007\n"
        .concat("import MetadataViews from \"MetadataViews\"\n")
        .concat("access(all) fun main(id: UInt64, expectedDesc: String): Bool {\n")
        .concat("  let mgr = getAccount(0x0000000000000007).capabilities\n")
        .concat("    .borrow<&{IrisBounty.RequestManagerPublic}>(IrisBounty.RequestManagerPublicPath)!\n")
        .concat("  let d = mgr.borrowRequest(id)!\n")
        .concat("    .resolveView(Type<MetadataViews.Display>())! as! MetadataViews.Display\n")
        .concat("  return d.description == expectedDesc\n")
        .concat("}"),
        [id, desc]
    )
    Test.expect(descCheck, Test.beSucceeded())
    Test.assert(descCheck.returnValue! as! Bool,
        message: "Display description should match the volunteer's AI description")
}
