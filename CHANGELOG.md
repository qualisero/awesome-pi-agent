# Changelog

All notable additions, removals, and changes to the awesome-pi-agent list.

## 2026-01-13

### Added
- **pi-extensions** (kcosr/pi-extensions) - Collection of extensions for pi coding agent
  - toolwatch extension: Tool call auditing and approval system with SQLite logging for tracking and blocking dangerous commands
- **claude-code-ui** (KyleAMathews/claude-code-ui) - Real-time dashboard for monitoring Claude Code sessions across projects with AI summaries, kanban board, PR/CI tracking
- **gob** (juanibiapina/gob) - Process manager for AI agents and humans with background job support, TUI interface, and claude-code integration
- **pi-ds** (zenobi-us/pi-ds) - TUI design system component library for pi-mono extensions with TypeScript support, Bun/npm tooling
- **claude-plugins-official** (anthropics/claude-plugins-official) - Official Anthropic directory of high-quality Claude Code plugins with MCP servers, skills, commands, and agents

### Validated
- Discord scraper scan completed - 19 repositories found, 5 validated as relevant
- Filtered out: GitHub apps, gist hashes, pi-mono forks without unique contributions, unrelated projects
- All existing README links verified (50+ URLs checked, all returning HTTP 200)
- All repositories actively maintained with commits in last 12 months
- All collection sublists (pi-skills, shitty-extensions, rhubarb-pi, etc.) remain current

### Infrastructure
- Discord scraper found new entries from forums and active threads
- Comprehensive validation workflow executed end-to-end

---

## 2026-01-09 (Previous Update)

### Added
- **pi-canvas** (jyaunches/pi-canvas) - Interactive TUI canvases (calendar, document, flights) rendered inline using native pi TUI
- **pi-extensions** (aliou/pi-extensions) - Collection of debugging and utility extensions for pi agent
  - debug extension: Session path clipboard utility
  - meta extension: Meta operations
  - processes extension: Process management utilities
- **pi-cost-dashboard** (mrexodia/pi-cost-dashboard) - Interactive web dashboard to monitor and analyze API costs
- **pi-extensions** (tmustier/pi-extensions) - Collection of delightful extensions
  - agent-guidance: Agent behavior guidance
  - arcade: Arcade-style interactions
  - tab-status: Tab status indicators
- **pi-ssh-remote** (cv/pi-ssh-remote) - Redirects file operations and commands to remote host via SSH
- **claude-code-ui** (KyleAMathews/claude-code-ui) - Session tracker UI with real-time updates

### Removed
- **pi-ralph** (Whamp/pi-ralph) - Repository no longer exists (404 error)

### Infrastructure
- **Discord scraper upgraded** from CDP to Puppeteer
- Now successfully scrapes Discord forum posts (previously impossible)
- Discovered 8 new repositories from forums that were previously inaccessible
- 3-4x more repositories found overall

### Validated
- Discord scraper scan completed - 4 repositories found, all false positives (GitHub infrastructure repos, forks, self-reference)
- All remaining entries verified:
  - 30+ GitHub links checked and working (HTTP 200)
  - All repositories active with recent commits (within last 3 months)
  - No additional archived or abandoned projects detected
- Verified all collection sublists are current and accurate
- Link checker configuration validated (mlc_config.json)

### Notes
- Removed "Recent Change (v0.35.0)" notice from README as per maintenance cleanup
- Updated local AGENTS.md with comprehensive "list update" workflow instructions
- Added .pi/agent/AGENTS.md to .gitignore for local configuration

---

## 2026-01-07 (Previous Update)

### Added
- **oracle** extension to **shitty-extensions** collection - Get second opinions from alternative AI models without switching contexts

### Validated
- All 10+ major community projects remain active and recently updated
- All GitHub links verified working (HTTP 200)
- No archived or abandoned projects detected

---

## 2026-01-07 (Previous Session)

### Added
- Expanded **michalvavra/agents** with sublists:
  - filter-output extension for redacting sensitive data from tool results
  - security extension for blocking dangerous bash commands
  
- Expanded **pi-hooks** with sublists:
  - checkpoint extension for git-based checkpoint system
  - lsp extension for Language Server Protocol integration
  - permission extension for layered permission control
  
- Expanded **rhubarb-pi** with sublists:
  - background-notify extension for task completion notifications
  - session-emoji extension for AI-powered emoji in footer
  - session-color extension for colored session bands
  - safe-git extension for git operation approval
  
- Expanded **shitty-extensions** with sublists:
  - memory-mode for saving instructions to AGENTS.md
  - plan-mode for read-only exploration
  - handoff for context transfer
  - usage-bar for AI provider statistics
  - ultrathink for rainbow animated effects
  - status-widget for provider status in footer
  - cost-tracker for session spending analysis
  
- Expanded **pi-skills** with sublists:
  - brave-search skill
  - browser-tools skill
  - gccli (Google Calendar) skill
  - gdcli (Google Drive) skill
  - gmcli (Gmail) skill
  - transcribe skill
  - vscode skill
  - youtube-transcript skill

### Changed
- Collection entries now include detailed sublists with direct links to specific files/sections
- Each sublist item includes concise descriptions of functionality

### Notes
- Discord parser scan found 3 repositories, but all were false positives (GitHub app, fork without unique content, self-reference)
