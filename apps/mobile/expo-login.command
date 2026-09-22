#!/bin/bash
# ============================================
# WHAT THIS FILE DOES (plain English):
# Signs your Mac into Expo as brantsjohnson (same
# account as Expo Go), then restarts the phone tunnel.
# ============================================
export PATH="/Users/brantsjohnson/.nvm/versions/node/v18.20.7/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
cd "/Users/brantsjohnson/Desktop/Bridger App/apps/mobile"
clear
echo "Sign in to Expo CLI as: brantsjohnson"
echo "Use the password you just reset."
echo ""
npx expo login -u brantsjohnson
echo ""
echo "Login status:"
npx expo whoami
echo ""
echo "Restarting tunnel for your phone…"
# Stop any old Metro on 8081
lsof -ti :8081 | xargs kill -9 2>/dev/null
sleep 1
export EXPO_PUBLIC_DEMO_MODE=0
export EXPO_PUBLIC_FORCE_WELCOME=0
export EXPO_PUBLIC_API_URL=https://jiyzei8qqu.us-east-1.awsapprunner.com
echo ""
echo "When Metro is ready, open this on your phone (or scan the QR we regenerate):"
echo "  https://e_an4by-anonymous-8081.exp.direct/open.html"
echo "  (tunnel hostname may change after restart — watch for a new URL below)"
echo ""
exec npx expo start --port 8081 --tunnel --go
