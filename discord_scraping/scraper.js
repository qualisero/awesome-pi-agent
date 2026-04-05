#!/usr/bin/env node

/**
 * Discord Pi-Agent Resource Tracker (Puppeteer-based)
 * Scrapes Discord for pi-agent resources including forum posts
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Constants
const SCRIPT_DIR = __dirname;
const DATA_DIR = path.join(SCRIPT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const RUNS_DIR = path.join(DATA_DIR, 'runs');
const AGGREGATE_RESULTS_FILE = path.join(DATA_DIR, 'all-results.json');
const AGGREGATE_REPOS_FILE = path.join(DATA_DIR, 'all-repos.json');
const CHROME_PATH = process.env.DISCORD_SCRAPER_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEFAULT_PROFILE_DIR = process.env.HOME
  ? path.join(process.env.HOME, '.cache/discord-scraper')
  : path.join('.cache', 'discord-scraper');
const PROFILE_DIR = process.env.DISCORD_SCRAPER_PROFILE_DIR || DEFAULT_PROFILE_DIR;
const DEFAULT_CHROME_SOURCE_DIR = process.env.HOME
  ? path.join(process.env.HOME, 'Library', 'Application Support', 'Google', 'Chrome')
  : '';
const CHROME_PROFILE_NAME = process.env.DISCORD_SCRAPER_CHROME_PROFILE_NAME || '';
const CHROME_PROFILE_EMAIL = process.env.DISCORD_SCRAPER_CHROME_PROFILE_EMAIL || '';
const CHROME_SOURCE_ROOT = process.env.DISCORD_SCRAPER_CHROME_SOURCE_DIR || DEFAULT_CHROME_SOURCE_DIR;
const FORUM_SEARCH_TERMS = (process.env.DISCORD_SCRAPER_FORUM_SEARCH_TERMS || '')
  .split(',')
  .map(term => term.trim())
  .filter(Boolean);

// Default configuration
const DEFAULT_CONFIG = {
  servers: {
    "1456806362351669492": {
      name: "The Shitty Coders Club",
      enabled: true,
      forumChannels: {
        "1457744485428629628": "extensions",
        "1457119127939580046": "share-your-pi",
        "1457041078925656097": "ask-for-help"
      }
    }
  },
  filterTerms: ["pi-", "agent", "shitty", "coding", ".pi/agent", "/pi-", "extension"],
  lastRun: null,
  channelHistory: {},
  totalFindings: 0,
  totalRuns: 0
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }
  if (trimmed.match(/^[a-z0-9.-]+\.[a-z]{2,}/i)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function extractLinksFromText(text) {
  const rawUrls = text.match(/(https?:\/\/[^\s\)\]"'<>]+|www\.[^\s\)\]"'<>]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s\)\]"'<>]+)/gi) || [];
  return rawUrls.map(normalizeUrl).filter(Boolean);
}

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadAggregateRepos() {
  try {
    const data = await fs.readFile(AGGREGATE_REPOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveAggregateRepos(repos) {
  await fs.writeFile(AGGREGATE_REPOS_FILE, JSON.stringify(repos, null, 2));
}

async function resolveChromeProfileDirName() {
  if (CHROME_PROFILE_NAME) {
    return CHROME_PROFILE_NAME;
  }

  if (CHROME_PROFILE_EMAIL && CHROME_SOURCE_ROOT) {
    try {
      const localStatePath = path.join(CHROME_SOURCE_ROOT, 'Local State');
      const rawState = await fs.readFile(localStatePath, 'utf8');
      const localState = JSON.parse(rawState);
      const infoCache = localState?.profile?.info_cache || {};
      const matchedProfile = Object.entries(infoCache).find(([, info]) => {
        const email = info?.user_name || info?.email || '';
        return email.toLowerCase() === CHROME_PROFILE_EMAIL.toLowerCase();
      });

      if (matchedProfile) {
        return matchedProfile[0];
      }

      console.log(`⚠️  No Chrome profile found for ${CHROME_PROFILE_EMAIL}`);
    } catch (err) {
      console.log(`⚠️  Unable to read Chrome Local State: ${err.message}`);
    }
  }

  return '';
}

async function setupBrowser(headless = false) {
  console.log('Syncing Chrome profile...');
  const profileDirName = await resolveChromeProfileDirName();
  const userDataDir = PROFILE_DIR;
  const launchArgs = [
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1920,1080'
  ];

  if (CHROME_SOURCE_ROOT) {
    try {
      execSync(`rm -f "${PROFILE_DIR}/SingletonLock" "${PROFILE_DIR}/SingletonSocket" "${PROFILE_DIR}/SingletonCookie"`, { stdio: 'ignore' });
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
          "${CHROME_SOURCE_ROOT}/" "${PROFILE_DIR}/"`,
        { stdio: 'pipe' }
      );
      if (profileDirName) {
        launchArgs.push(`--profile-directory=${profileDirName}`);
        console.log(`Using Chrome profile directory: ${profileDirName}`);
      }
    } catch {
      console.log('⚠️  Could not sync profile, using existing');
    }
  } else {
    console.log('⚠️  No Chrome source directory configured; skipping profile sync');
  }

  launchArgs.push('--remote-debugging-port=0');

  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: headless ? 'new' : false,
    userDataDir,
    args: launchArgs,
    defaultViewport: { width: 1920, height: 1080 },
    timeout: 60000,
    protocolTimeout: 120000,
    pipe: true,
    dumpio: true
  });
}

/**
 * Check if the current page is Discord login page or requires authentication
 * IMPROVED: Check for actual logged-in indicators more robustly
 */
