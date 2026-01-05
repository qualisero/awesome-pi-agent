[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

Concise, curated resources for extending and integrating the pi coding agent (pi-mono).

Primary project

- pi (pi-mono) — coding agent, docs, and examples: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs

Categories

Getting Started & Docs

- badlogic/pi-mono — Official coding-agent docs and developer notes. https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs
- packages/coding-agent README — Package README and development notes. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md

Extensions

- Custom tools (pi-mono) — Authoring guide for custom tools and examples. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/custom-tools.md
- Hooks (pi-mono) — Hook API, lifecycle events, and example hooks. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/hooks.md
- Skills (pi-mono) — SKILL.md format, discovery, and examples. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md
- Theme guide (pi-mono) — Theme schema and examples for terminal themes. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md

Examples & Recipes

- Coding agent examples (pi-mono) — Working examples for hooks, custom tools, and SDK usage. https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples
- dotfiles (LarsEckart) — Example agents/pi hooks (bash-history). https://github.com/LarsEckart/dotfiles
- agents (michalvavra) — Community agent configs and pi hooks (filter-output). https://github.com/michalvavra/agents
- shitty-extensions (hjanuschka) — Custom hooks and extensions for pi. https://github.com/hjanuschka/shitty-extensions

Integrations & Providers

- pods/models.json (pi-mono) — Example models list and pod configuration. https://github.com/badlogic/pi-mono/blob/main/packages/pods/src/models.json
- model-registry (pi-mono) — Core model registry implementation. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/model-registry.ts
- web-ui (pi-mono) — Provider dialogs, custom provider store, model discovery. https://github.com/badlogic/pi-mono/tree/main/packages/web-ui
- pi-acp (svkozak) — ACP adapter for pi coding agent (integration example). https://github.com/svkozak/pi-acp

Community & Contributing

- badlogic/pi-skills — Community skills repository. https://github.com/badlogic/pi-skills
- anthropics/skills — Anthropic skills collection (document processing, etc.). https://github.com/anthropics/skills
- mpr (crossjam) — Article mentioning pi coding agent. https://github.com/crossjam/mpr/blob/main/content/pi_coding_agent.md

Submission

- Keep entries concise: one-line description + link
- Alphabetical order within section required

### Submission Checklist
- [ ] Tool is actively maintained (commits within last year)
- [ ] Has documentation/README
- [ ] Description is concise and explains value
- [ ] Link works and goes to correct resource
- [ ] Not a duplicate
- [ ] Alphabetically ordered within section

Contributing

Fork, add a topic branch, update README with a single-line entry and link, and open a PR using the template. See CONTRIBUTING.md for details.

CI

Link-checker workflow: .github/workflows/check-links.yml (runs on push and PRs)

License

MIT — see LICENSE
