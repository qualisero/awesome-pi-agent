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

# Auto-login handling: If headless mode fails due to login, retry in interactive mode
AUTO_LOGIN=false
if [[ "$*" == *"--headless"* ]]; then
    AUTO_LOGIN=true
fi

# Heuristic noise filter for repo-root URLs.
# The Discord scraper can surface many GitHub links that are irrelevant for this awesome list
# (e.g., forks of pi-mono, GitHub infrastructure, user attachment buckets).
# This filter only affects the *reporting* in this script, not the underlying scrape data.
should_ignore_repo() {
    local repo="$1"

    # Ignore forks of pi-mono (keep the official repo)
    if [[ "$repo" == */pi-mono && "$repo" != "badlogic/pi-mono" ]]; then
        return 0
    fi

    # Ignore GitHub infra / non-resource links
    case "$repo" in
        apps/github-actions) return 0 ;;
        user-attachments/assets) return 0 ;;
        qualisero/awesome-pi-agent) return 0 ;;
    esac

    # Ignore repos that look like auto-generated gists/ids (32 hex chars)
    if [[ "$repo" =~ /[0-9a-f]{32}$ ]]; then
        return 0
    fi

    return 1
}

# Run scraper with auto-login support
run_scraper() {
    local mode="$1"
    shift
    
    if [ "$mode" = "headless" ]; then
        echo -e "${BLUE}Running in headless mode...${NC}\n"
        node "$SCRIPT_DIR/scraper.js" --headless "$@"
    else
        echo -e "${BLUE}Running in interactive mode...${NC}\n"
        node "$SCRIPT_DIR/scraper.js" "$@"
    fi
}

# Main scraper execution with auto-login
if [ "$AUTO_LOGIN" = true ]; then
    # Try headless first
    set +e  # Don't exit on error
    run_scraper headless "$@"
    EXIT_CODE=$?
    set -e  # Re-enable exit on error
    
    if [ $EXIT_CODE -eq 1 ]; then
        echo -e "\n${YELLOW}═══════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}Login required. Automatically opening Chrome for login...${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"
        echo -e "${GREEN}Please log in to Discord in the Chrome window that will open.${NC}"
        echo -e "${GREEN}After logging in, the scraper will continue automatically.${NC}\n"
        
        read -p "Press Enter to open Chrome and log in (or Ctrl+C to cancel)..."
        
        # Run in interactive mode to allow login
        if run_scraper interactive; then
            echo -e "\n${GREEN}✅ Login successful! You can now use --headless mode.${NC}"
        else
            echo -e "\n${YELLOW}⚠️  Scraper completed but may need attention.${NC}"
        fi
    elif [ $EXIT_CODE -ne 0 ]; then
        # Different error, propagate it
        exit $EXIT_CODE
    fi
else
    # Standard run (no auto-login, pass through all args)
    run_scraper interactive "$@"
fi

# Check for new repos against awesome list
echo -e "\n${BLUE}Checking against awesome list...${NC}\n"

AGGREGATE_REPOS="$SCRIPT_DIR/data/all-repos.json"

if [ -f "$PROJECT_ROOT/README.md" ] && [ -f "$AGGREGATE_REPOS" ]; then
    NEW_REPOS=$(cat "$AGGREGATE_REPOS" | \
        jq -r 'keys[]' 2>/dev/null | \
        while read repo; do
            [ -z "$repo" ] && continue
            if should_ignore_repo "$repo"; then
                continue
            fi
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

    # Check for new sub-entries (tree/blob links) under repos that are already listed
    echo -e "\n${BLUE}Checking for new sub-entries under already-listed repos...${NC}\n"

    LATEST_RUN_DIR=$(ls -1dt "$SCRIPT_DIR"/data/runs/* 2>/dev/null | head -n 1)

    if [ -n "$LATEST_RUN_DIR" ] && [ -f "$LATEST_RUN_DIR/all-messages.json" ]; then
        # Repos already listed in README.md (repo roots only)
        LISTED_REPOS=$(rg -o 'https://github\.com/[^\s)]+/[^\s)/]+' "$PROJECT_ROOT/README.md" | \
            sed 's#https://github\.com/##' | \
            sort -u)

        # Candidate GitHub sub-links (tree/blob) discovered in the latest scraper run
        CANDIDATE_SUBLINKS=$(jq -r '..|.links? // empty | .[]' "$LATEST_RUN_DIR/all-messages.json" 2>/dev/null | \
            rg -e '^https://github\.com/[^/]+/[^/]+/(tree|blob)/' | \
            sort -u)

        MISSING_SUBENTRIES=$(echo "$CANDIDATE_SUBLINKS" | \
            while read -r url; do
                [ -z "$url" ] && continue
                repo=$(echo "$url" | sed -E 's#^https://github\.com/([^/]+/[^/]+).*$#\1#')

                if echo "$LISTED_REPOS" | rg -q -x "$repo"; then
                    if ! rg -q -F "$url" "$PROJECT_ROOT/README.md"; then
                        echo "$repo|$url"
                    fi
                fi
            done)

        if [ -n "$MISSING_SUBENTRIES" ]; then
            echo -e "${GREEN}🆕 New sub-entry URLs (repo already listed, URL missing from README):${NC}\n"
            echo "$MISSING_SUBENTRIES" | while IFS='|' read name url; do
                echo "  - $name"
                echo "    $url"
            done
            echo -e "\n${YELLOW}Consider adding these as sub-entries in $PROJECT_ROOT/README.md${NC}"
        else
            echo "✅ No new sub-entry URLs found for already-listed repos"
        fi
    else
        echo "(No run data found to analyze sub-entries)"
    fi
fi

echo -e "\n${GREEN}✅ Complete${NC}"