async function isLoggedIn(page) {
  const isLogin = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase();

    // More direct checks for Discord UI
    const hasSidebar = !!(
      document.querySelector('[class*="sidebar"]') ||
      document.querySelector('[class*="nav"]') ||
      document.querySelector('nav')
    );

    const hasChannelLinks = !!document.querySelector('a[href*="/channels/"]');

    const hasMessages = !!document.querySelector('[id^="chat-messages-"], [class*="message"]');

    const hasGuildList = !!document.querySelector('[class*="guild"]');

    // Check for login form (this proves we're NOT logged in)
    const hasLoginFields = !!(
      document.querySelector('input[type="email"]') ||
      document.querySelector('input[type="password"]')
    );

    const isLoginUrl = window.location.pathname.includes('/login');
    
    // Login page indicators
    const loginIndicators = [
      'email or phone number',
      'email or phone*',
      'forgot your password',
      'log in with qr code',
      'register',
      'need an account',
      'we\'re so excited to see you again'
    ];
    const loginTextMatches = loginIndicators.filter(indicator => bodyText.includes(indicator)).length;

    // We're logged in if we see Discord UI elements AND NOT on login page
    // Multiple conditions must be true for high confidence
    const discordUIPresent = (hasSidebar || hasChannelLinks || hasGuildList);
    const notOnLoginPage = !hasLoginFields && !isLoginUrl && loginTextMatches === 0;
    const isLoggedIn = discordUIPresent && notOnLoginPage;

    return {
      isLogin: !isLoggedIn, // Return true if NOT logged in
      url: window.location.href,
      hasSidebar,
      hasChannelLinks,
      hasMessages,
      hasGuildList,
      hasLoginFields,
      isLoginUrl,
      loginTextMatches,
      discordUIPresent,
      notOnLoginPage,
      confident: isLoggedIn ? 'HIGH' : 'LOW'
    };
  });

  return isLogin;
}

/**
 * Handle logged out state - IMPROVED with aggressive waiting
 */
async function handleLoggedOut(page, headless) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`❌ DISCORD NOT LOGGED IN`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`The scraper has detected that Discord is showing a login page.`);
  console.log(`This can happen when:\n`);
  console.log(`  - Chrome profile session has expired`);
  console.log(`  - Running headless for the first time without prior login`);
  console.log(`  - Discord logged you out due to inactivity\n`);

  if (headless) {
    console.log(`🔧 TO FIX:\n`);
    console.log(`  1. Run the scraper in INTERACTIVE mode to log in:`);
    console.log(`     cd discord_scraping`);
    console.log(`     ./run.sh\n`);
    console.log(`  2. A Chrome window will open - log in to Discord`);
    console.log(`  3. Let the scraper complete a full scan`);
    console.log(`  4. Future headless runs will use the saved session\n`);
    console.log(`${'='.repeat(70)}\n`);

    await page.browser().close();
    process.exit(1);
  } else {
    console.log(`🔧 LOGIN REQUIRED:\n`);
    console.log(`  The Chrome window is showing the Discord login page.`);
    console.log(`  Please log in manually in the browser window.`);
    console.log(`  The scraper will resume automatically once you are logged in.\n`);
    console.log(`${'='.repeat(70)}\n`);

    // IMPROVED: Poll more frequently and aggressively until logged in
    process.stdout.write('Waiting for login');
    let dots = 0;
    let checkCount = 0;
    const MAX_WAIT_MINUTES = 10;
    const MAX_CHECKS = (MAX_WAIT_MINUTES * 60 * 1000) / 500; // Check every 0.5 second for up to 10 minutes
    
    while (checkCount < MAX_CHECKS) {
      await sleep(500); // Check every 0.5 second (more frequent)
      
      const check = await isLoggedIn(page);
      checkCount++;
      
      // Log more detailed status every 20 checks (every 10 seconds)
      if (checkCount % 20 === 0) {
        console.log(`\n  [Check ${checkCount}] State: ${JSON.stringify({
          hasSidebar: check.hasSidebar,
          hasChannelLinks: check.hasChannelLinks,
          hasGuildList: check.hasGuildList,
          confident: check.confident
        })}`);
      }
      
      if (!check.isLogin) {
        console.log(`\n\n✅ Login detected! Discord UI confirmed. Resuming scraper...\n`);
        await sleep(2000); // Give Discord a moment to fully settle
        return;
      }
      
      dots = (dots + 1) % 4;
      process.stdout.write(`\rWaiting for login${'.'.repeat(dots)}   `);
    }
    
    // Timeout after 10 minutes
    console.log(`\n\n⏱️  Login timeout after ${MAX_WAIT_MINUTES} minutes`);
    console.log(`\nPlease ensure you are:
  1. Connected to the internet
  2. Logged into Discord in the browser
  3. On the Discord home page (not stuck on login page)\n`);
    await page.browser().close();
    process.exit(1);
  }
}

