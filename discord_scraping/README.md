# Discord Scraping Tools

Automatically track pi-agent resources shared in Discord servers with incremental, timestamp-based scanning.

## Quick Start

### Interactive Mode (Default)

```bash
# 1. Navigate to the directory
cd discord_scraping

# 2. Install dependencies
npm install

# 3. Run the tracker
./run-tracker.sh
```

### Headless Mode (No Browser Window)

```bash
# Run completely in the background
./run-tracker-headless.sh
```

That's it! The script will:
- Start Chrome (headless or with window)
- Scan for new messages with GitHub links
- Filter for pi-agent related content
- Save results and state
- Compare with the awesome list

## Modes

### Interactive Mode (`run-tracker.sh`)
- Opens a visible Chrome window
- Good for first-time setup and debugging
- Allows manual Discord login if needed
- **Use this for initial setup**

### Headless Mode (`run-tracker-headless.sh`)
- Runs Chrome in background (no window)
- Perfect for automation and cron jobs
- Requires pre-authenticated Chrome profile
- Automatically stops browser after scan
- **Use this for scheduled/automated runs**

## What It Does

1. **Scans Discord servers** for messages containing GitHub links
2. **Filters for pi-agent** related content automatically
3. **Only checks new messages** since last run (timestamp-based)
4. **Saves state** between runs in `data/`
5. **Compares with awesome list** to find new resources

## How It Works

### First Run
- Launches Chrome with your profile (to preserve Discord login)
- Scans all messages in all channels
- Saves timestamp and creates state file
- Takes a few minutes

### Subsequent Runs
- Only scans messages newer than last run
- Fast (usually < 30 seconds)
- Incremental updates only

## Files

## Data Structure

All data is stored in the `data/` directory (ignored by git):

```
data/
├── state.json              # Tracker state and configuration
├── all-results.json        # All messages (aggregate across runs)
├── all-repos.json          # All repos with mentions (aggregate)
└── runs/
    └── TIMESTAMP/
        ├── metadata.json           # Run statistics
        ├── all-messages.json       # All messages found
        ├── pi-agent-messages.json  # Filtered pi-agent related
        └── repos.json              # Repos found in this run
```

### Top-Level Files

| File | Purpose |
|------|---------|
| `state.json` | Tracker state, server config, channel history |
| `all-results.json` | Aggregate of all pi-agent messages across all runs |
| `all-repos.json` | All GitHub repos discovered with mention details |

### Run Directories

Each run creates a timestamped subdirectory containing:

| File | Purpose |
|------|---------|
| `metadata.json` | Run stats (timestamp, messages scanned, repos found) |
| `all-messages.json` | All messages with links (unfiltered) |
| `pi-agent-messages.json` | Filtered pi-agent related messages |
| `repos.json` | GitHub repos found in this specific run |

### Aggregate Files

The aggregate files (`all-results.json` and `all-repos.json`) accumulate data across runs:

- **all-results.json**: Every pi-agent message ever found, with `runId` and `runTimestamp`
- **all-repos.json**: Every unique repo with all mentions across all runs

Example repo entry:
```json
{
  "prateekmedia/pi-hooks": {
    "name": "prateekmedia/pi-hooks",
    "url": "https://github.com/prateekmedia/pi-hooks",
    "firstSeen": "2026-01-06T05:44:03.612Z",
    "mentions": [
      {
        "channel": "general",
        "author": "username",
        "timestamp": "2026-01-05T12:00:00Z",
        "context": "Check out these hooks..."
      }
    ]
  }
}
```



## Files

| File | Purpose |
|------|---------|
| `run-tracker.sh` | Complete workflow - interactive mode |
| `run-tracker-headless.sh` | Complete workflow - headless mode |
| `track.js` | Main tracker with state management |
| `start-browser.js` | Chrome launcher (interactive) |
| `start-browser-headless.js` | Chrome launcher (headless) |
| `package.json` | Node.js dependencies |
| `README.md` | This file |

## Manual Usage

### Start Browser Only

```bash
# Start Chrome with your profile (preserves Discord login)
node start-browser.js --profile

# Or start with fresh profile
node start-browser.js
```

Chrome will open at https://discord.com/app - log in if needed.

### Run Tracker Only

```bash
# Assumes browser is already running on port 9222
node track.js

# Check status
node track.js status

# Reset state
node track.js reset

# Add Discord server
node track.js add-server SERVER_ID "Server Name"
```

