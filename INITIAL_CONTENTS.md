Initial curated entries gathered from badlogic/pi-mono (quick start — sources and examples)

Below are starter resources to populate the awesome list. Links point to files and directories inside the official pi-mono repository.

1. pi coding agent docs (core): https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs
   - Primary documentation: usage, hooks, skills, custom tools, themes, SDK, RPC, examples.

2. Examples (coding agent): https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples
   - Working examples for hooks, custom tools, SDK usage, and more.

3. Hooks documentation & examples: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/hooks.md
   - Shows hook API, lifecycle events, and example hooks (permission gate, git checkpoint, snake, status-line).

4. Custom tools documentation & examples: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/custom-tools.md
   - How to author tools, TUI rendering, streaming, and state management. See examples/custom-tools.

5. Skills documentation: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md
   - Skill format (SKILL.md), discovery locations, and examples (brave-search, PDF processing).

6. Theme authoring guide: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md
   - Schema, tokens, and examples for creating terminal themes.

7. Web UI and provider model discovery: https://github.com/badlogic/pi-mono/tree/main/packages/web-ui
   - Includes provider configuration, model discovery, and custom provider dialogs (useful for providers and models entries).

8. Provider / model registry code (references for providers and custom models):
   - model-registry.ts: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/model-registry.ts
   - model-discovery.ts: https://github.com/badlogic/pi-mono/blob/main/packages/web-ui/src/utils/model-discovery.ts

9. Pods / models list (examples for local/onnx/vLLM models): https://github.com/badlogic/pi-mono/blob/main/packages/pods/src/models.json

10. AI package README (implementation notes & external integrations): https://github.com/badlogic/pi-mono/blob/main/packages/ai/README.md

Notes
- These links were discovered by searching the pi-mono repository for docs, examples, and provider-related files. They make good seed entries for the awesome list under the categories: Getting Started & Docs; Extensions; Examples & Recipes; Integrations & Providers; Community & Contributing.

Next steps
- I can convert these into formatted README sections (one-line descriptions + links) and add a few community resources (pi-skills, Anthropic skills, etc.).
- Or I can add each as items in the README under the reduced categories. Which do you prefer?