async function getChannels(page, serverId, headless = false) {
  console.log(`\n📡 Server: The Shitty Coders Club (${serverId})\n`);
  
  // Navigate to server
  await page.goto(`https://discord.com/channels/${serverId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // IMPROVED: Wait longer for Discord UI to fully load
  console.log('⏳ Waiting for Discord UI to load...');
  await sleep(3000);

  // Check if we're logged out - use MORE aggressive criteria
  let loginCheck = await isLoggedIn(page);
  if (loginCheck.isLogin) {
    console.log(`\n🔍 Initial login check: NOT LOGGED IN\n`, {
      hasSidebar: loginCheck.hasSidebar,
      hasChannelLinks: loginCheck.hasChannelLinks,
      hasGuildList: loginCheck.hasGuildList,
      confident: loginCheck.confident
    });
    await handleLoggedOut(page, headless);
  }

  // IMPROVED: Wait even longer for sidebar and channels to load after login confirmed
  console.log('⏳ Waiting for channels to load...');
  await sleep(5000);
  
  // Re-check after extended wait
  loginCheck = await isLoggedIn(page);
  if (loginCheck.isLogin) {
    console.log(`\n🔍 Second login check after 5s wait: STILL NOT LOGGED IN\n`);
    console.log(`Reload page and wait for Discord to stabilize...`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(5000);
    loginCheck = await isLoggedIn(page);
    if (loginCheck.isLogin) {
      await handleLoggedOut(page, headless);
    }
  }

  // Now extract channels - should be fully loaded
  console.log('📋 Extracting channels from sidebar...');
  const channels = await page.evaluate((serverId) => {
    const links = Array.from(document.querySelectorAll(`a[href*="/channels/${serverId}/"]`));
    const channelMap = new Map();
    
    links.forEach(link => {
      const match = link.href.match(new RegExp(`/channels/${serverId}/(\\d+)`));
      if (match) {
        const id = match[1];
        const name = link.textContent?.trim() || `channel-${id}`;
        if (!channelMap.has(id)) {
          channelMap.set(id, { id, name });
        }
      }
    });
    
    return Array.from(channelMap.values());
  }, serverId);

  if (channels.length === 0) {
    const loginCheck = await isLoggedIn(page);
    if (loginCheck.isLogin) {
      console.log(`\n🔍 Login check failed after channel fetch:`, {
        url: loginCheck.url,
        hasLoginFields: loginCheck.hasLoginFields,
        isLoginUrl: loginCheck.isLoginUrl,
        loginTextMatches: loginCheck.loginTextMatches,
        authPromptMatches: loginCheck.authPromptMatches,
        hasChannelList: loginCheck.hasChannelList
      });
      await handleLoggedOut(page, headless);
    } else {
      console.log(`\n⚠️  No channels detected after loading server ${serverId}.`);
      console.log(`   The Discord UI may have changed, or the page did not fully load.`);
    }
  }

  return channels;
}

/**
 * PHASE 2: Exhaust all forum threads by scrolling
 * Loads all thread cards from the forum by scrolling to the bottom
 */
async function exhaustForumThreads(page, serverId, forumId) {
  console.log(`     ⏳ Exhausting forum thread list (scrolling to load all threads)...`);
  
  let lastHeight = 0;
  let stagnantRounds = 0;
  let threadCountBefore = 0;
  let iteration = 0;
  
  // Get initial thread count
  threadCountBefore = await page.evaluate(() => {
    const threads = document.querySelectorAll('[role="link"][data-list-item-id]');
    return threads.length;
  });
  console.log(`     Initial threads visible: ${threadCountBefore}`);
  
  // Scroll aggressively until no new threads appear
  for (let i = 0; i < 40; i++) {
    iteration = i;
    const currentHeight = await page.evaluate(() => {
      // Scroll main content area
      const scrollables = document.querySelectorAll('[class*="scroller"], main, [role="main"]');
      scrollables.forEach(el => {
        el.scrollTop = el.scrollHeight;
        el.scrollBy(0, 5000);
      });
      
      // Also scroll window
      window.scrollBy(0, 3000);
      
      // Get maximum scroll height
      const maxHeight = Array.from(scrollables).reduce((acc, el) => {
        return Math.max(acc, el.scrollHeight || 0);
      }, 0);
      
      return Math.max(document.body.scrollHeight || 0, window.innerHeight + window.scrollY, maxHeight);
    });

    // Get current thread count
    const currentThreadCount = await page.evaluate(() => {
      const threads = document.querySelectorAll('[role="link"][data-list-item-id]');
      return threads.length;
    });
    
    console.log(`     Scroll ${i + 1}: ${currentThreadCount} threads found, scroll height ${currentHeight}`);
    
    if (currentHeight <= lastHeight && currentThreadCount === threadCountBefore) {
      stagnantRounds++;
      if (stagnantRounds >= 3) {
        console.log(`     ✅ No new threads after 3 consecutive scrolls. All threads loaded.`);
        break;
      }
    } else {
      stagnantRounds = 0;
      lastHeight = currentHeight;
      threadCountBefore = currentThreadCount;
    }

    await sleep(500);
  }
  
  // Get all thread links
  const threadLinks = await page.evaluate((serverId, forumId) => {
    const links = new Set();
    
    // Method 1: From data-list-item-id attributes
    const items = Array.from(document.querySelectorAll('[role="link"][data-list-item-id]'));
    items.forEach(item => {
      const href = item.getAttribute('href') || item.getAttribute('data-href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://discord.com${href}`;
        links.add(fullUrl);
      }
    });
    
    // Method 2: Direct link elements in forum threads
    const threadCardLinks = Array.from(document.querySelectorAll(`a[href*="/channels/${serverId}/"]`)).map(a => a.href);
    threadCardLinks.forEach(link => links.add(link));
    
    return Array.from(links).filter(link => {
      // Filter out non-thread links
      const match = link.match(/\/channels\/\d+\/(\d+)\/(\d+)/);
      return match && match[1] === String(forumId);
    });
  }, serverId, forumId);
  
  console.log(`     Found ${threadLinks.length} total thread links`);
  return threadLinks;
}

