#!/bin/bash
# PAI Daily Workflow — Kernel CLI Automation
# Usage: bash daily-workflow.sh

set -e

echo "╔══════════════════════════════════════════╗"
echo "║     PAI DAILY WORKFLOW                   ║"
echo "║     $(date '+%Y-%m-%d %H:%M')              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 1. Check pai-list org status
echo "📦 Checking pai-list org..."
curl -s "https://api.github.com/orgs/pai-list/repos?per_page=30" | python3 -c "
import sys,json
try:
    data=json.load(sys.stdin)
    if isinstance(data,list):
        for r in data:
            updated=r['updated_at'][:10] if r.get('updated_at') else 'unknown'
            print(f\"  {r['name']:30s} ★{r['stargazers_count']:>4}  pushed:{updated}\")
    else:
        print('  (org not accessible)')
except: print('  (not found)')
" 2>&1 || echo "  (api rate limited — use browser)"

# 2. Check vercel-labs key repos
echo ""
echo "🚀 Checking vercel-labs latest..."
for repo in skills agent-skills agent-browser portless; do
    updated=$(curl -s "https://api.github.com/repos/vercel-labs/$repo" 2>&1 | python3 -c "
import sys,json; d=json.load(sys.stdin);
print(d.get('pushed_at','unknown')[:10] if d.get('pushed_at') else 'unknown')
" 2>&1)
    echo "  $repo: $updated"
done

# 3. Check pi-apps key repos
echo ""
echo "🥧 Checking pi-apps latest..."
for repo in pi-sdk-js pi-sdk-nextjs pi-platform-docs demo PiOS; do
    updated=$(curl -s "https://api.github.com/repos/pi-apps/$repo" 2>&1 | python3 -c "
import sys,json; d=json.load(sys.stdin);
print(d.get('pushed_at','unknown')[:10] if d.get('pushed_at') else 'unknown')
" 2>&1)
    echo "  $repo: $updated"
done

# 4. Check local repos status
echo ""
echo "💻 Checking local repos..."
for dir in ~/pai-agent-kit ~/pai-atom ~/pai-skills ~/pai-website ~/pi-startkit ~/pai-list; do
    if [ -d "$dir" ]; then
        cd "$dir"
        branch=$(git branch --show-current 2>/dev/null || echo "none")
        commits=$(git log --oneline 2>/dev/null | wc -l)
        modified=$(git status --short 2>/dev/null | wc -l)
        echo "  $(basename $dir): $branch branch, $commits commits, $modified uncommitted"
    else
        echo "  $(basename $dir): NOT FOUND"
    fi
done

echo ""
echo "✅ Daily workflow complete"
