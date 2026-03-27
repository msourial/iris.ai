# Iris.ai — Accessibility Guide
## iOS VoiceOver Specification

This document defines the **exact, required behavior** of the Iris.ai app under iOS VoiceOver.
Every behavior listed here is a product requirement, not a suggestion.

---

## Philosophy

Iris.ai's primary users may be blind or have severe visual impairments. This means:

1. VoiceOver is not an edge case. It is the primary interaction model.
2. Every screen must be fully operable without looking at it.
3. The AI description — our core product output — must be delivered audibly, automatically,
   without the user having to navigate to it.
4. No action should require visual confirmation of its result.

---

## Global Rules (Apply to All Screens)

### Touch Targets
- Minimum tap area: **60×60pt** for all interactive elements.
- Primary CTA buttons: **full screen width**, minimum **72pt tall**.
- No two interactive elements within 20pt of each other.

### Color & Contrast
- All text: minimum **WCAG AAA** contrast ratio (7:1).
- Primary palette: Yellow `#FFD600` on Black `#000000` = 15.3:1 ratio.
- Status indicators: never use color alone. Always pair with a text label or icon.

### Focus Order
- VoiceOver focus must move top-to-bottom, left-to-right, in logical reading order.
- Modal sheets and alerts must trap focus inside themselves until dismissed.
- After a modal closes, focus must return to the element that triggered it.

### No Silent State Changes
- Every state change that affects the user must be announced.
- Use `AccessibilityInfo.announceForAccessibility(message)` for async results.
- Never dismiss a result automatically. The user controls when to move on.

---

## Screen-by-Screen Specification

---

### Home Screen (`app/(tabs)/index.tsx`)

#### Disconnected State

| Element | accessibilityLabel | accessibilityHint | accessibilityRole |
|---|---|---|---|
| Status indicator (amber dot) | "Not connected" | — | `text` |
| Iris.ai logo/title | "Iris.ai" | — | `header` |
| Tagline | "Decentralized sight for the visually impaired" | — | `text` |
| Connect button | "Connect with Face ID" | "Double-tap to authenticate using Face ID and create your Flow wallet" | `button` |

**On connect button press:**
- Announce: `"Authenticating with Face ID"`
- During biometric prompt: system handles VoiceOver natively (do not suppress).
- On success: announce `"Connected. Wallet ready."` then move focus to the Request Help button.
- On failure: announce `"Authentication failed. [reason]. Double-tap Connect to try again."` and return focus to Connect button.

#### Connected State

| Element | accessibilityLabel | accessibilityHint | accessibilityRole |
|---|---|---|---|
| Status indicator (green dot) | "Connected" | — | `text` |
| Wallet address | "Wallet: [truncated address]" | "Your Flow blockchain address" | `text` |
| Request Help button | "Request Help" | "Double-tap to open camera and describe your surroundings" | `button` |
| Disconnect button | "Disconnect wallet" | "Double-tap to sign out" | `button` |

---

### Camera Screen (`app/(tabs)/camera.tsx`)

This is the most critical screen. Every action must have an audio equivalent.

#### On Screen Load
- Announce immediately: `"Camera active. Point your camera at what you need described, then double-tap the Capture button."`
- Live viewfinder: `accessibilityLabel="Live camera viewfinder"`, `accessibilityRole="image"`.
- Do **not** make the viewfinder focusable — it adds no value to a VoiceOver user.

#### Capture Button
| State | accessibilityLabel | accessibilityHint |
|---|---|---|
| Ready | "Capture" | "Double-tap to photograph and describe your surroundings" |
| Processing | "Processing" | "Please wait while your image is being described" |
| Disabled | "Capture unavailable" | "Camera permission is required. Go to Settings to allow access." |

**On capture:**
1. Haptic: medium impact (`UIImpactFeedbackGenerator.impactOccurred()`).
2. Announce: `"Photo taken. Uploading to secure storage."`
3. While uploading: announce `"Uploading image…"` (once, not repeatedly).
4. On upload complete: announce `"Uploaded. Getting description…"`
5. **On AI description received:** (see Critical Behavior below)
6. On any error: announce the specific error and what to do next (see Error States).

#### CRITICAL BEHAVIOR: AI Description Announcement

When the AI description returns, the app **must**:

```
1. Call AccessibilityInfo.announceForAccessibility(description) IMMEDIATELY.
   Do not wait for the user to navigate to a result card.
   Do not require any user action to trigger the announcement.

2. The announcement text must be the full description — not a summary,
   not "Your description is ready."

3. After the announcement, move VoiceOver focus to the ResultCard component
   so the user can re-read, copy, or share.

4. The ResultCard must remain on screen until the user explicitly dismisses it.
   No auto-dismiss. No timeout.
```

**Implementation note:**
```typescript
// In lib/vision.ts, after receiving description:
AccessibilityInfo.announceForAccessibility(description);
// Then update state to show ResultCard and move focus
```

#### Result Card
| Element | accessibilityLabel | accessibilityRole |
|---|---|---|
| Description text | Full description text verbatim | `text` |
| Copy button | "Copy description" | `button` |
| Share button | "Share description" | `button` |
| Dismiss button | "Dismiss and capture again" | `button` |
| IPFS badge | "Stored on IPFS. Content ID: [CID, first 8 chars]" | `text` |

**On dismiss:** announce `"Ready to capture again."` and return focus to Capture button.

#### Error States

