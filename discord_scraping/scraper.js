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
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE_DIR = `${process.env.HOME}/.cache/discord-scraper`;

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

async function setupBrowser(headless = false) {
  console.log('Syncing Chrome profile...');
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
        "${process.env.HOME}/Library/Application Support/Google/Chrome/" "${PROFILE_DIR}/"`,
      { stdio: 'pipe' }
    );
  } catch {
    console.log('⚠️  Could not sync profile, using existing');
  }

  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: headless ? 'new' : false,
    userDataDir: PROFILE_DIR,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
}

async function getChannels(page, serverId) {
  await page.goto(`https://discord.com/channels/${serverId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(8000); // Give Discord more time to load sidebar

  return page.evaluate((serverId) => {
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
    const results = [];
    const messages = document.querySelectorAll('[id^="chat-messages-"]');
    
    messages.forEach(msg => {
      const timeEl = msg.querySelector('time');
      const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString();
      
      if (lastTs && new Date(timestamp) <= new Date(lastTs)) return;
      
      const author = msg.querySelector('[class*="username"]')?.textContent?.trim() || 'Unknown';
      const content = msg.querySelector('[class*="messageContent"]')?.textContent?.trim() || '';
      const links = Array.from(msg.querySelectorAll('a[href*="github.com"]')).map(a => a.href);
      
      if (links.length > 0) {
        results.push({ author, content: content.substring(0, 500), timestamp, links });
      }
    });
    
    return results;
  }, lastTimestamp);
}

async function scrapeForumChannel(page, serverId, forumId, forumName) {
  console.log(`     Navigating to forum...`);
  
  await page.goto(`https://discord.com/channels/${serverId}/${forumId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);

  // Scroll to load all posts
  console.log(`     Loading posts...`);
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, 2000);
      const scrollables = document.querySelectorAll('[class*="scroller"], main');
      scrollables.forEach(el => el.scrollTop = el.scrollHeight);
    });
    await sleep(800);
  }

  // Extract GitHub URLs from the forum page
  const githubUrls = await page.evaluate(() => {
    const textUrls = (document.body.innerText.match(/https:\/\/github\.com\/[^\s\)\]"'<>]+/g) || []);
    const hrefUrls = Array.from(document.querySelectorAll('a[href*="github.com"]')).map(a => a.href);
    return [...new Set([...textUrls, ...hrefUrls])];
  });

  console.log(`     Found ${githubUrls.length} GitHub URLs`);
  
  return githubUrls.map(url => ({
    channel: forumName,
    channelId: forumId,
    author: 'Forum Post',
    content: `Found in ${forumName} forum`,
    timestamp: new Date().toISOString(),
    links: [url]
  }));
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
      const channels = await getChannels(page, serverId);
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
      const text = (result.content + ' ' + result.links.join(' ')).toLowerCase();
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

    console.log(`\n📊 Results:`);
    console.log(`  - Total messages with GitHub links: ${allResults.length}`);
    console.log(`  - Pi-agent related: ${filteredResults.length}`);
    console.log(`  - Unique GitHub repos: ${Object.keys(githubRepos).length}`);

    // Save run data
    await fs.mkdir(runDir, { recursive: true });
    
    await fs.writeFile(path.join(runDir, 'all-messages.json'), JSON.stringify(allResults, null, 2));
    await fs.writeFile(path.join(runDir, 'pi-agent-messages.json'), JSON.stringify(filteredResults, null, 2));
    await fs.writeFile(path.join(runDir, 'repos.json'), JSON.stringify(githubRepos, null, 2));
    await fs.writeFile(path.join(runDir, 'metadata.json'), JSON.stringify({
      runId,
      timestamp: runTimestamp,
      previousRun: lastRun,
      messagesScanned: allResults.length,
      piAgentRelated: filteredResults.length,
      githubRepos: Object.keys(githubRepos).length
    }, null, 2));

    console.log(`\n💾 Saved to: ${runDir}/`);

    if (Object.keys(githubRepos).length > 0) {
      console.log(`\n🆕 GitHub repositories found:\n`);
      for (const [name, info] of Object.entries(githubRepos)) {
        console.log(`  - ${name}`);
        console.log(`    ${info.url}`);
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
