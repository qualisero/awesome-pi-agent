#!/bin/bash
# Headless Discord tracking workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
AGGREGATE_REPOS="$DATA_DIR/all-repos.json"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Discord Pi-Agent Resource Tracker (Headless)${NC}\n"

# Kill any existing Chrome on port 9222
if lsof -i :9222 &>/dev/null; then
    echo "🧹 Stopping existing browser..."
    lsof -ti :9222 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start headless browser
echo "🌐 Starting headless browser..."
node "$SCRIPT_DIR/start-browser-headless.js" --profile

# Give Discord more time to load in headless mode
echo "⏳ Waiting for Discord to load..."
sleep 15

# Run tracker
echo -e "\n${BLUE}Running incremental scan...${NC}\n"
node "$SCRIPT_DIR/track.js"

# Stop the browser
echo -e "\n🧹 Stopping headless browser..."
if lsof -i :9222 &>/dev/null; then
    lsof -ti :9222 | xargs kill 2>/dev/null || true
fi

# Check for new repos against awesome list
echo -e "\n${BLUE}Checking against awesome list...${NC}\n"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/README.md" ] && [ -f "$AGGREGATE_REPOS" ]; then
    NEW_REPOS=$(cat "$AGGREGATE_REPOS" | \
        jq -r '.[] | .url' 2>/dev/null | \
        sort -u | \
        while read url; do
            if ! grep -q "$url" "$PROJECT_ROOT/README.md" 2>/dev/null; then
                repo_name=$(echo "$url" | sed 's|https://github.com/||')
                echo "$repo_name|$url"
            fi
        done)
    
    if [ -n "$NEW_REPOS" ]; then
        echo -e "${GREEN}🆕 New repositories not in awesome list:${NC}\n"
        echo "$NEW_REPOS" | while IFS='|' read name url; do
            echo "  - $name"
            echo "    $url"
        done
        echo -e "\n${YELLOW}Add these to $PROJECT_ROOT/README.md${NC}"
    else
        echo "✅ All found repositories are already in the awesome list"
    fi
else
    if [ ! -f "$PROJECT_ROOT/README.md" ]; then
        echo "⚠️  Awesome list not found at $PROJECT_ROOT/README.md"
    fi
    if [ ! -f "$AGGREGATE_REPOS" ]; then
        echo "⚠️  No aggregate repos data yet (run tracker first)"
    fi
fi

echo -e "\n${GREEN}✅ Complete${NC}"
echo -e "\n${BLUE}Data locations:${NC}"
echo -e "  Data directory: $DATA_DIR"
echo -e "  State: $DATA_DIR/state.json"
echo -e "  Aggregate results: $DATA_DIR/all-results.json"
echo -e "  Aggregate repos: $DATA_DIR/all-repos.json"
echo -e "  Individual runs: $DATA_DIR/runs/"