async function scrapeChannel(page, serverId, channelId, channelName, lastTimestamp) {
  await page.goto(`https://discord.com/channels/${serverId}/${channelId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Scroll to load history
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const scroller = document.querySelector('[class*="scroller"]');
      if (scroller) scroller.scrollTop = 0;
    });
    await sleep(500);
  }

  return page.evaluate((lastTs) => {
    function normalizeUrl(url) {
      if (!url) return '';
      const trimmed = url.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed.replace(/^http:\/\//i, 'https://');
      }
      if (trimmed.startsWith('www.')) {
        return `https://${trimmed}`;
      }
      if (trimmed.match(/^[a-z0-9.-]+\.[a-z]{2,}/i)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    }

    function extractLinksFromText(text) {
      const rawUrls = text.match(/(https?:\/\/[^\s\)\]"'<>]+|www\.[^\s\)\]"'<>]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s\)\]"'<>]+)/gi) || [];
      return rawUrls.map(normalizeUrl).filter(Boolean);
    }

    const results = [];
    const messages = document.querySelectorAll('[id^="chat-messages-"]');

    messages.forEach(msg => {
      const timeEl = msg.querySelector('time');
      const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString();

      if (lastTs && new Date(timestamp) <= new Date(lastTs)) return;

      const author = msg.querySelector('[class*="username"]')?.textContent?.trim() || 'Unknown';
      const content = msg.querySelector('[class*="messageContent"]')?.textContent?.trim() || '';
      const linkHrefs = Array.from(msg.querySelectorAll('a[href]')).map(a => a.href);
      const textLinks = extractLinksFromText(content);
      const links = [...new Set([...linkHrefs, ...textLinks].map(normalizeUrl).filter(Boolean))];

      if (links.length > 0) {
        results.push({ author, content: content.substring(0, 500), timestamp, links });
      }
    });

    return results;
  }, lastTimestamp);
}

