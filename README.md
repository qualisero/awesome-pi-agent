[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

Concise, curated resources for extending and integrating the pi coding agent.

## Primary project

- [pi (pi-mono)](https://github.com/badlogic/pi-mono) — Official coding agent repository

---

## Skills

- [pi-skills](https://github.com/badlogic/pi-skills) — Community skills collection with example SKILL.md files and workflows

---

## Hooks

- [rhubarb-pi](https://github.com/qualisero/rhubarb-pi) — Collection of small hooks and extensions for pi agent
- [shitty-extensions](https://github.com/hjanuschka/shitty-extensions) — Community hooks and extensions
- [michalvavra/agents](https://github.com/michalvavra/agents) — User hooks (memory-mode, plan-mode, filter-output)
- [LarsEckart/dotfiles](https://github.com/LarsEckart/dotfiles) — Dotfiles with pi agent configuration

---

## Custom Tools

- [pi-agent-scip](https://github.com/qualisero/pi-agent-scip) — Adds SCIP code intelligence tools to pi agent

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

- [Docs directory](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs) — Usage, CLI reference, SDK, RPC, sessions, and compaction
- [Package README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) — High-level package README and development notes
- [Hooks reference](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/hooks.md) — Hook API, lifecycle events, and example hooks
- [Custom tools guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/custom-tools.md) — Authoring guide for tools callable by the LLM
- [Theme guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md) — Theme schema, color tokens, and examples
- [Examples directory](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples) — Working examples for hooks, custom tools, and SDK usage
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

## CI

Link-checker workflow: .github/workflows/check-links.yml (runs on push and PRs)

---

## License

MIT — see LICENSE
