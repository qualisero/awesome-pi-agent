[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

A curated list of add-ons, extensions, examples, and resources for the pi coding agent (pi-mono).

Primary project and docs
- pi coding agent: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent

This repository seeds the list with initial, verified links from the official pi-mono project and a few community resources.

Categories

- Getting Started & Docs
- Extensions
- Examples & Recipes
- Integrations & Providers
- Community & Contributing

Getting Started & Docs

- pi coding agent docs — Official docs: usage, CLI reference, SDK, RPC, sessions, compaction, and configuration. https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs
- packages/coding-agent README — High-level package README and development notes. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md

Extensions

- Hooks documentation — Hook API, lifecycle events, and example hooks (permission gate, git checkpoint, status-line). https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/hooks.md
- Custom tools documentation — How to author custom tools, TUI rendering, streaming, and state management. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/custom-tools.md
- Skills documentation — Skill format (SKILL.md), discovery locations, and examples (web search, PDF processing). https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md
- Theme guide — Theme schema, color tokens, and examples for terminal themes. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md

Examples & Recipes

- Coding agent examples — Working examples for hooks, custom tools, SDK usage, and more. https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples

Integrations & Providers

- Web UI (providers) — Provider dialogs, custom provider store, and model discovery utilities. https://github.com/badlogic/pi-mono/tree/main/packages/web-ui
- Model registry & discovery — Core model registry implementation and model discovery utilities. https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/model-registry.ts
- Pods / models list — Example models.json for pods and local models (vLLM/ONNX examples). https://github.com/badlogic/pi-mono/blob/main/packages/pods/src/models.json
- AI package notes — Implementation notes and external integrations. https://github.com/badlogic/pi-mono/blob/main/packages/ai/README.md

Community & Contributing

- pi-skills — Community skill repositories and examples. https://github.com/badlogic/pi-skills
- Anthropic skills — Example skill collections for document processing and more. https://github.com/anthropics/skills

Usage

Add resources as one-line entries with a short description and a link. Keep entries alphabetical within each section.

### Submission Checklist
- [ ] Tool is actively maintained (commits within last year)
- [ ] Has documentation/README
- [ ] Description is concise and explains value
- [ ] Link works and goes to correct resource
- [ ] Not a duplicate
- [ ] Alphabetically ordered within section

Contributing

Please fork, create a topic branch (do not commit to `main`), add your resource, and open a Pull Request. See CONTRIBUTING.md for full guidelines.

CI helper

A link-checker workflow is included under .github/workflows/check-links.yml to validate markdown links on push and PRs.

License

MIT — see LICENSE
