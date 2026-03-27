# Iris.ai — 2-Minute Pitch Script
## Hackathon Submission Video

---

**Format:** Spoken to camera. Demonstrate the app live. Total runtime: 120 seconds.
**Tone:** Clear, direct, human. Not a sales pitch — a product demo with conviction.

---

## SCRIPT

---

**[0:00 — 0:12] THE PROBLEM**

*[Screen: black. No app. Just the presenter.]*

> "Two billion people in the world have significant vision loss.
> Most of them use apps built on centralized servers, run by companies that could shut down tomorrow.
> When the server goes down, their sight goes with it.
> That is not acceptable.
> We built Iris.ai to fix it."

---

**[0:12 — 0:30] THE DEMO — Core Flow**

*[Switch to iPhone. Open Iris.ai. App is on the Home screen.]*

> "Watch what happens when I open the app."

*[Tap the Connect button. Face ID prompt appears.]*

> "No username. No password. No seed phrase.
> Just my face.
> Under the hood, Flow Blockchain just created a Hybrid Custody account — linked to my biometric,
> owned by me, with full on-chain sovereignty.
> The user sees none of that. They just get in."

*[App shows connected state. Tap Camera tab.]*

> "Now I point my camera at something."

*[Point camera at an object — book, coffee cup, street scene.]*

> "I tap Capture. The image goes to IPFS via Storacha — content-addressed, permanent, no central server.
> The CID gets written to our Flow smart contract as an escrow request."

*[AI description appears on screen. VoiceOver reads it aloud.]*

> "And VoiceOver reads the description out loud — automatically — the moment it arrives.
> No navigation. No button press. The blind user just hears: what they're looking at."

---

**[0:30 — 0:55] THE BOUNTY SYSTEM**

*[Switch to a second phone, playing the "volunteer" role.]*

> "But AI isn't perfect. So we built a human verification layer.
>
> A volunteer — anywhere in the world — sees this open request.
> They verify the description, improve it if needed, and submit it on-chain.
> The moment they do, a Cadence smart contract atomically releases the FLOW bounty to their wallet.
> No intermediary. No payment processor. No delay.
>
> They also receive a VisionNFT — minted to their account as permanent, verifiable proof
> that they helped a blind person see today.
> That NFT implements Flow's MetadataViews standard — it's composable, queryable,
> and part of the broader Flow ecosystem."

---

**[0:55 — 1:20] THE TECHNOLOGY**

*[Switch to brief code view of IrisBounty.cdc — show the resource definition.]*

> "Let's talk about why Flow was the right choice.
>
> In Cadence 1.0, the escrowed FLOW doesn't sit in a mapping or a database.
> It lives inside a VisionRequest *resource* — a first-class object that the language itself
> prevents from being copied, lost, or silently deleted.
> This is resource-oriented programming. The security is in the type system, not in our code.
>
> Every image lives on IPFS via Storacha. Content-addressed.
> That means the image stored at a given CID *cannot change*.
> If someone tries to swap it, the hash changes, the contract rejects it.
> The description is permanently linked to the exact image it describes.
>
> Over time, this creates something valuable beyond the app:
> a decentralized, publicly verifiable dataset of real-world accessibility descriptions.
> Not owned by Iris.ai. Not owned by any company.
> Owned by the protocol."

---

**[1:20 — 1:45] THE HUMAN CASE**

*[Back to presenter. Quieter, more direct.]*

> "Accessibility technology has always been fragile because it's been centralized.
> One company, one server, one point of failure.
>
> Iris.ai removes those failure points.
> The storage is decentralized.
> The incentive layer is on-chain.
> The account requires no seed phrase.
>
> A blind person in a rural area with a cheap smartphone can use this app.
> If we shut down tomorrow, the contracts keep running.
> The data stays on IPFS.
> The volunteers keep earning.
>
> That's what we mean by infrastructure for accessibility —
> not a product, but a protocol."

---

**[1:45 — 2:00] THE ASK**

*[Presenter directly to camera.]*

> "We're building at the intersection of three things judges care about:
>
> Flow — resource-oriented Cadence contracts, Hybrid Custody account abstraction,
> MetadataViews NFT standards. Done right, not as checkboxes.
>
> Storacha — every image is content-addressed on IPFS, building a public accessibility dataset
> no single entity controls.
>
> Frontiers — AI-powered human assistance for the physical world, for the people who need it most.
>
> Iris.ai. Decentralized sight.
> Thank you."

---

---

## DELIVERY NOTES

**Pacing:** Slow down on the technical moments — "content-addressed," "resource-oriented," "Hybrid Custody."
These are the proof-of-knowledge phrases judges listen for. Don't rush them.

**The demo must be live.** Do not use screen recordings. Judges discount pre-recorded demos heavily.
If the app isn't complete, show the contract on Flow testnet explorer directly and narrate it.

**VoiceOver must be on during the camera demo.** The moment VoiceOver reads the description aloud
is the emotional peak of the pitch. It makes the technology real. Do not skip it.

**The volunteer claim can be simulated.** Have a second device ready. Run the `ClaimBounty`
transaction from the Flow CLI if the UI isn't complete. Show the on-chain event in the explorer.

---

## BOUNTY CRITERIA COVERAGE MAP

### Flow — Best App on Flow
| Criteria | Where We Address It | Timestamp |
|---|---|---|
| Cadence 1.0 resource-oriented programming | VisionRequest resource, `access(contract)` methods | 0:55 |
| FungibleToken standard | Bounty escrow in FLOW | 0:42 |
| MetadataViews / NFT standard | VisionNFT minted on claim | 0:44 |
| Deployed on Flow testnet | Show contract address in explorer | 0:55 |
| Real user value | Visually impaired use case | Throughout |

### Flow — Account Abstraction
| Criteria | Where We Address It | Timestamp |
|---|---|---|
| Passkeys / biometric auth | Face ID connect demo | 0:12 |
| No seed phrase | Explicitly stated | 0:20 |
| Hybrid Custody | Named explicitly | 0:22 |
| Walletless UX | "The user sees none of that" | 0:25 |

### Storacha — Decentralized Storage
| Criteria | Where We Address It | Timestamp |
|---|---|---|
| Images stored on IPFS | Demo — capture → IPFS upload | 0:32 |
| Content-addressed (no tampering) | Explained: CID + hash integrity | 1:02 |
| No central server | Stated explicitly | 0:35 |
| Long-term data availability | "If we shut down, data stays on IPFS" | 1:35 |
| Novel use case | Accessibility dataset as public good | 1:10 |

### Frontiers — Physical AI
| Criteria | Where We Address It | Timestamp |
|---|---|---|
| AI applied to physical world | Camera → scene description | 0:32 |
| Human assistance use case | Visually impaired users | Throughout |
| Real-time response | VoiceOver reads description immediately | 0:36 |
| Underserved population | "2 billion people with vision loss" | 0:00 |
| Decentralized / resilient | Protocol framing, not product | 1:20 |

---

*Iris.ai Pitch Script — v1.0 — 2026-03-26*