async function scrapeForumThread(page, threadUrl, forumName, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    await page.goto(threadUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // PHASE 3: Aggressive scrolling to load all messages
    console.log(`       ⏳ Loading all messages in thread (aggressive scroll)...`);
    let messageCount = 0;
    let previousMessageCount = 0;
    let noNewMessagesCount = 0;
    const MAX_SCROLLS = 20;
    
    for (let i = 0; i < MAX_SCROLLS; i++) {
      const currentMessageCount = await page.evaluate(() => {
        const messages = document.querySelectorAll('[id^="chat-messages-"]');
        return messages.length;
      });
      
      console.log(`       Scroll ${i + 1}: ${currentMessageCount} messages loaded`);
      messageCount = currentMessageCount;
      
      // Check if we found new messages
      if (currentMessageCount === previousMessageCount) {
        noNewMessagesCount++;
        if (noNewMessagesCount >= 2) {
          console.log(`       ✅ No new messages after 2 consecutive scrolls. All messages loaded.`);
          break;
        }
      } else {
        noNewMessagesCount = 0;
        previousMessageCount = currentMessageCount;
      }
      
      // Scroll aggressively
      await page.evaluate(() => {
        const scrollers = document.querySelectorAll('[class*="scroller"], main');
        scrollers.forEach(scroller => {
          scroller.scrollTop = scroller.scrollHeight;
          scroller.scrollBy(0, 5000);
        });
      });
      
      await sleep(1000); // Wait longer between scrolls for Discord to render
    }

    return page.evaluate((forumName) => {
      function normalizeUrl(url) {
        if (!url) return '';
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed.replace(/^http:\/\//i, 'https://');
        }
        if (trimmed.startsWith('www.')) {
          return `https://${trimmed}`;
        }
        if (trimmed.match(/^[a-z0-9.-]+\.[a-z]{2,}/i)) {
          return `https://${trimmed}`;
        }
        return trimmed;
      }

      function extractLinksFromText(text) {
        const rawUrls = text.match(/(https?:\/\/[^\s\)\]"'<>]+|www\.[^\s\)\]"'<>]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s\)\]"'<>]+)/gi) || [];
        return rawUrls.map(normalizeUrl).filter(Boolean);
      }

      const title = document.querySelector('h1, [class*="title"]')?.textContent?.trim() || '';
      const messages = Array.from(document.querySelectorAll('[id^="chat-messages-"]'));
      const results = [];

      messages.forEach(msg => {
        const author = msg.querySelector('[class*="username"]')?.textContent?.trim() || 'Unknown';
        const content = msg.querySelector('[class*="messageContent"]')?.textContent?.trim() || '';
        
        // PHASE 5: Better URL extraction - href first, then text
        const linkHrefs = Array.from(msg.querySelectorAll('a[href]')).map(a => a.href);
        const textLinks = extractLinksFromText(content);
        const links = [...new Set([...linkHrefs, ...textLinks].map(normalizeUrl).filter(Boolean))];

        if (links.length > 0) {
          results.push({
            channel: forumName,
            author,
            title,
            content: content.substring(0, 500),
            timestamp: new Date().toISOString(),
            links: links
          });
        }
      });

      return { title, results, messageCount: messages.length };
    }, forumName);
  } catch (err) {
    // PHASE 6: Better error handling with retries
    if (retryCount < MAX_RETRIES) {
      console.log(`       ⚠️  Thread failed (${err.message}), retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(2000);
      return scrapeForumThread(page, threadUrl, forumName, retryCount + 1);
    } else {
      console.log(`       ❌ Thread scrape failed after ${MAX_RETRIES} retries: ${err.message}`);
      throw err;
    }
  }
}

async function scrapeForumChannel(page, serverId, forumId, forumName) {
  console.log(`     Navigating to forum...`);
  
  await page.goto(`https://discord.com/channels/${serverId}/${forumId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);

  // Ensure forum is set to show all posts, newest first
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const allButton = buttons.find(btn => btn.textContent?.trim() === 'All');
    if (allButton) allButton.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sortButton = buttons.find(btn => btn.textContent?.includes('Sort & View'));
    if (sortButton) sortButton.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[role="menuitem"], button'));
    const newest = items.find(item => item.textContent?.trim().toLowerCase() === 'newest');
    if (newest) newest.click();
  });
  await sleep(1000);

  // PHASE 2: Use the exhaustForumThreads function to get ALL thread links
  const threadLinks = await exhaustForumThreads(page, serverId, forumId);

  // Debug: Save page content
  try {
    const rawText = await page.evaluate(() => document.body.innerText);
    const debugPath = `/tmp/discord-forum-${forumName}-${Date.now()}.txt`;
    await fs.writeFile(debugPath, rawText);
    console.log(`     📝 Page text saved: ${debugPath}`);
  } catch (err) {
    console.log(`     ⚠️  Debug save failed: ${err.message}`);
  }

  // Extract any GitHub URLs visible on the forum page itself
  const pageGithubUrls = await page.evaluate(() => {
    function normalizeUrl(url) {
      if (!url) return '';
      const trimmed = url.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed.replace(/^http:\/\//i, 'https://');
      }
      if (trimmed.startsWith('www.')) {
        return `https://${trimmed}`;
      }
      if (trimmed.match(/^[a-z0-9.-]+\.[a-z]{2,}/i)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    }

    const allText = document.body.innerText || '';
    
    // Extract URLs from text
    const rawTextUrls = (allText.match(/(https?:\/\/[^\s\)\]"'<>]+|www\.[^\s\)\]"'<>]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s\)\]"'<>]+)/gi) || []);
    const textUrls = rawTextUrls.map(url => url.startsWith('http') ? url : `https://${url}`);
    
    // Extract URLs from hrefs
    const hrefUrls = Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
    
    // Combine and deduplicate
    const allUrls = [...new Set([...textUrls, ...hrefUrls].map(normalizeUrl).filter(Boolean))];
    
    // Filter for GitHub URLs - NO FILTER TERMS HERE (PHASE 4)
    return allUrls.filter(url => url.includes('github.com'));
  });

  console.log(`     Found ${pageGithubUrls.length} GitHub URLs on forum page itself`);

  // PHASE 6: Improved error handling - track failed threads
  const failedThreads = [];
  const results = [];
  const seenThreads = new Set();

  if (threadLinks.length > 0) {
    console.log(`     Visiting ${threadLinks.length} forum threads for link extraction...`);
    for (const threadUrl of threadLinks) {
      if (seenThreads.has(threadUrl)) continue;
      seenThreads.add(threadUrl);

      try {
        const threadData = await scrapeForumThread(page, threadUrl, forumName);
        threadData.results.forEach(entry => {
          // PHASE 4: NO FILTERING HERE - collect ALL links found
          results.push({
            channel: forumName,
            channelId: forumId,
            author: entry.author,
            title: entry.title,
            content: entry.content,
            timestamp: entry.timestamp,
            links: entry.links
          });
        });
        console.log(`       ✅ Thread OK: ${threadData.messageCount} messages, ${threadData.results.length} links`);
      } catch (err) {
        console.log(`       ❌ Thread FAILED: ${threadUrl}`);
        failedThreads.push({ url: threadUrl, error: err.message });
      }
    }
  } else {
    console.log(`     ⚠️  No forum thread links detected to scrape.`);
  }

  // Add any GitHub URLs found on the forum page directly
  pageGithubUrls.forEach(url => {
    results.push({
      channel: forumName,
      channelId: forumId,
      author: 'Forum Page',
      title: 'GitHub URL found on forum',
      content: `Found in ${forumName} forum`,
      timestamp: new Date().toISOString(),
      links: [url]
    });
  });

  console.log(`     Extracted ${results.length} items from ${threadLinks.length} threads`);
  
  // PHASE 6: Report failed threads
  if (failedThreads.length > 0) {
    console.log(`     ⚠️  ${failedThreads.length} threads failed:`);
    failedThreads.slice(0, 5).forEach(ft => {
      console.log(`       - ${ft.url}`);
    });
  }

  return results;
}

