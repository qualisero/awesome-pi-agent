#!/bin/bash
# Discord Pi-Agent Resource Tracker
# Runs the scraper with a visible browser (interactive mode)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Discord Pi-Agent Resource Tracker${NC}\n"

# Run scraper
node "$SCRIPT_DIR/scraper.js" "$@"

# Check for new repos against awesome list
echo -e "\n${BLUE}Checking against awesome list...${NC}\n"

AGGREGATE_REPOS="$SCRIPT_DIR/data/all-repos.json"

if [ -f "$PROJECT_ROOT/README.md" ] && [ -f "$AGGREGATE_REPOS" ]; then
    NEW_REPOS=$(cat "$AGGREGATE_REPOS" | \
        jq -r 'keys[]' 2>/dev/null | \
        while read repo; do
            url="https://github.com/$repo"
            if ! grep -q "$url" "$PROJECT_ROOT/README.md" 2>/dev/null; then
                echo "$repo|$url"
            fi
        done)
    
    if [ -n "$NEW_REPOS" ]; then
        echo -e "${GREEN}🆕 New repositories not in awesome list:${NC}\n"
        echo "$NEW_REPOS" | while IFS='|' read name url; do
            echo "  - $name"
            echo "    $url"
        done
        echo -e "\n${YELLOW}Consider adding these to $PROJECT_ROOT/README.md${NC}"
    else
        echo "✅ All found repositories are already in the awesome list"
    fi
fi

echo -e "\n${GREEN}✅ Complete${NC}"
