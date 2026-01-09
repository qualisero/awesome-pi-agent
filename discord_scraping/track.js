#!/usr/bin/env node

/**
 * Discord Pi-Agent Resource Tracker
 * Incrementally scrapes Discord for new pi-agent resources with state persistence
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs').promises;
const path = require('path');

// Constants
const SCRIPT_DIR = __dirname;
const DATA_DIR = path.join(SCRIPT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const RUNS_DIR = path.join(DATA_DIR, 'runs');
const AGGREGATE_RESULTS_FILE = path.join(DATA_DIR, 'all-results.json');
const AGGREGATE_REPOS_FILE = path.join(DATA_DIR, 'all-repos.json');
const CDP_PORT = 9222;
const CDP_HOST = 'localhost';

// Default configuration
const DEFAULT_CONFIG = {
  servers: {
    "1456806362351669492": {
      name: "The Shitty Coders Club",
      enabled: true
    }
  },
  searchTerms: ["github.com"],
  filterTerms: ["pi-", "agent", "shitty", "coding", ".pi/agent", "/pi-"],
  lastRun: null,
  channelHistory: {},
  totalFindings: 0,
  totalRuns: 0
};

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No previous state found, starting fresh...');
    return DEFAULT_CONFIG;
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadAggregateResults() {
  try {
    const data = await fs.readFile(AGGREGATE_RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveAggregateResults(results) {
  await fs.writeFile(AGGREGATE_RESULTS_FILE, JSON.stringify(results, null, 2));
}

async function loadAggregateRepos() {
  try {
    const data = await fs.readFile(AGGREGATE_REPOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveAggregateRepos(repos) {
  await fs.writeFile(AGGREGATE_REPOS_FILE, JSON.stringify(repos, null, 2));
}

async function searchChannel(Runtime, serverId, channel, searchTerm, lastTimestamp) {
  const channelUrl = `https://discord.com/channels/${serverId}/${channel.id}`;
  
  console.log(`  Searching #${channel.name}...`);
  
  // Navigate using window.location to avoid detachment issues
  await Runtime.evaluate({
    expression: `window.location.href = "${channelUrl}"`
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Scroll to load history - more scrolls for forum channels
  const scrollCount = channel.name.startsWith('Forum') ? 10 : 5;
  for (let i = 0; i < scrollCount; i++) {
    await Runtime.evaluate({
      expression: 'document.querySelector("[class*=\\"scroller\\"]")?.scrollTo(0, 0)'
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Search messages with timestamp filter - check both content AND links
  const searchResult = await Runtime.evaluate({
    expression: `
      Array.from(document.querySelectorAll('[id^="chat-messages-"]'))
        .map(msg => {
          const authorEl = msg.querySelector('[class*="username"]');
          const contentEl = msg.querySelector('[class*="messageContent"]');
          const timeEl = msg.querySelector('time');
          const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString();
          const content = contentEl?.textContent?.trim() || '';
          const links = Array.from(msg.querySelectorAll('a[href]')).map(a => a.href);
          
          // Skip if before last run timestamp
          if (${lastTimestamp ? `new Date(timestamp) <= new Date('${lastTimestamp}')` : 'false'}) {
            return null;
          }
          
          // Check if content OR any link contains the search term
          const hasSearchTerm = content.toLowerCase().includes('${searchTerm.toLowerCase()}') ||
                                 links.some(link => link.toLowerCase().includes('${searchTerm.toLowerCase()}'));
          
          if (!hasSearchTerm) {
            return null;
          }
          
          return {
            channel: '${channel.name}',
            channelId: '${channel.id}',
            author: authorEl?.textContent?.trim() || 'Unknown',
            content: content,
            timestamp: timestamp,
            links: links
          };
        })
        .filter(m => m !== null)
    `,
    returnByValue: true
  });
  
  return searchResult.result.value || [];
}

async function getForumThreads(Runtime, serverId, forumChannelId) {
  // Navigate to forum channel
  await Runtime.evaluate({
    expression: `window.location.href = "https://discord.com/channels/${serverId}/${forumChannelId}"`
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Scroll to load more threads - forums need more scrolling
  for (let i = 0; i < 10; i++) {
    await Runtime.evaluate({
      expression: `
        const scroller = document.querySelector('[class*="scroller"]');
        if (scroller) {
          scroller.scrollTo(0, scroller.scrollHeight);
        }
      `
    });
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Extract thread links from forum using multiple selectors
  const threadsResult = await Runtime.evaluate({
    expression: `
      (function() {
        // Try multiple selectors for forum threads
        const threadLinks = Array.from(document.querySelectorAll('a[href*="/channels/${serverId}/${forumChannelId}/"]'));
        const threads = [];
        
        threadLinks.forEach(a => {
          const match = a.href.match(/\\/channels\\/${serverId}\\/${forumChannelId}\\/([0-9]+)/);
          if (match && match[1] !== '${forumChannelId}') {
            // Get thread title from various possible locations
            let name = a.getAttribute('aria-label') || 
                       a.querySelector('[class*="title"]')?.textContent ||
                       a.textContent?.trim() || 
                       'thread-' + match[1];
            
            threads.push({
              id: match[1],
              name: name.substring(0, 100) // Limit name length
            });
          }
        });
        
        // Deduplicate by ID
        const unique = threads.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
        return JSON.stringify(unique);
      })()
    `,
    returnByValue: true
  });
  
  return JSON.parse(threadsResult.result.value || '[]');
}

async function getChannels(Runtime, serverId) {
  // Navigate to server root
  await Runtime.evaluate({
    expression: `window.location.href = "https://discord.com/channels/${serverId}"`
  });
  
  await new Promise(resolve => setTimeout(resolve, 8000)); // Increased wait time for Discord to load
  
  // Extract channels from links
  const linksResult = await Runtime.evaluate({
    expression: `
      JSON.stringify(
        Array.from(new Set(
          Array.from(document.querySelectorAll('a[href*="/channels/${serverId}/"]'))
            .map(a => a.href.match(/\\/channels\\/${serverId}\\/([0-9]+)/)?.[1])
            .filter(id => id)
        ))
      )
    `,
    returnByValue: true
  });
  
  const channelIds = JSON.parse(linksResult.result.value);
  
  // Get channel names and detect forum channels
  const channels = [];
  for (const id of channelIds) {
    const nameResult = await Runtime.evaluate({
      expression: `
        (function() {
          const link = document.querySelector('a[href*="/channels/${serverId}/${id}"]');
          if (!link) return JSON.stringify({ name: 'channel-${id}', isForum: false });
          
          const name = link.textContent?.trim() || 'channel-${id}';
          const isForum = link.getAttribute('aria-label')?.toLowerCase().includes('forum') || 
                         link.parentElement?.querySelector('[data-list-item-id*="forum"]') !== null ||
                         name.toLowerCase().includes('forum');
          
          return JSON.stringify({ name: name, isForum: isForum });
        })()
      `,
      returnByValue: true
    });
    
    const channelInfo = JSON.parse(nameResult.result.value || '{"name":"channel-' + id + '","isForum":false}');
    channels.push({
      id: id,
      name: channelInfo.name,
      isForum: channelInfo.isForum
    });
  }
  
  return channels;
}

async function track() {
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
  
  let client;
  
  try {
    client = await CDP({ port: CDP_PORT, host: CDP_HOST });
    const { Runtime } = client;
    await Runtime.enable();
    
    const allResults = [];
    
    for (const [serverId, serverInfo] of Object.entries(state.servers)) {
      if (!serverInfo.enabled) continue;
      
      console.log(`📡 Server: ${serverInfo.name} (${serverId})\n`);
      
      // Get channels
      const channels = await getChannels(Runtime, serverId);
      console.log(`Found ${channels.length} channels\n`);
      
      for (const channel of channels) {
        const channelKey = `${serverId}:${channel.id}`;
        const channelState = state.channelHistory[channelKey] || {
          name: channel.name,
          lastChecked: null,
          totalMatches: 0,
          lastMatchTimestamp: null
        };
        
        // If it's a forum channel, get threads and search them
        if (channel.isForum) {
          console.log(`  📁 Forum: ${channel.name}`);
          const threads = await getForumThreads(Runtime, serverId, channel.id);
          console.log(`     Found ${threads.length} threads`);
          
          for (const thread of threads) {
            const threadKey = `${serverId}:${channel.id}:${thread.id}`;
            const threadState = state.channelHistory[threadKey] || {
              name: `${channel.name} / ${thread.name}`,
              lastChecked: null,
              totalMatches: 0,
              lastMatchTimestamp: null
            };
            
            console.log(`     Searching thread: ${thread.name}...`);
            const threadMatches = await searchChannel(
              Runtime,
              serverId,
              { id: thread.id, name: `${channel.name} / ${thread.name}` },
              state.searchTerms[0],
              lastRun
            );
            
            threadState.lastChecked = runTimestamp;
            threadState.totalMatches += threadMatches.length;
            
            if (threadMatches.length > 0) {
              console.log(`        ✅ Found ${threadMatches.length} matches in thread`);
              threadState.lastMatchTimestamp = threadMatches[0].timestamp;
              allResults.push(...threadMatches);
            }
            
            state.channelHistory[threadKey] = threadState;
          }
        } else {
          // Regular channel search
          const matches = await searchChannel(
            Runtime, 
            serverId, 
            channel, 
            state.searchTerms[0],
            lastRun
          );
          
          channelState.lastChecked = runTimestamp;
          channelState.totalMatches += matches.length;
          
          if (matches.length > 0) {
            console.log(`    ✅ Found ${matches.length} new matches`);
            channelState.lastMatchTimestamp = matches[0].timestamp;
            allResults.push(...matches);
          } else {
            console.log(`    ⊘ No new matches`);
          }
        }
        
        state.channelHistory[channelKey] = channelState;
      }
      
      console.log();
    }
    
    // Filter results for pi-agent related content
    const filteredResults = allResults.filter(result => {
      const text = (result.content + ' ' + result.links.join(' ')).toLowerCase();
      return state.filterTerms.some(term => text.includes(term.toLowerCase()));
    });
    
    console.log(`\n📊 Results:`);
    console.log(`  - Total new messages with links: ${allResults.length}`);
    console.log(`  - Pi-agent related: ${filteredResults.length}`);
    
    // Extract GitHub URLs
    const githubUrls = new Set();
    const githubRepos = {};
    
    filteredResults.forEach(result => {
      result.links.forEach(link => {
        if (link.includes('github.com')) {
          githubUrls.add(link);
          
          const match = link.match(/github\.com\/([^\/]+\/[^\/\?#]+)/);
          if (match) {
            const repoName = match[1];
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
              context: result.content.substring(0, 200)
            });
          }
        }
      });
    });
    
    console.log(`  - Unique GitHub URLs: ${githubUrls.size}\n`);
    
    // Create run directory and save results
    await fs.mkdir(runDir, { recursive: true });
    
    // Save run metadata
    const runMeta = {
      runId: runId,
      timestamp: runTimestamp,
      previousRun: lastRun,
      duration: null, // Will be calculated at end
      messagesScanned: allResults.length,
      piAgentRelated: filteredResults.length,
      githubRepos: Object.keys(githubRepos).length,
      channels: Object.keys(state.channelHistory).length
    };
    
    await fs.writeFile(
      path.join(runDir, 'metadata.json'),
      JSON.stringify(runMeta, null, 2)
    );
    
    // Save all messages found (unfiltered)
    if (allResults.length > 0) {
      await fs.writeFile(
        path.join(runDir, 'all-messages.json'),
        JSON.stringify(allResults, null, 2)
      );
    }
    
    // Save filtered pi-agent results
    if (filteredResults.length > 0) {
      await fs.writeFile(
        path.join(runDir, 'pi-agent-messages.json'),
        JSON.stringify(filteredResults, null, 2)
      );
      
      console.log(`💾 Saved to: ${runDir}/\n`);
      
      // Display new GitHub repos
      if (Object.keys(githubRepos).length > 0) {
        console.log(`🆕 GitHub repositories found:\n`);
        Object.entries(githubRepos).forEach(([name, info]) => {
          console.log(`  - ${name}`);
          console.log(`    ${info.url}`);
        });
        console.log();
        
        // Save repos found in this run
        await fs.writeFile(
          path.join(runDir, 'repos.json'),
          JSON.stringify(githubRepos, null, 2)
        );
      }
    }
    
    // Update aggregate results
    const aggregateResults = await loadAggregateResults();
    const aggregateRepos = await loadAggregateRepos();
    
    // Add new results to aggregate
    filteredResults.forEach(result => {
      result.runId = runId;
      result.runTimestamp = runTimestamp;
      aggregateResults.push(result);
    });
    
    // Merge repos into aggregate
    Object.entries(githubRepos).forEach(([name, info]) => {
      if (!aggregateRepos[name]) {
        aggregateRepos[name] = info;
      } else {
        // Add new mentions
        aggregateRepos[name].mentions.push(...info.mentions);
      }
    });
    
    // Save aggregates
    if (filteredResults.length > 0) {
      await saveAggregateResults(aggregateResults);
      await saveAggregateRepos(aggregateRepos);
      
      console.log(`📦 Aggregate data updated:`);
      console.log(`  - Total messages: ${aggregateResults.length}`);
      console.log(`  - Total repos: ${Object.keys(aggregateRepos).length}\n`);
    }
    
    // Update state
    state.lastRun = runTimestamp;
    state.totalFindings += filteredResults.length;
    state.totalRuns += 1;
    await saveState(state);
    
    console.log(`✅ State saved to: ${STATE_FILE}`);
    console.log(`📁 Run directory: ${runDir}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// CLI Commands
const command = process.argv[2];

if (command === 'status') {
  loadState().then(async state => {
    console.log('\n📊 Discord Tracker Status\n');
    console.log(`Last run: ${state.lastRun || 'Never'}`);
    console.log(`Total runs: ${state.totalRuns || 0}`);
    console.log(`Total findings: ${state.totalFindings}\n`);
    
    console.log('Servers:');
    for (const [id, info] of Object.entries(state.servers)) {
      console.log(`  ${info.enabled ? '✅' : '⊘'} ${info.name} (${id})`);
    }
    
    console.log(`\nChannels tracked: ${Object.keys(state.channelHistory).length}`);
    
    const activeChannels = Object.entries(state.channelHistory)
      .filter(([_, info]) => info.totalMatches > 0)
      .sort((a, b) => b[1].totalMatches - a[1].totalMatches)
      .slice(0, 5);
    
    if (activeChannels.length > 0) {
      console.log('\nTop channels by matches:');
      activeChannels.forEach(([key, info]) => {
        console.log(`  ${info.totalMatches}x - #${info.name}`);
      });
    }
    
    // Show aggregate stats
    const aggregateRepos = await loadAggregateRepos();
    const aggregateResults = await loadAggregateResults();
    
    console.log(`\n📦 Aggregate Data:`);
    console.log(`  Total messages collected: ${aggregateResults.length}`);
    console.log(`  Unique repos discovered: ${Object.keys(aggregateRepos).length}`);
    
    console.log(`\n📁 Data Structure:`);
    console.log(`  Data directory: ${DATA_DIR}`);
    console.log(`  State file: ${STATE_FILE}`);
    console.log(`  Runs directory: ${RUNS_DIR}`);
    console.log(`  Aggregate results: ${AGGREGATE_RESULTS_FILE}`);
    console.log(`  Aggregate repos: ${AGGREGATE_REPOS_FILE}`);
  });
} else if (command === 'reset') {
  fs.rm(DATA_DIR, { recursive: true, force: true }).then(() => {
    console.log('✅ All data reset');
  }).catch(() => {
    console.log('No data to reset');
  });
} else if (command === 'add-server') {
  const serverId = process.argv[3];
  const serverName = process.argv[4] || 'Unknown Server';
  
  if (!serverId) {
    console.error('Usage: track.js add-server <server_id> [name]');
    process.exit(1);
  }
  
  loadState().then(state => {
    state.servers[serverId] = {
      name: serverName,
      enabled: true
    };
    return saveState(state);
  }).then(() => {
    console.log(`✅ Added server: ${serverName} (${serverId})`);
  });
} else if (!command || command === 'run') {
  track();
} else {
  console.log(`
Discord Pi-Agent Resource Tracker

Usage:
  track.js [command]

Commands:
  run         Run incremental scan (default)
  status      Show current state and statistics
  reset       Clear all state and start fresh
  add-server  Add a new Discord server to track

Examples:
  # Run scan (only new messages since last run)
  track.js

  # Check status
  track.js status

  # Add server
  track.js add-server 1234567890 "Server Name"

Data Structure:
  ${DATA_DIR}/
  ├── state.json              # State and configuration
  ├── all-results.json        # All messages (aggregate)
  ├── all-repos.json          # All repos with mentions
  └── runs/
      └── TIMESTAMP/
          ├── metadata.json
          ├── all-messages.json
          ├── pi-agent-messages.json
          └── repos.json
`);
}
