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
 */
async function isLoggedIn(page) {
  const isLogin = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase();

    // Check for login page indicators
    const loginIndicators = [
      'email or phone number',
      'email or phone*',
      'forgot your password',
      'log in with qr code',
      'register',
      'need an account',
      'we\'re so excited to see you again'
    ];

    // Check for app redirect/authentication prompts
    const authPromptIndicators = [
      'do you want to open this link in your discord app',
      'open app',
      'open discord in your browser',
      'continue in browser',
      'continue to discord',
      'log in to discord',
      'you need to log in'
    ];

    // Check if we have login form fields
    const hasLoginFields = !!(
      document.querySelector('input[type="email"]') ||
      document.querySelector('input[type="password"]')
    );

    // Check URL for login
    const isLoginUrl = window.location.pathname.includes('/login');

    // Check for login-related text (more than 2 matches suggests login page)
    const loginTextMatches = loginIndicators.filter(indicator => bodyText.includes(indicator)).length;
    const authPromptMatches = authPromptIndicators.filter(indicator => bodyText.includes(indicator)).length;

    // Check if we see actual Discord channels (logged in successfully)
    const hasChannelList = !!(
      document.querySelector('[class*="channels"]') ||
      document.querySelector('[class*="sidebar"]') ||
      document.querySelector('[aria-label*="Channels"]')
    );

    const isAuthenticated = hasLoginFields || isLoginUrl || loginTextMatches >= 1 || authPromptMatches >= 1;

    return {
      isLogin: isAuthenticated && !hasChannelList,
      url: window.location.href,
      hasLoginFields,
      isLoginUrl,
      loginTextMatches,
      authPromptMatches,
      hasChannelList
    };
  });

  return isLogin;
}

