# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Iris.ai Project Rules
Tech Stack
React Native (Expo) with TypeScript.

NativeWind (Tailwind CSS).

Flow Blockchain (Cadence & Flow FCL).

Storacha SDK & IPFS.

CLI Directives
Write functional, modular React components.

Prioritize high-contrast, accessible UI.

Use .env for keys.

Run npm run ios to test builds locally.


## Current Project State
- **Frontend:** React Native/Expo (NativeWind). Focus: High-contrast accessibility.
- **Backend:** Flow Blockchain (Cadence 1.0). Focus: IrisBounty escrow contract.
- **Rules:** - Instance 1 owns `src/` (UI).
  - Instance 2 owns `cadence/` (Web3).
  - DO NOT cross-edit files without checking `tasks.md`.