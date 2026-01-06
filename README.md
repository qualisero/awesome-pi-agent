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
- [michalvavra/agents](https://github.com/michalvavra/agents) — User extensions (memory-mode, plan-mode, filter-output)
- [pi-agent-scip](https://github.com/qualisero/pi-agent-scip) — SCIP code intelligence tools for pi agent
- [pi-hooks](https://github.com/prateekmedia/pi-hooks) — Minimal reference extensions: checkpoint, LSP integration, and permission control
- [pi-interview-tool](https://github.com/nicobailon/pi-interview-tool) — Web-based form tool with keyboard navigation, themes, and image attachments
- [pi-ralph](https://github.com/Whamp/pi-ralph) — Ralph Wiggum technique for autonomous iterative AI development loops
- [pi-rewind-hook](https://github.com/nicobailon/pi-rewind-hook) — Rewind file changes with git-based checkpoints and conversation branching
- [rhubarb-pi](https://github.com/qualisero/rhubarb-pi) — Collection of small hooks and extensions for pi agent
- [shitty-extensions](https://github.com/hjanuschka/shitty-extensions) — Community hooks and extensions

---

## Skills

Skills are reusable workflows described in natural language (SKILL.md format) that guide the agent through complex tasks.

- [pi-skills](https://github.com/badlogic/pi-skills) — Community skills collection with example SKILL.md files and workflows

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