/**
 * Handle logged out state
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

    // Poll until logged in
    process.stdout.write('Waiting for login');
    let dots = 0;
    
    while (true) {
      await sleep(2000);
      
      const check = await isLoggedIn(page);
      if (!check.isLogin) {
        console.log(`\n\n✅ Login detected! Resuming scraper...\n`);
        return;
      }
      
      dots = (dots + 1) % 4;
      process.stdout.write(`\rWaiting for login${'.'.repeat(dots)}   `);
    }
  }
}

async function getChannels(page, serverId, headless = false) {
  await page.goto(`https://discord.com/channels/${serverId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000); // Initial wait for page load

  // Check if we're logged out
  const loginCheck = await isLoggedIn(page);
  if (loginCheck.isLogin) {
    console.log(`\n🔍 Login check failed:`, {
      url: loginCheck.url,
      hasLoginFields: loginCheck.hasLoginFields,
      isLoginUrl: loginCheck.isLoginUrl,
      loginTextMatches: loginCheck.loginTextMatches,
      authPromptMatches: loginCheck.authPromptMatches,
      hasChannelList: loginCheck.hasChannelList
    });
    await handleLoggedOut(page, headless);
  }

  await sleep(5000); // Additional wait for Discord to load sidebar

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

async function scrapeForumThread(page, threadUrl, forumName) {
  await page.goto(threadUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const scroller = document.querySelector('[class*="scroller"], main');
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    await sleep(500);
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

    return { title, results };
  }, forumName);
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

  // Scroll to load all posts
  console.log(`     Loading posts...`);
  let lastHeight = 0;
  let stagnantRounds = 0;
  for (let i = 0; i < 30; i++) {
    const currentHeight = await page.evaluate(() => {
      window.scrollBy(0, 3000);
      const scrollables = document.querySelectorAll('[class*="scroller"], main');
      scrollables.forEach(el => {
        el.scrollTop = el.scrollHeight;
        el.scrollBy(0, 5000);
      });
      const maxHeight = Array.from(scrollables).reduce((acc, el) => Math.max(acc, el.scrollHeight || 0), 0);
      return Math.max(document.body.scrollHeight || 0, maxHeight);
    });

    if (currentHeight <= lastHeight) {
      stagnantRounds += 1;
      if (stagnantRounds >= 3) {
        break;
      }
    } else {
      stagnantRounds = 0;
      lastHeight = currentHeight;
    }

    await sleep(1000);
  }
  
  // Debug: Save page content
  try {
    const rawText = await page.evaluate(() => document.body.innerText);
    const debugPath = `/tmp/discord-forum-${forumName}-${Date.now()}.txt`;
    await fs.writeFile(debugPath, rawText);
    console.log(`     📝 Page text saved: ${debugPath}`);
  } catch (err) {
    console.log(`     ⚠️  Debug save failed: ${err.message}`);
  }

  // Simpler approach: Extract all text content visible on forum page
  // This includes thread titles, descriptions, and any GitHub URLs
  const pageData = await page.evaluate((serverId, forumId) => {
    const allText = document.body.innerText || '';
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Extract URLs (including bare links)
    const rawTextUrls = (allText.match(/(https?:\/\/[^\s\)\]"'<>]+|www\.[^\s\)\]"'<>]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s\)\]"'<>]+)/gi) || []);
    const textUrls = rawTextUrls.map(url => url.startsWith('http') ? url : `https://${url}`);
    const hrefUrls = Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
    const githubUrls = [...new Set([...textUrls, ...hrefUrls].map(url => url.replace(/^http:\/\//i, 'https://')))];

    // Thread links from forum cards
    const threadLinkPattern = new RegExp(`/channels/${serverId}/(?:${forumId}/)?\\d+`);
    const threadLinks = Array.from(document.querySelectorAll(`a[href*="/channels/${serverId}/"]`))
      .map(a => a.href)
      .filter(href => threadLinkPattern.test(href))
      .filter(href => !href.endsWith(`/${forumId}`));

    const rawThreadIds = Array.from(document.querySelectorAll('[data-list-item-id], [role="link"][data-list-item-id]'))
      .map(el => el.getAttribute('data-list-item-id') || '')
      .filter(id => id.includes(`channels___${serverId}`));

    const roleLinks = Array.from(document.querySelectorAll('[role="link"][href]'))
      .map(el => el.getAttribute('href') || '')
      .filter(href => href.includes(`/channels/${serverId}/`))
      .map(href => href.startsWith('http') ? href : `https://discord.com${href}`);

    const threadIds = rawThreadIds
      .map(id => id.split('channels___')[1])
      .map(id => id.split('___'))
      .filter(parts => parts.length >= 2)
      .map(parts => {
        const [server, channel, thread] = parts;
        if (!thread) {
          if (parts.length === 2) {
            return `https://discord.com/channels/${server}/${forumId}/${channel}`;
          }
          return '';
        }
        if (channel !== String(forumId)) return '';
        return `https://discord.com/channels/${server}/${channel}/${thread}`;
      })
      .filter(Boolean);

    // Try to identify thread-like structures in the text
    // Threads usually have a title followed by description/metadata
    const threads = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip very short lines or metadata-like lines
      if (line.length < 5 || line.match(/^\d+$/) || line.match(/^[\d\s]+ago$/)) {
        continue;
      }

      // Skip common Discord UI text
      if (['Search', 'New Post', 'All', 'Sort & View', 'help wanted', 'showcase'].includes(line)) {
        continue;
      }

      // Look for lines that seem like thread titles (reasonable length, not URLs)
      if (line.length > 5 && line.length < 150 && !line.startsWith('http')) {
        // Get next few lines as potential description
        const description = lines.slice(i + 1, i + 4).join(' ').substring(0, 200);

        threads.push({
          title: line,
          description: description
        });
      }
    }

    return {
      threads: threads,
      githubUrls: githubUrls,
      threadLinks: Array.from(new Set([...threadLinks, ...roleLinks, ...threadIds])),
      rawThreadIds: rawThreadIds,
      allText: allText.substring(0, 2000) // Keep snippet for debugging
    };
  }, serverId, forumId);

  console.log(`     Identified ${pageData.threads.length} potential threads, ${pageData.githubUrls.length} GitHub URLs`);
  console.log(`     Thread link candidates: ${pageData.threadLinks.length}`);
  if (pageData.rawThreadIds?.length) {
    const debugPath = `/tmp/discord-forum-${forumName}-thread-ids-${Date.now()}.txt`;
    await fs.writeFile(debugPath, pageData.rawThreadIds.join('\n'));
    console.log(`     🧭 Thread ids saved: ${debugPath} (${pageData.rawThreadIds.length})`);
  } else {
    console.log(`     ⚠️  No raw thread ids detected in DOM.`);
  }
  
  // Match GitHub URLs to threads or create standalone entries
  const forumPosts = [];
  
  // Add threads with GitHub URLs
  pageData.threads.forEach(thread => {
    const relatedUrls = pageData.githubUrls.filter(url => 
      pageData.allText.includes(thread.title) && 
      Math.abs(pageData.allText.indexOf(thread.title) - pageData.allText.indexOf(url)) < 500
    );
    
    if (relatedUrls.length > 0) {
      forumPosts.push({
        title: thread.title,
        content: thread.description,
        githubUrls: relatedUrls
      });
    } else {
      // Thread without GitHub URL (unreleased)
      forumPosts.push({
        title: thread.title,
        content: thread.description,
        githubUrls: []
      });
    }
  });
  
  // Add any GitHub URLs not matched to threads
  const matchedUrls = new Set(forumPosts.flatMap(p => p.githubUrls));
  pageData.githubUrls.forEach(url => {
    if (!matchedUrls.has(url)) {
      forumPosts.push({
        title: '',
        content: `Found in ${forumName} forum`,
        githubUrls: [url]
      });
    }
  });

  console.log(`     Found ${forumPosts.length} forum posts`);

  const results = [];
  forumPosts.forEach(post => {
    // Add entries for posts with GitHub URLs
    if (post.githubUrls.length > 0) {
      post.githubUrls.forEach(url => {
        results.push({
          channel: forumName,
          channelId: forumId,
          author: 'Forum Post',
          title: post.title,
          content: post.content || `Found in ${forumName} forum`,
          timestamp: new Date().toISOString(),
          links: [url]
        });
      });
    }

    // Also add entries for posts without URLs (upcoming/planned extensions)
    if (post.title && post.githubUrls.length === 0) {
      results.push({
        channel: forumName,
        channelId: forumId,
        author: 'Forum Post',
        title: post.title,
        content: post.content || 'No GitHub URL yet',
        timestamp: new Date().toISOString(),
        links: [],
        unreleased: true
      });
    }
  });

  const seenThreads = new Set();

  if (pageData.threadLinks.length > 0) {
    console.log(`     Visiting ${pageData.threadLinks.length} forum threads for link extraction...`);
    for (const threadUrl of pageData.threadLinks) {
      if (seenThreads.has(threadUrl)) continue;
      seenThreads.add(threadUrl);

      try {
        const threadData = await scrapeForumThread(page, threadUrl, forumName);
        threadData.results.forEach(entry => {
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
      } catch (err) {
        console.log(`     ⚠️  Thread scrape failed (${threadUrl}): ${err.message}`);
      }
    }
  } else {
    console.log(`     ⚠️  No forum thread links detected to scrape.`);
  }

  if (FORUM_SEARCH_TERMS.length > 0) {
    console.log(`     Searching forum cards for: ${FORUM_SEARCH_TERMS.join(', ')}`);
    const forumUrl = `https://discord.com/channels/${serverId}/${forumId}`;

    for (const term of FORUM_SEARCH_TERMS) {
      try {
        const matches = await page.$$eval('li[data-item-role="item"]', (items, searchTerm) => {
          const termLower = searchTerm.toLowerCase();
          return items
            .map((item, index) => ({ index, text: item.innerText?.toLowerCase() || '' }))
            .filter(entry => entry.text.includes(termLower))
            .map(entry => entry.index);
        }, term);

        if (matches.length === 0) {
          console.log(`     ⚠️  No forum cards matched "${term}"`);
          continue;
        }

        console.log(`     Found ${matches.length} cards matching "${term}"`);
        for (const matchIndex of matches) {
          const cards = await page.$$('li[data-item-role="item"]');
          const card = cards[matchIndex];
          if (!card) continue;

          const currentUrl = page.url();
          await card.click();
          await page.waitForFunction(prev => location.href !== prev, { timeout: 10000 }, currentUrl);
          const threadUrl = page.url();

          if (!seenThreads.has(threadUrl)) {
            seenThreads.add(threadUrl);
            try {
              const threadData = await scrapeForumThread(page, threadUrl, forumName);
              threadData.results.forEach(entry => {
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
            } catch (err) {
              console.log(`     ⚠️  Thread scrape failed (${threadUrl}): ${err.message}`);
            }
          }

          await page.goto(forumUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(2000);
        }
      } catch (err) {
        console.log(`     ⚠️  Forum card search failed for "${term}": ${err.message}`);
      }
    }
  }

  console.log(`     Extracted ${results.length} items (${results.filter(r => r.unreleased).length} unreleased)`);

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

    // Filter for pi-agent related content
    const filteredResults = allResults.filter(result => {
      const text = ((result.title || '') + ' ' + result.content + ' ' + result.links.join(' ')).toLowerCase();
      return state.filterTerms.some(term => text.includes(term.toLowerCase()));
    });

    // Extract unique GitHub repos
    const githubRepos = {};
    const seenUrls = new Set();
    
    allResults.forEach(result => {
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
    console.log(`  - Total messages with GitHub links: ${allResults.length}`);
    console.log(`  - Pi-agent related: ${filteredResults.length}`);
    console.log(`  - Unique GitHub repos: ${Object.keys(githubRepos).length}`);

    // Extract unreleased forum posts (posts without GitHub URLs)
    const unreleasedPosts = filteredResults.filter(result => result.unreleased && result.title);
    
    // Save run data
    await fs.mkdir(runDir, { recursive: true });
    
    await fs.writeFile(path.join(runDir, 'all-messages.json'), JSON.stringify(allResults, null, 2));
    await fs.writeFile(path.join(runDir, 'pi-agent-messages.json'), JSON.stringify(filteredResults, null, 2));
    await fs.writeFile(path.join(runDir, 'repos.json'), JSON.stringify(githubRepos, null, 2));
    await fs.writeFile(path.join(runDir, 'unreleased-posts.json'), JSON.stringify(unreleasedPosts, null, 2));
    await fs.writeFile(path.join(runDir, 'metadata.json'), JSON.stringify({
      runId,
      timestamp: runTimestamp,
      previousRun: lastRun,
      messagesScanned: allResults.length,
      piAgentRelated: filteredResults.length,
      githubRepos: Object.keys(githubRepos).length,
      unreleasedPosts: unreleasedPosts.length
    }, null, 2));

    console.log(`\n💾 Saved to: ${runDir}/`);

    if (Object.keys(githubRepos).length > 0) {
      console.log(`\n🆕 GitHub repositories found:\n`);
      for (const [name, info] of Object.entries(githubRepos)) {
        console.log(`  - ${name}`);
        console.log(`    ${info.url}`);
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

    return { repos: existingRepos, results: filteredResults };
    
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
