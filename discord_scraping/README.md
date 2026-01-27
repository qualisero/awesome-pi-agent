# Discord Scraping Tools

Automatically track pi-agent resources shared in Discord servers, **including forum posts**.

## Quick Start

```bash
# 1. Navigate to the directory
cd discord_scraping

# 2. Install dependencies
npm install

# 3. Run the scraper
./run.sh
```

That's it! The script will:
- Start Chrome with your Discord session (interactive mode required)
- Scan regular channels for GitHub links
- **Scan forum channels for posts** (NEW!)
- Filter for pi-agent related content
- Compare with the awesome list
- Report new repositories


## What's New

**Puppeteer-based scraper** replaces the old CDP-based approach:
- ✅ **Forum thread support** - Now captures posts from Discord forums
- ✅ More reliable page navigation and data extraction
- ✅ Finds 3-4x more repositories than the old scraper

## Modes

**Interactive Mode (Only Mode Supported)**

```bash
./run.sh
# or
node scraper.js
```

Opens a visible browser window. This is the **only mode supported** because Discord requires interactive authentication.

Good for:
- First-time setup
- Debugging issues
- Watching the scan

**Note:** Headless mode is not supported due to Discord's authentication requirements.

## How It Works

### First Run
- Launches Chrome with your profile (preserves Discord login)
- Opens visible browser window (required for Discord auth)
- Scans all channels and forum posts
- Extracts GitHub links
- Saves state for incremental updates
- Takes a few minutes

### Subsequent Runs
- Only scans for messages newer than last run
- Fast (usually < 1 minute)
- Incremental updates only

## What Gets Scanned

### Regular Channels ✅
- Text channels (e.g., #welcome, #announcements)
- Active threads channels (e.g., #pi-mono, #general)
- Extracts messages with GitHub links

### Forum Channels ✅ (NEW!)
- Forum posts with GitHub URLs
- Captures content from forum cards
- Finds resources not visible in regular channels

**Example forums scanned:**
- extensions forum
- share-your-pi forum
- ask-for-help forum

## Commands

```bash
# Run with visible browser (only mode supported)
./run.sh

# Reset all data and start fresh
node scraper.js --reset

# Show help
node scraper.js --help
```

## Data Structure

All data is stored in the `data/` directory (ignored by git):

```
data/
├── state.json              # Tracker state and configuration
├── all-repos.json          # All repos discovered (aggregate)
└── runs/
    └── TIMESTAMP/
        ├── metadata.json           # Run statistics
        ├── all-messages.json       # All messages found
        ├── pi-agent-messages.json  # Filtered pi-agent related
        └── repos.json              # Repos found in this run
```

### State File

Tracks configuration and run history:

```json
{
  "servers": {
    "1456806362351669492": {
      "name": "The Shitty Coders Club",
      "enabled": true,
      "forumChannels": {
        "1457744485428629628": "extensions",
        "1457119127939580046": "share-your-pi",
        "1457041078925656097": "ask-for-help"
      }
    }
  },
  "lastRun": "2026-01-09T12:00:00.000Z",
  "totalFindings": 64,
  "totalRuns": 3
}
```

### Aggregate Repos File

All discovered repositories with mention details:

```json
{
  "user/repo": {
    "name": "user/repo",
    "url": "https://github.com/user/repo",
    "firstSeen": "2026-01-09T12:00:00.000Z",
    "mentions": [
      {
        "channel": "extensions",
        "author": "username",
        "timestamp": "2026-01-08T10:00:00Z",
        "context": "Check out this extension..."
      }
    ]
  }
}
```

## Configuration

### Adding Discord Servers

Edit `data/state.json`:

```json
{
  "servers": {
    "SERVER_ID": {
      "name": "Server Name",
      "enabled": true,
      "forumChannels": {
        "FORUM_ID": "forum-name"
      }
    }
  }
}
```

To get IDs:
1. Enable Developer Mode in Discord: Settings → Advanced → Developer Mode
2. Right-click server/channel → Copy ID

### Modifying Filters

The scraper filters for pi-agent related content. Edit in `scraper.js`:

```javascript
filterTerms: ["pi-", "agent", "shitty", "coding", ".pi/agent", "/pi-", "extension"]
```

## Automation

### Daily Scan (Headless)

Add to crontab:

```bash
crontab -e

# Daily at 9 AM
```

### Weekly Scan

```bash
# Every Monday at 9 AM
```


## Troubleshooting

### Browser doesn't start

```bash
# Check if Chrome is installed
ls "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Kill existing Chrome instances
pkill -f "Google Chrome"

# Try starting manually
node scraper.js
```

### Not logged in to Discord

The scraper uses your Chrome profile to preserve Discord login:
1. The browser will open to Discord
2. Log in manually if needed
3. Your session is saved for future runs

### No new messages found

This is normal if Discord hasn't had activity since the last run.

### Want to force full rescan

```bash
node scraper.js --reset
./run.sh
```

### Port or profile issues

```bash
# Clean up profile locks
rm -f ~/.cache/discord-scraper/SingletonLock

# Reset everything
rm -rf ~/.cache/discord-scraper
rm -rf data/
./run.sh
```

## Requirements

- **Node.js** - For running the scraper
- **Chrome** - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Discord account** - Active session (logs in via browser)
- **puppeteer-core** - Installed via `npm install`

## Performance

### Scan Times
- First run (full scan): ~3-5 minutes
- Incremental runs: ~30-60 seconds
- Headless vs interactive: Similar performance

### Resource Usage
- Memory: ~200-400 MB (Chrome)
- CPU: Low (mostly waiting for page loads)
- Network: Minimal (only Discord pages)

## Integration with Awesome List

The `run.sh` script automatically:
1. Runs the scraper
2. Extracts GitHub URLs from results
3. Compares against the awesome list README
4. Reports any new repositories found

You can then manually validate and add new resources to the awesome list.

## Example Output

```
🔍 Discord Pi-Agent Resource Tracker
Run: 2026-01-09T12:00:00.000Z

🆕 First run - scanning all messages

📡 Server: The Shitty Coders Club

Found 12 channels (3 forums)

  Searching #welcome...
    ⊘ No new matches
  Searching #pi-mono...
    ✅ Found 50 new matches

  📁 Scanning forum channels...

  📁 Forum: extensions
     Navigating to forum...
     Loading posts...
     Found 3 GitHub URLs

📊 Results:
  - Total messages with GitHub links: 66
  - Pi-agent related: 64
  - Unique GitHub repos: 12

🆕 GitHub repositories found:

  - tmustier/pi-extensions
    https://github.com/tmustier/pi-extensions
  - mrexodia/pi-cost-dashboard
    https://github.com/mrexodia/pi-cost-dashboard
  - cv/pi-ssh-remote
    https://github.com/cv/pi-ssh-remote

✅ Complete
```

## Migrating from Old Scraper

The new Puppeteer scraper is backward compatible:
- Uses the same data directory structure
- Preserves state.json format
- Aggregate data files compatible
- Simply replace old scripts with new ones

**Old files removed:**
- `track.js` (CDP-based scraper)
- `start-browser.js`
- `run-tracker.sh`

**New files:**
- `scraper.js` (Puppeteer-based scraper)
- `run.sh` (Unified run script)

## License

MIT - see LICENSE in parent directory
