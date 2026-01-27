[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

Concise, curated resources for extending and integrating the [pi coding agent](https://shittycodingagent.ai)
(Yes, it was tempting to call it `shitty-list`).

## Primary project

- [pi (pi-mono)](https://github.com/badlogic/pi-mono) — Official coding agent repository

---

## Extensions

Extensions are TypeScript/JavaScript modules that enhance pi-agent functionality by handling events, registering tools, or adding UI components. Previously called "hooks" or "custom tools".

### Configuration & Dotfiles

- [cloud-research-agent](https://github.com/aadishv/dotfiles/blob/main/.pi/agent/skills/cloud-research-agent/SKILL.md) — AI agent in cloud sandbox for researching GitHub repositories and libraries
- [LarsEckart/dotfiles](https://github.com/LarsEckart/dotfiles) — Dotfiles with pi agent configuration
- [michalvavra/agents](https://github.com/michalvavra/agents) — User extensions and configuration examples
  - [filter-output](https://github.com/michalvavra/agents/blob/main/agents/pi/extensions/filter-output.ts) — Redact sensitive data (API keys, tokens, passwords) from tool results before LLM sees them
  - [security](https://github.com/michalvavra/agents/blob/main/agents/pi/extensions/security.ts) — Block dangerous bash commands and protect sensitive paths from writes
- [mitsuhiko/agent-stuff](https://github.com/mitsuhiko/agent-stuff) — Collection of commands and skills for Claude/pi including handoff/pickup, release management, GitHub/ghidra tools, and tmux/web-browser skills

### Context & File Management

- [pi-dcp](https://github.com/zenobi-us/pi-dcp) — Dynamic context pruning extension for intelligent conversation optimization
- [pi-rlm](https://github.com/Whamp/pi-rlm) — RLM (Recursive Language Model) extension for processing large context files that exceed LLM context windows
- [checkpoint](https://github.com/prateekmedia/pi-hooks/tree/main/checkpoint) — Git-based checkpoint system for restoring code state when branching conversations
- [pi-rewind-hook](https://github.com/nicobailon/pi-rewind-hook) — Rewind file changes with git-based checkpoints and conversation branching
- [handoff](https://github.com/hjanuschka/shitty-extensions#handoffts) — Transfer context to new focused sessions

### Security & Filtering

- [permission](https://github.com/prateekmedia/pi-hooks/tree/main/permission) — Layered permission control with four levels (off, low, medium, high) (prateekmedia/pi-hooks)
- [checkpoint](https://github.com/prateekmedia/pi-hooks/tree/main/checkpoint) — Git-based checkpoint system for restoring code state when branching conversations (prateekmedia/pi-hooks)
- [lsp](https://github.com/prateekmedia/pi-hooks/tree/main/lsp) — Language Server Protocol integration with auto-diagnostics and on-demand queries (prateekmedia/pi-hooks)
- [safe-git](https://github.com/qualisero/rhubarb-pi/blob/main/docs/safe-git.md) — Require approval before dangerous git operations

### Cost & Usage Tracking

- [pi-cost-dashboard](https://github.com/mrexodia/pi-cost-dashboard) — Interactive web dashboard to monitor and analyze API costs
- [cost-tracker](https://github.com/hjanuschka/shitty-extensions#cost-trackerts) — Session spending analysis from pi logs
- [usage-extension](https://github.com/tmustier/pi-extensions/tree/main/usage-extension) — Usage statistics dashboard across sessions
- [usage-bar](https://github.com/hjanuschka/shitty-extensions#usage-barts) — AI provider usage statistics with status polling
- [toolwatch](https://github.com/kcosr/pi-extensions/tree/main/toolwatch) — Tool call auditing and approval system with SQLite logging

### Footer & UI Enhancements

- [pi-sub](https://github.com/marckrenn/pi-sub) — Usage tracking monorepo with sub-bar UI widget and shared core for provider selection and cache management
- [pi-powerline-footer](https://github.com/nicobailon/pi-powerline-footer) — Powerline-style status bar with git integration, context awareness, and token intelligence
- [pi-canvas](https://github.com/jyaunches/pi-canvas) — Interactive TUI canvases (calendar, document, flights) rendered inline using native pi TUI
- [tab-status](https://github.com/tmustier/pi-extensions/tree/main/tab-status) — Tab status indicators and management
- [status-widget](https://github.com/hjanuschka/shitty-extensions#status-widgetts) — Persistent provider status indicator in footer
- [session-color](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-color.md) — Colored band in footer to visually distinguish sessions
- [session-emoji](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-emoji.md) — AI-powered emoji in footer representing conversation context
- [ultrathink](https://github.com/hjanuschka/shitty-extensions#ultrathinkts) — Rainbow animated effect with Knight Rider shimmer

### Notifications

- [pi-notification-extension](https://github.com/lsj5031/pi-notification-extension) — Telegram/bell alerts when agent finishes and waits for input
- [pi-notify](https://github.com/ferologics/pi-notify) — Native desktop notifications via OSC 777 escape sequence
- [background-notify](https://github.com/qualisero/rhubarb-pi/blob/main/docs/background-notify.md) — Notifications when tasks complete (audio beep, terminal focus)
- [safe-git](https://github.com/qualisero/rhubarb-pi/blob/main/docs/safe-git.md) — Require approval before dangerous git operations (qualisero/rhubarb-pi)
- [session-emoji](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-emoji.md) — AI-powered emoji in footer representing conversation context (qualisero/rhubarb-pi)
- [session-color](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-color.md) — Colored band in footer to visually distinguish sessions (qualisero/rhubarb-pi)
- [cost-tracker](https://github.com/hjanuschka/shitty-extensions#cost-trackerts) — Session spending analysis from pi logs (hjanuschka/shitty-extensions)
- [handoff](https://github.com/hjanuschka/shitty-extensions#handoffts) — Transfer context to new focused sessions (hjanuschka/shitty-extensions)
- [memory-mode](https://github.com/hjanuschka/shitty-extensions#memory-modets) — Save instructions to AGENTS.md with AI-assisted integration (hjanuschka/shitty-extensions)
- [oracle](https://github.com/hjanuschka/shitty-extensions#oraclests) — Get second opinion from alternative AI models without switching contexts (hjanuschka/shitty-extensions)
- [plan-mode](https://github.com/hjanuschka/shitty-extensions#plan-modets) — Read-only exploration mode for safe code exploration (hjanuschka/shitty-extensions)
- [status-widget](https://github.com/hjanuschka/shitty-extensions#status-widgetts) — Persistent provider status indicator in footer (hjanuschka/shitty-extensions)
- [ultrathink](https://github.com/hjanuschka/shitty-extensions#ultrathinkts) — Rainbow animated effect with Knight Rider shimmer (hjanuschka/shitty-extensions)
- [usage-bar](https://github.com/hjanuschka/shitty-extensions#usage-barts) — AI provider usage statistics with status polling (hjanuschka/shitty-extensions)

### Development Tools

- [pi-agent-scip](https://github.com/qualisero/pi-agent-scip) — SCIP code intelligence tools for pi agent
- [lsp](https://github.com/prateekmedia/pi-hooks/tree/main/lsp) — Language Server Protocol integration with auto-diagnostics and on-demand queries
- [debug](https://github.com/aliou/pi-extensions/tree/main/extensions/debug) — Session path clipboard utility and debugging tools (aliou/pi-extensions)
- [meta](https://github.com/aliou/pi-extensions/tree/main/extensions/meta) — Meta operations for pi agent (aliou/pi-extensions)
- [processes](https://github.com/aliou/pi-extensions/tree/main/extensions/processes) — Process management utilities (aliou/pi-extensions)
- [toolwatch](https://github.com/kcosr/pi-extensions/tree/main/toolwatch) — Tool call auditing and approval system with SQLite logging (kcosr/pi-extensions)

### Games & Experiments

- [arcade](https://github.com/tmustier/pi-extensions/tree/main/arcade) — Arcade-style interactions and games (tmustier/pi-extensions)
- [ralph-wiggum](https://github.com/tmustier/pi-extensions/tree/main/ralph-wiggum) — Long-running agent loops for iterative development (tmustier/pi-extensions)
- [agent-guidance](https://github.com/tmustier/pi-extensions/tree/main/agent-guidance) — Agent behavior guidance and instructions (tmustier/pi-extensions)
- [tab-status](https://github.com/tmustier/pi-extensions/tree/main/tab-status) — Tab status indicators and management (tmustier/pi-extensions)
- [usage-extension](https://github.com/tmustier/pi-extensions/tree/main/usage-extension) — Usage statistics dashboard across sessions (tmustier/pi-extensions)

### Agent Behavior & Long-running Tasks

- [ralph-wiggum](https://github.com/tmustier/pi-extensions/tree/main/ralph-wiggum) — Long-running agent loops for iterative development
- [agent-guidance](https://github.com/tmustier/pi-extensions/tree/main/agent-guidance) — Agent behavior guidance and instructions
- [memory-mode](https://github.com/hjanuschka/shitty-extensions#memory-modets) — Save instructions to AGENTS.md with AI-assisted integration
- [oracle](https://github.com/hjanuschka/shitty-extensions#oraclests) — Get second opinion from alternative AI models without switching contexts

### Themes

- [pi-rose-pine](https://github.com/zenobi-us/pi-rose-pine) — Rose Pine theme for pi TUI

### Games & Experiments

- [arcade](https://github.com/tmustier/pi-extensions/tree/main/arcade) — Arcade-style interactions and games

### Remote & Networking

- [pi-ssh-remote](https://github.com/cv/pi-ssh-remote) — Extension that redirects all file operations and commands to a remote host via SSH

### Utilities & Misc

- [pi-interview-tool](https://github.com/nicobailon/pi-interview-tool) — Web-based form tool with keyboard navigation, themes, and image attachments
- [plan-mode](https://github.com/hjanuschka/shitty-extensions#plan-modets) — Read-only exploration mode for safe code exploration
- [pi-stuffed](https://github.com/raunovillberg/pi-stuffed) — Extension collection with Reddit post fetching: /reddit subreddit [hot, new, top, rising]

---

## Skills

Skills are reusable workflows described in natural language (SKILL.md format) that guide the agent through complex tasks.

- [pi-skills](https://github.com/badlogic/pi-skills) — Community skills collection
  - [brave-search](https://github.com/badlogic/pi-skills/tree/main/brave-search) — Web search and content extraction via Brave Search API
  - [browser-tools](https://github.com/badlogic/pi-skills/tree/main/browser-tools) — Interactive browser automation via Chrome DevTools Protocol
  - [gccli](https://github.com/badlogic/pi-skills/tree/main/gccli) — Google Calendar CLI for events and availability
  - [gdcli](https://github.com/badlogic/pi-skills/tree/main/gdcli) — Google Drive CLI for file management and sharing
  - [gmcli](https://github.com/badlogic/pi-skills/tree/main/gmcli) — Gmail CLI for email, drafts, and labels
  - [transcribe](https://github.com/badlogic/pi-skills/tree/main/transcribe) — Speech-to-text transcription via Groq Whisper API
  - [vscode](https://github.com/badlogic/pi-skills/tree/main/vscode) — VS Code integration for diffs and file comparison
  - [youtube-transcript](https://github.com/badlogic/pi-skills/tree/main/youtube-transcript) — Fetch YouTube video transcripts

---

## Tools & Utilities

- [claude-code-ui](https://github.com/KyleAMathews/claude-code-ui) — Real-time dashboard for monitoring Claude Code sessions with AI-powered summaries, PR tracking, and multi-repo support
- [codemap](https://github.com/kcosr/codemap) — Compact, token-aware codebase maps for LLMs and coding agents (TypeScript/JavaScript symbol extraction, markdown structure)
- [gob](https://github.com/juanibiapina/gob) — Process manager for AI agents with background job support and TUI interface
- [PiSwarm](https://github.com/lsj5031/PiSwarm) — Parallel GitHub issue and PR processing using the `pi` agent and Git worktrees
- [pi-ds](https://github.com/zenobi-us/pi-ds) — TUI design system components for pi-mono extensions with TypeScript support

---

## Prompt Templates

Prompt templates (formerly "slash commands") let you create reusable prompt shortcuts with parameters.

*No community prompt templates yet — contributions welcome!*

---

## Themes

*No community themes yet — contributions welcome!*

---

## Providers & Integrations

- [pi-acp](https://github.com/svkozak/pi-acp) — ACP adapter for pi agent
- [pi-config](https://github.com/vtemian/pi-config) — Project config example

---

## Examples & Recipes

- [crossjam/mpr](https://github.com/crossjam/mpr/blob/main/content/pi_coding_agent.md) — Context and writeups referencing the agent
- [eddoapp](https://github.com/walterra/eddoapp) — GTD-inspired todo and time tracking app with pi-coding-agent skills and extensions for AI-assisted workflows

---

## Related Projects

- [anthropics/claude-code](https://github.com/anthropics/claude-code) — Official Anthropic agentic coding tool that lives in your terminal with natural language commands and git workflow support
- [claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — Official Anthropic directory of Claude Code plugins with MCP servers, skills, and commands
- [synthetic-lab/octofriend](https://github.com/synthetic-lab/octofriend) — Open-source coding assistant agent with friendly interactions and codebase understanding

---

## Official Documentation

Deep links into the official pi-mono repository:

- [Extensions guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — **Unified extensions API** (hooks, tools, events, UI)
- [Package README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) — High-level package README and quick start
- [Docs directory](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs) — Full documentation (CLI, SDK, RPC, sessions, compaction, themes)
- [Examples directory](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples) — Working examples for extensions, SDK usage, and more
- [Theme guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md) — Theme schema, color tokens, and examples
- [Migration guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/CHANGELOG.md#extensions-migration) — Upgrading from hooks/tools to extensions
- [Web UI utilities](https://github.com/badlogic/pi-mono/tree/main/packages/web-ui) — Provider dialogs and model discovery utilities
- [Model registry](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/model-registry.ts) — Core model/provider registry implementation
- [Pods models.json](https://github.com/badlogic/pi-mono/blob/main/packages/pods/src/models.json) — Example models.json for pods and local runners

---

## Submission Checklist

When adding a new resource, ensure the following:
- [ ] Tool is actively maintained (commits within last year)
- [ ] Has documentation / README
- [ ] Description is concise and explains value
- [ ] Link works and goes to correct resource
- [ ] Not a duplicate
- [ ] Alphabetically ordered within section

Please add only one-line entries (short description + link). Maintainers may re-order or trim entries during review.

---

## Contributing

Fork, create a topic branch, add your entry to the appropriate section in this README (one-line entry, alphabetical), and open a Pull Request using the PR template.

### Discord Scraping Tools

This repository includes automated tools for discovering new pi-agent resources shared in Discord servers. See [discord_scraping/](discord_scraping/) for:

- **Puppeteer-based scraper** with forum post support
- Incremental message tracker with state persistence
- GitHub link extraction from channels and forums
- Automatic filtering for pi-agent content
- Integration with awesome list checking

Run `./discord_scraping/run.sh` to find new resources to add to this list.

## CI

Link-checker workflow: .github/workflows/check-links.yml (runs on push and PRs)

---

## License

MIT — see LICENSE
