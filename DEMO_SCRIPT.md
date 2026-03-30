# Iris.ai Demo Video Script (2-3 minutes)

## Recording Setup
- Screen record your phone (or Expo Go on device) + API server terminal side-by-side
- Use a clear voiceover narration
- Keep transitions snappy — no dead air

---

## Script

### [0:00 - 0:15] INTRO
**Screen**: Auth screen with Iris.ai logo
**Voiceover**: "Iris.ai is a decentralized vision assistant for the visually impaired. It combines AI, human volunteers, and blockchain verification to help blind users understand their surroundings."

### [0:15 - 0:30] WALLET CONNECT
**Action**: Tap "Connect Wallet"
**Screen**: Wallet connects, role selection appears
**Voiceover**: "Users connect their Flow wallet, then choose their role — either someone who needs help, or a sighted volunteer."

### [0:30 - 0:35] ROLE: BLIND USER
**Action**: Tap "I Need Help"
**Screen**: Camera opens
**Voiceover**: "Let's start as a visually impaired user."

### [0:35 - 0:55] CAPTURE + AI ANALYSIS
**Action**: Point camera at a scene (desk, kitchen, street), tap capture
**Screen**: Analyzing overlay with pulsing animation
**Voiceover**: "The user captures a photo. Gemini 2.0 Flash analyzes it instantly and generates a concise, accessible description."
**Screen**: Result screen — AI description in large yellow text
**Note**: Let the TTS read the description — the audience hears the actual speech output

### [0:55 - 1:15] VERIFICATION PROOF
**Action**: Scroll down on result screen
**Screen**: Verification section showing AI hash, IPFS CID, Flow status, Filecoin CID
**Voiceover**: "Every inference is verifiable. The AI description is SHA-256 hashed and stored on-chain. The image is uploaded to IPFS via Storacha and archived on Filecoin — creating a permanent, tamper-proof record."

### [1:15 - 1:35] ASK A HUMAN
**Action**: Tap "Ask a Human (Free - Sponsored)"
**Screen**: Freezing stage (submitting), then escrow stage (waiting for volunteer)
**Voiceover**: "If the AI description isn't enough — for example, reading an expiration date — the user can escalate to a human volunteer. The request is submitted to the volunteer network."

### [1:35 - 1:55] SWITCH TO VOLUNTEER
**Action**: Open app on second device or simulator. Connect wallet, tap "I Want to Volunteer"
**Screen**: Volunteer queue with the pending request
**Voiceover**: "Now switching to a sighted volunteer's perspective. They see the pending request in their queue."

### [1:55 - 2:15] VOLUNTEER RESPONDS
**Action**: Tap "Help", see the AI description and image, type an answer like "The expiration date is April 2026", tap "Submit Answer"
**Screen**: Success checkmark animation
**Voiceover**: "The volunteer sees the AI's description for context, views the captured image, and types their answer."

### [2:15 - 2:35] BLIND USER RECEIVES ANSWER
**Action**: Switch back to first device
**Screen**: Result screen updates — yellow "Volunteer Answer" badge + the volunteer's text, toast notification
**Note**: Let TTS read the volunteer's answer aloud
**Voiceover**: "Back on the blind user's device, the answer arrives automatically and is read aloud. The entire exchange is recorded on Flow blockchain and stored on IPFS and Filecoin."

### [2:35 - 2:55] CLOSING
**Screen**: Show the verification section one more time, then cut to the architecture diagram from README
**Voiceover**: "Iris.ai brings together AI, human oversight, and decentralized infrastructure to make vision accessible for everyone — verifiable, permanent, and free for users. Built with Gemini, Flow, Storacha, and Filecoin."

**End card**: "Iris.ai — Built for PL_Genesis: Frontiers of Collaboration"

---

## Tips
- Record at 1080p or higher
- Keep the phone's TTS volume audible but not overpowering
- If demo'ing on one device: record the blind user flow first, then the volunteer flow, and edit them together
- Show the API server terminal briefly to prove real API calls are happening
- Total target: 2:30 - 3:00
