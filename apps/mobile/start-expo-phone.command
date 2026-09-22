#!/bin/bash
# ============================================
# WHAT THIS FILE DOES (plain English):
# Starts Expo in this Terminal window with a scannable QR.
# Tunnel mode, so the phone connects even on blocked Wi-Fi.
# Keep this window open while testing on the phone.
# ============================================
export PATH="/Users/brantsjohnson/.nvm/versions/node/v22.14.0/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "$(dirname "$0")"
clear
echo "Starting Bridger (Expo Go, tunnel)…"
lsof -ti :8081 | xargs kill -9 2>/dev/null
sleep 1
export EXPO_PUBLIC_DEMO_MODE=0
export EXPO_PUBLIC_FORCE_WELCOME=0
export EXPO_PUBLIC_API_URL=https://jiyzei8qqu.us-east-1.awsapprunner.com
exec npx expo start --port 8081 --tunnel --go