async function scrape(options = {}) {
  const headless = options.headless ?? false;
  const runTimestamp = new Date().toISOString();
  const runId = runTimestamp.replace(/:/g, '-').replace(/\./g, '-');
  const runDir = path.join(RUNS_DIR, runId);

  console.log(`\n🔍 Discord Pi-Agent Resource Tracker`);
  console.log(`Run: ${runTimestamp}\n`);

  const state = await loadState();
  const lastRun = state.lastRun;

  if (lastRun) {
    console.log(`📅 Last run: ${lastRun}`);
    console.log(`🔎 Searching for messages since ${lastRun}\n`);
  } else {
    console.log(`🆕 First run - scanning all messages\n`);
  }

  let browser;
  try {
    browser = await setupBrowser(headless);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allResults = [];

    for (const [serverId, serverInfo] of Object.entries(state.servers)) {
      if (!serverInfo.enabled) continue;

      console.log(`📡 Server: ${serverInfo.name} (${serverId})\n`);

      // Get all channels
      const channels = await getChannels(page, serverId, headless);
      const forumIds = Object.keys(serverInfo.forumChannels || {});
      const regularChannels = channels.filter(c => !forumIds.includes(c.id));
      
      console.log(`Found ${channels.length} channels (${forumIds.length} forums)\n`);

      // Scrape regular channels
      for (const channel of regularChannels) {
        console.log(`  Searching #${channel.name}...`);
        
        try {
          const matches = await scrapeChannel(page, serverId, channel.id, channel.name, lastRun);
          matches.forEach(m => { m.channel = channel.name; m.channelId = channel.id; });
          
          if (matches.length > 0) {
            console.log(`    ✅ Found ${matches.length} new matches`);
            allResults.push(...matches);
          } else {
            console.log(`    ⊘ No new matches`);
          }
        } catch (err) {
          console.log(`    ❌ Error: ${err.message}`);
        }
      }

      // Scrape forum channels
      console.log(`\n  📁 Scanning forum channels...\n`);
      
      for (const [forumId, forumName] of Object.entries(serverInfo.forumChannels || {})) {
        console.log(`  📁 Forum: ${forumName}`);
        
        try {
          const forumResults = await scrapeForumChannel(page, serverId, forumId, forumName);
          allResults.push(...forumResults);
        } catch (err) {
          console.log(`     ❌ Error: ${err.message}`);
        }
      }

      console.log();
    }

    // PHASE 4: NO FILTERING DURING COLLECTION
    // Save RAW data first (all results without any filtering)
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, 'all-messages-raw.json'), JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Raw data saved (${allResults.length} total items)`);

    // NOW apply filtering for pi-agent related content
    const filteredResults = allResults.filter(result => {
      const text = ((result.title || '') + ' ' + result.content + ' ' + result.links.join(' ')).toLowerCase();
      return state.filterTerms.some(term => text.includes(term.toLowerCase()));
    });

    // Extract unique GitHub repos from FILTERED results
    const githubRepos = {};
    const seenUrls = new Set();
    
    filteredResults.forEach(result => {
      result.links.forEach(link => {
        if (seenUrls.has(link)) return;
        seenUrls.add(link);
        
        const match = link.match(/github\.com\/([^\/]+\/[^\/\?#]+)/);
        if (match) {
          const repoName = match[1].replace(/\.git$/, '');
          if (!githubRepos[repoName]) {
            githubRepos[repoName] = {
              name: repoName,
              url: `https://github.com/${repoName}`,
              firstSeen: runTimestamp,
              mentions: []
            };
          }
          githubRepos[repoName].mentions.push({
            channel: result.channel,
            author: result.author,
            timestamp: result.timestamp,
            context: result.content.substring(0, 100)
          });
        }
      });
    });

    // ALSO extract all repos from unfiltered data for reporting
    const allGithubRepos = {};
    const allSeenUrls = new Set();
    
    allResults.forEach(result => {
      result.links.forEach(link => {
        if (allSeenUrls.has(link)) return;
        allSeenUrls.add(link);
        
        const match = link.match(/github\.com\/([^\/]+\/[^\/\?#]+)/);
        if (match) {
          const repoName = match[1].replace(/\.git$/, '');
          if (!allGithubRepos[repoName]) {
            allGithubRepos[repoName] = {
              name: repoName,
              url: `https://github.com/${repoName}`,
              firstSeen: runTimestamp,
              mentions: [],
              piAgent: !!githubRepos[repoName] // Mark if it's pi-agent related
            };
          }
          allGithubRepos[repoName].mentions.push({
            channel: result.channel,
            author: result.author,
            timestamp: result.timestamp,
            context: result.content.substring(0, 100)
          });
        }
      });
    });

    // Check if we scraped login/auth prompts instead of real content
    if (allResults.length > 0) {
      const suspiciousContentCount = allResults.filter(result => {
        const content = result.content.toLowerCase();
        return content.includes('open app') || 
               content.includes('continue in browser') ||
               content.includes('log in') ||
               content.includes('email or phone') ||
               content.includes('forgot your password');
      }).length;

      const suspiciousRatio = suspiciousContentCount / allResults.length;
      
      if (suspiciousRatio > 0.5) {
        console.log(`\n⚠️  WARNING: ${Math.round(suspiciousRatio * 100)}% of scraped content appears to be login/auth prompts\n`);
        await handleLoggedOut(page, headless);
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  - Total messages found: ${allResults.length}`);
    console.log(`  - Pi-agent related: ${filteredResults.length}`);
    console.log(`  - Unique pi-agent repos: ${Object.keys(githubRepos).length}`);
    console.log(`  - Total unique repos (all): ${Object.keys(allGithubRepos).length}`);

    // Extract unreleased forum posts (posts without GitHub URLs)
    const unreleasedPosts = filteredResults.filter(result => result.unreleased && result.title);
    
    // Save run data
    await fs.writeFile(path.join(runDir, 'pi-agent-messages.json'), JSON.stringify(filteredResults, null, 2));
    await fs.writeFile(path.join(runDir, 'repos.json'), JSON.stringify(githubRepos, null, 2));
    await fs.writeFile(path.join(runDir, 'all-repos-unfiltered.json'), JSON.stringify(allGithubRepos, null, 2));
    await fs.writeFile(path.join(runDir, 'unreleased-posts.json'), JSON.stringify(unreleasedPosts, null, 2));
    await fs.writeFile(path.join(runDir, 'metadata.json'), JSON.stringify({
      runId,
      timestamp: runTimestamp,
      previousRun: lastRun,
      totalMessagesScanned: allResults.length,
      piAgentRelated: filteredResults.length,
      githubRepos: Object.keys(githubRepos).length,
      totalGithubReposFound: Object.keys(allGithubRepos).length,
      unreleasedPosts: unreleasedPosts.length
    }, null, 2));

    console.log(`\n💾 Saved to: ${runDir}/`);
    console.log(`   - all-messages-raw.json (unfiltered)`);
    console.log(`   - pi-agent-messages.json (filtered)`);
    console.log(`   - repos.json (pi-agent repos)`);
    console.log(`   - all-repos-unfiltered.json (all repos found)`);

    if (Object.keys(githubRepos).length > 0) {
      console.log(`\n🆕 Pi-Agent GitHub repositories found (${Object.keys(githubRepos).length}):\n`);
      for (const [name, info] of Object.entries(githubRepos)) {
        console.log(`  - ${name}`);
        console.log(`    ${info.url}`);
      }
    }

    // Report repos that were found but filtered out
    const nonPiAgentRepos = Object.keys(allGithubRepos).filter(name => !githubRepos[name]);
    if (nonPiAgentRepos.length > 0) {
      console.log(`\n🔍 Non-pi-agent repos found (${nonPiAgentRepos.length}) - check if any should be added:\n`);
      nonPiAgentRepos.slice(0, 10).forEach(name => {
        const info = allGithubRepos[name];
        console.log(`  - ${name}`);
        console.log(`    ${info.url}`);
        console.log(`    Mentions: ${info.mentions.length}`);
      });
      if (nonPiAgentRepos.length > 10) {
        console.log(`  ... and ${nonPiAgentRepos.length - 10} more`);
      }
    }
    
    if (unreleasedPosts.length > 0) {
      console.log(`\n🔮 Unreleased/Upcoming posts found:\n`);
      for (const post of unreleasedPosts) {
        console.log(`  - ${post.title}`);
        console.log(`    Forum: ${post.channel}`);
        if (post.content && post.content !== 'No GitHub URL yet') {
          const preview = post.content.substring(0, 80);
          console.log(`    ${preview}${post.content.length > 80 ? '...' : ''}`);
        }
      }
    }

    // Update aggregate repos
    const existingRepos = await loadAggregateRepos();
    for (const [name, info] of Object.entries(githubRepos)) {
      if (existingRepos[name]) {
        existingRepos[name].mentions.push(...info.mentions);
      } else {
        existingRepos[name] = info;
      }
    }
    await saveAggregateRepos(existingRepos);

    console.log(`\n📦 Aggregate data updated:`);
    console.log(`  - Total repos: ${Object.keys(existingRepos).length}`);

    // Update state
    state.lastRun = runTimestamp;
    state.totalFindings += filteredResults.length;
    state.totalRuns += 1;
    await saveState(state);

    console.log(`\n✅ State saved`);
    console.log(`📁 Run directory: ${runDir}`);

    return { repos: existingRepos, results: filteredResults, allRepos: allGithubRepos };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Discord Pi-Agent Resource Tracker

Usage:
  node scraper.js [options]

Options:
  --headless    Run without visible browser
  --reset       Reset all state
  --help, -h    Show help
`);
    process.exit(0);
  }

  if (args.includes('reset') || args.includes('--reset')) {
    fs.rm(DATA_DIR, { recursive: true, force: true })
      .then(() => console.log('✅ All data reset'))
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else {
    const headless = args.includes('--headless');
    scrape({ headless })
      .then(() => process.exit(0))
      .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
  }
}

module.exports = { scrape, loadState, loadAggregateRepos };
