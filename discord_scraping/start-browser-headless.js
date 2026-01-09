#!/usr/bin/env node

/**
 * Headless Chrome launcher for Discord scraping
 * Starts Chrome with remote debugging on port 9222 in headless mode
 */

const { spawn, execSync } = require('child_process');
const http = require('http');

const useProfile = process.argv.includes('--profile');
const SCRAPING_DIR = `${process.env.HOME}/.cache/discord-scraper`;

// Check if already running
function checkBrowser() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:9222/json/version', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBrowser() {
  // Check if already running
  if (await checkBrowser()) {
    console.log('✓ Chrome already running on :9222');
    return;
  }

  // Setup profile directory
  execSync(`mkdir -p "${SCRAPING_DIR}"`, { stdio: 'ignore' });
  
  // Remove lock files
  try {
    execSync(`rm -f "${SCRAPING_DIR}/SingletonLock" "${SCRAPING_DIR}/SingletonSocket" "${SCRAPING_DIR}/SingletonCookie"`, 
      { stdio: 'ignore' });
  } catch {}

  // Copy user profile if requested
  if (useProfile) {
    console.log('Syncing profile...');
    try {
      execSync(
        `rsync -a --delete \
          --exclude='SingletonLock' \
          --exclude='SingletonSocket' \
          --exclude='SingletonCookie' \
          --exclude='*/Sessions/*' \
          --exclude='*/Current Session' \
          --exclude='*/Current Tabs' \
          --exclude='*/Last Session' \
          --exclude='*/Last Tabs' \
          "${process.env.HOME}/Library/Application Support/Google/Chrome/" "${SCRAPING_DIR}/"`,
        { stdio: 'pipe' }
      );
    } catch (error) {
      console.log('⚠️  Could not sync profile, starting with fresh profile');
    }
  }

  // Start Chrome in headless mode with Discord-friendly settings
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${SCRAPING_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'https://discord.com/app'
    ],
    { detached: true, stdio: 'ignore' }
  );
  
  chrome.unref();

  // Wait for Chrome to be ready
  console.log('Starting headless Chrome...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await checkBrowser()) {
      console.log(`✓ Headless Chrome started on :9222${useProfile ? ' with your profile' : ''}`);
      return;
    }
  }

  console.error('✗ Failed to start Chrome');
  process.exit(1);
}

if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Discord Scraper Headless Browser Launcher

Usage:
  node start-browser-headless.js [--profile]

Options:
  --profile    Copy your default Chrome profile (preserves Discord login)
  --help, -h   Show this help

The browser will run headless with remote debugging on port 9222.
Requires Chrome profile with Discord already logged in (--profile flag).
`);
    process.exit(0);
  }

  startBrowser();
}

module.exports = { checkBrowser, startBrowser };
