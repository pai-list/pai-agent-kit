#!/bin/bash
# PAI Universe — Push Everything to pai-list org
# Run this after `gh auth login`

set -e

echo "🚀 Pushing PAI Universe to pai-list org..."
echo ""

# 1. pai-list (org profile)
echo "📦 pai-list (org profile)..."
cd /Users/cryptojoker710/pai-list
gh repo create pai-list/pai-list --public --push --source=. --description "PAI Universe — The org profile" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/pai-list.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

# 2. pai-atom
echo "📦 pai-atom..."
cd /Users/cryptojoker710/pai-atom
gh repo create pai-list/atom --public --push --source=. --description "⚛️ PAI Atom — The Immutable Core (50 lines, frozen forever)" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/atom.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

# 3. pai-agent-kit
echo "📦 pai-agent-kit..."
cd /Users/cryptojoker710/pai-agent-kit
gh repo create pai-list/agent-kit --public --push --source=. --description "🛠️ PAI Agent Kit — Build agents on Pi Network with PPP protocol" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/agent-kit.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

# 4. pai-skills
echo "📦 pai-skills..."
cd /Users/cryptojoker710/pai-skills
gh repo create pai-list/skills --public --push --source=. --description "🧩 PAI Skills Registry — Discover, install, and monetize agent skills" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/skills.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

# 5. pai-website
echo "📦 pai-website..."
cd /Users/cryptojoker710/pai-website
gh repo create pai-list/pai-website --public --push --source=. --description "🌐 PAI Website — The Universe Hub" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/pai-website.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

# 6. pi-startkit
echo "📦 pi-startkit..."
cd /Users/cryptojoker710/pi-startkit
gh repo create pai-list/pi-startkit --public --push --source=. --description "🚀 Pi StartKit — Agent StarterKit 2026 for Pi Network" 2>/dev/null || echo "  already exists, pushing..."
git remote set-url origin https://github.com/pai-list/pi-startkit.git 2>/dev/null || true
git push -u origin main 2>&1 | tail -1

echo ""
echo "✅ PAI Universe pushed!"
echo "   https://github.com/pai-list"