| Error | Announcement | Follow-up Action |
|---|---|---|
| Camera permission denied | "Camera access is required. Open Settings, find Iris.ai, and enable Camera." | Focus to Settings deep-link button |
| Upload failed | "Upload failed. Please check your internet connection and try again." | Focus to Retry button |
| AI timeout | "The description service is taking too long. Please try again." | Focus to Retry button |
| No FLOW for bounty | "You need FLOW tokens to post a request. Your current balance is [amount]." | Focus to wallet info |

---

### History Screen (`app/(tabs)/history.tsx`)

#### Empty State
- Announce on load: `"No past requests. Use the Camera tab to make your first request."`
- Single descriptive text element, focusable.

#### List State
- List container: `accessibilityRole="list"`, `accessibilityLabel="Past vision requests"`
- Each list item: `accessibilityRole="listitem"`
- Each item label: `"[Date]. [First 20 words of description]. Status: [Completed/Pending]. Double-tap for details."`
- No swipe-to-delete. Use an explicit Delete button inside the detail view.

#### Detail View
| Element | accessibilityLabel |
|---|---|
| Full description | Full description text |
| Date | "Requested on [human-readable date]" |
| IPFS link | "View image on IPFS. Opens in browser." |
| On-chain status | "Status: Verified on Flow blockchain" or "Status: Pending verification" |

---

### Profile Screen (`app/(tabs)/profile.tsx`)

| Element | accessibilityLabel | accessibilityRole |
|---|---|---|
| Wallet address | "Your wallet address: [full address]" | `text` |
| Copy address button | "Copy wallet address" | `button` |
| FLOW balance | "Balance: [amount] FLOW" | `text` |
| Completed requests count | "[N] requests completed" | `text` |
| Volunteer reputation | "Volunteer score: [N] jobs completed" | `text` |
| Disconnect button | "Disconnect wallet" | `button` |

---

## Tab Bar Specification

| Tab | accessibilityLabel | accessibilityHint |
|---|---|---|
| Home | "Home" | "Authentication and main actions" |
| Camera | "Camera" | "Capture and describe your surroundings" |
| History | "History" | "View past vision requests" |
| Profile | "Profile" | "Wallet and account settings" |

**Active tab:** append `", selected"` to the label. e.g., `"Camera, selected"`.

---

## Haptic Feedback Map

| Event | Haptic Type |
|---|---|
| Button press (primary) | Medium impact |
| Capture photo | Heavy impact |
| Description received | Success notification |
| Error | Error notification |
| Connect wallet | Success notification |
| Disconnect | Light impact |

---

## VoiceOver Gesture Conflicts

React Native's gesture responders can conflict with VoiceOver's swipe navigation.
The following rules prevent this:

1. **Swipe gestures on camera viewfinder:** Disabled entirely in VoiceOver mode.
   Use `AccessibilityInfo.isScreenReaderEnabled()` to detect and disable swipes.
2. **Pull-to-refresh on History:** Replace with an explicit "Refresh" button when VoiceOver is active.
3. **Long-press actions:** All long-press actions must have an equivalent button in the UI.
   VoiceOver users cannot reliably use long-press.

```typescript
// Pattern for VoiceOver-aware gesture disabling
const [voiceOverEnabled, setVoiceOverEnabled] = useState(false);

useEffect(() => {
  AccessibilityInfo.isScreenReaderEnabled().then(setVoiceOverEnabled);
  const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setVoiceOverEnabled);
  return () => sub.remove();
}, []);
```

---

## Testing Checklist

Before any release, verify the following with VoiceOver **enabled** on a physical iOS device:

### Auth Flow
- [ ] App launches and announces the screen name and primary action
- [ ] Connect button is reachable by swiping right from top
- [ ] Face ID prompt is announced by the system
- [ ] Success state announces "Connected" without user navigation
- [ ] Error state announces the specific error and recovery action

### Camera Flow
- [ ] Camera screen announces instructions on load
- [ ] Capture button is the first focusable element after the screen header
- [ ] Photo capture triggers a haptic and spoken confirmation
- [ ] AI description is announced automatically — no navigation required
- [ ] Result card is focusable and readable in full
- [ ] Dismiss returns focus to Capture button

### History Flow
- [ ] Empty state is announced immediately
- [ ] List items are labeled with date and description preview
- [ ] Detail view opens and traps focus
- [ ] Closing detail returns focus to the list item

### Profile Flow
- [ ] Wallet address is readable
- [ ] Copy button announces "Copied" after activation
- [ ] Disconnect triggers a confirmation before acting

### Error States
- [ ] Network error is announced with recovery instruction
- [ ] Permission error is announced with Settings link
- [ ] All error announcements include what to do next (not just what went wrong)

---

## Implementation Reference

```typescript
// Announce async result to VoiceOver (use after any AI/network response)
import { AccessibilityInfo } from 'react-native';
AccessibilityInfo.announceForAccessibility('Your description: ' + description);

// Move VoiceOver focus to a specific element
import { findNodeHandle, AccessibilityInfo } from 'react-native';
const ref = useRef(null);
AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref.current));

// Check if VoiceOver is active
const enabled = await AccessibilityInfo.isScreenReaderEnabled();

// Listen for VoiceOver toggle
AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => { ... });
```

---

*Iris.ai Accessibility Guide — v1.0 — 2026-03-26*
*Standard: WCAG 2.2 AAA + Apple Human Interface Guidelines (Accessibility)*
