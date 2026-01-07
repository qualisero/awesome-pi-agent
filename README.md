[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

Concise, curated resources for extending and integrating the [pi coding agent](https://shittycodingagent.ai)
(Yes, it was tempting to call it `shitty-list`).

> **📢 Recent Change (v0.35.0):** Hooks and custom tools are now unified as **extensions**. See the [migration guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/CHANGELOG.md#extensions-migration) if you're upgrading from older versions.

## Primary project

- [pi (pi-mono)](https://github.com/badlogic/pi-mono) — Official coding agent repository

---

## Extensions

Extensions are TypeScript/JavaScript modules that enhance pi-agent functionality by handling events, registering tools, or adding UI components. Previously called "hooks" or "custom tools".

- [cloud-research-agent](https://github.com/aadishv/dotfiles/blob/main/.pi/agent/skills/cloud-research-agent/SKILL.md) — AI agent in cloud sandbox for researching GitHub repositories and libraries
- [LarsEckart/dotfiles](https://github.com/LarsEckart/dotfiles) — Dotfiles with pi agent configuration
- [michalvavra/agents](https://github.com/michalvavra/agents) — User extensions and configuration examples
  - [filter-output](https://github.com/michalvavra/agents/blob/main/agents/pi/extensions/filter-output.ts) — Redact sensitive data (API keys, tokens, passwords) from tool results before LLM sees them
  - [security](https://github.com/michalvavra/agents/blob/main/agents/pi/extensions/security.ts) — Block dangerous bash commands and protect sensitive paths from writes
- [pi-agent-scip](https://github.com/qualisero/pi-agent-scip) — SCIP code intelligence tools for pi agent
- [pi-hooks](https://github.com/prateekmedia/pi-hooks) — Minimal reference extensions
  - [checkpoint](https://github.com/prateekmedia/pi-hooks/tree/main/checkpoint) — Git-based checkpoint system for restoring code state when branching conversations
  - [lsp](https://github.com/prateekmedia/pi-hooks/tree/main/lsp) — Language Server Protocol integration with auto-diagnostics and on-demand queries
  - [permission](https://github.com/prateekmedia/pi-hooks/tree/main/permission) — Layered permission control with four levels (off, low, medium, high)
- [pi-interview-tool](https://github.com/nicobailon/pi-interview-tool) — Web-based form tool with keyboard navigation, themes, and image attachments
- [pi-ralph](https://github.com/Whamp/pi-ralph) — Ralph Wiggum technique for autonomous iterative AI development loops
- [pi-rewind-hook](https://github.com/nicobailon/pi-rewind-hook) — Rewind file changes with git-based checkpoints and conversation branching
- [rhubarb-pi](https://github.com/qualisero/rhubarb-pi) — Collection of small extensions for pi agent
  - [background-notify](https://github.com/qualisero/rhubarb-pi/blob/main/docs/background-notify.md) — Notifications when tasks complete (audio beep, terminal focus)
  - [session-emoji](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-emoji.md) — AI-powered emoji in footer representing conversation context
  - [session-color](https://github.com/qualisero/rhubarb-pi/blob/main/docs/session-color.md) — Colored band in footer to visually distinguish sessions
  - [safe-git](https://github.com/qualisero/rhubarb-pi/blob/main/docs/safe-git.md) — Require approval before dangerous git operations
- [shitty-extensions](https://github.com/hjanuschka/shitty-extensions) — Community extensions collection
  - [memory-mode](https://github.com/hjanuschka/shitty-extensions#memory-modets) — Save instructions to AGENTS.md with AI-assisted integration
  - [plan-mode](https://github.com/hjanuschka/shitty-extensions#plan-modets) — Read-only exploration mode for safe code exploration
  - [handoff](https://github.com/hjanuschka/shitty-extensions#handoffts) — Transfer context to new focused sessions
  - [usage-bar](https://github.com/hjanuschka/shitty-extensions#usage-barts) — AI provider usage statistics with status polling
  - [ultrathink](https://github.com/hjanuschka/shitty-extensions#ultrathinkts) — Rainbow animated effect with Knight Rider shimmer
  - [status-widget](https://github.com/hjanuschka/shitty-extensions#status-widgetts) — Persistent provider status indicator in footer
  - [cost-tracker](https://github.com/hjanuschka/shitty-extensions#cost-trackerts) — Session spending analysis from pi logs

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

- Incremental message tracker with state persistence
- GitHub link extraction
- Automatic filtering for pi-agent content
- Integration with awesome list checking

Run `./discord_scraping/run-tracker.sh` to find new resources to add to this list.

## CI

Link-checker workflow: .github/workflows/check-links.yml (runs on push and PRs)

---

## License

MIT — see LICENSE
