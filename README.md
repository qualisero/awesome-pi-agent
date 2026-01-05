[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

# awesome-pi-agent

A curated list of add-ons, extensions, examples, and resources for the pi coding agent (pi-mono).

Primary project and docs
- pi coding agent: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent

Short description

This repository collects community-built and official resources for extending and integrating pi: hooks, custom tools, skills, themes, models/providers, examples, and integration recipes.

Categories

- Getting Started & Docs
- Extensions (hooks, custom tools, skills, themes)
- Examples & Recipes
- Integrations & Providers (models, SDK, RPC, OAuth notes)
- Community & Contributing

Usage

Add useful resources under the most relevant category. Keep entries short: one-line description + link. Alphabetical order within each section is required.

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

A link-checker workflow to add under .github/workflows:

# .github/workflows/check-links.yml
name: Check Links
on: [push, pull_request]
jobs:
  linkChecker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: gaurav-nelson/github-action-markdown-link-check@v1

License

MIT — see LICENSE