## Configuration

### Default Settings

**Tracked Server:**
- The Shitty Coders Club (ID: 1456806362351669492)

**Search Terms:**
- "github.com"

**Filter Terms:**
- pi-, agent, shitty, coding

### Add Another Discord Server

```bash
node track.js add-server SERVER_ID "Server Name"
```

To get server ID:
1. Enable Developer Mode in Discord: Settings → Advanced → Developer Mode
2. Right-click server icon → Copy Server ID

### Modify Filters

Edit `data/`:

```json
{
  "searchTerms": ["github.com", "gitlab.com"],
  "filterTerms": ["pi-", "agent", "extension", "hook"]
}
```

## Commands

```bash
# Run complete workflow (recommended)
./run-tracker.sh

# Run tracker only (browser must be running)
node track.js

# Check status and statistics
node track.js status

# Reset state (start fresh)
node track.js reset

# Add a Discord server
node track.js add-server SERVER_ID "Server Name"

# Start browser manually
node start-browser.js --profile
```

## Status Output Example

```
📊 Discord Tracker Status

Last run: 2026-01-06T05:20:00.000Z
Total findings: 13

Servers:
  ✅ The Shitty Coders Club (1456806362351669492)

Channels tracked: 16

Top channels by matches:
  6x - #general
  5x - #off-topic
  2x - #introductions
```

## Results

Results are saved to `data/runs/TIMESTAMP/`:

- `results-TIMESTAMP.json` - All findings from each run
- Includes message author, content, links, and timestamps

Example result:
```json
[
  {
    "channel": "general",
    "channelId": "1456806363517943821",
    "author": "username",
    "content": "Check out this extension...",
    "timestamp": "2026-01-06T04:15:00.000Z",
    "links": ["https://github.com/user/repo"]
  }
]
```

## State Management

State is persisted in `data/`:

```json
{
  "servers": {
    "1456806362351669492": {
      "name": "The Shitty Coders Club",
      "enabled": true
    }
  },
  "lastRun": "2026-01-06T05:20:00.000Z",
  "channelHistory": {
    "server:channel": {
      "name": "general",
      "lastChecked": "2026-01-06T05:20:00.000Z",
      "totalMatches": 6
    }
  },
  "totalFindings": 13
}
```

**Note:** This file is in `.gitignore` and won't be committed.

## Automation

### Run Daily (Headless)

Add to crontab:

```bash
crontab -e

# Add this line for daily 9 AM scans (headless)
0 9 * * * cd ~/Projects/awesome-pi-agent/discord_scraping && ./run-tracker-headless.sh >> ~/discord-tracker.log 2>&1
```

### Run Weekly (Headless)

```bash
# Every Monday at 9 AM
0 9 * * 1 cd ~/Projects/awesome-pi-agent/discord_scraping && ./run-tracker-headless.sh >> ~/discord-tracker.log 2>&1
```

**Note:** Always use `run-tracker-headless.sh` for automation - it automatically cleans up the browser process.

## Troubleshooting

**Browser doesn't start**
```bash
# Check if Chrome is installed
ls "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Kill existing Chrome instances
pkill -f "remote-debugging-port=9222"

# Try starting manually
node start-browser.js --profile
```

**"Not logged in to Discord"**
- The browser window should open to Discord
- Log in manually in that browser window
- Your session will be preserved for future runs

**No new messages found**
- This is normal if Discord hasn't had activity
- State is saved correctly, just no new content

**Want to force full rescan**
```bash
node track.js reset
./run-tracker.sh
```

**Check what's being tracked**
```bash
node track.js status
cat data/ | jq .
```

**Port 9222 already in use**
```bash
# Find process using port 9222
lsof -i :9222

# Kill it
pkill -f "remote-debugging-port=9222"
```

## Requirements

- **Node.js** - For running the scripts
- **Chrome** - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Discord account** - Active session in the browser
- **jq** (optional) - For processing results (`brew install jq`)

## Integration with Awesome List

The `run-tracker.sh` script automatically:
1. Runs the tracker
2. Extracts GitHub URLs from results
3. Compares against the awesome list README
4. Reports any new repositories found

You can then manually add new resources to the awesome list.

## First-Time Setup

1. Clone or download this directory
2. Run `npm install`
3. Run `./run-tracker.sh`
4. Log in to Discord when Chrome opens
5. Wait for the scan to complete

The first scan will take a few minutes. Subsequent runs only check new messages and are much faster.
