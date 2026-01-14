# AGENTS.md — awesome-pi-agent automation protocol

This repository is an **awesome list** plus a **Discord scraping workflow**. The goal of this document is to make future updates a *one-line* request (e.g. “scrape + update list + PR + merge”).

## Non‑negotiable rules

- **Never commit to `main`.** Always work on a feature branch.
- **Always open a Pull Request** and request review.
- **Never merge a PR without explicit human approval** in the chat (reply must clearly say yes/merge/approve).
- Prefer small, auditable diffs. Do not add speculative entries.

## One-line update workflow (end-to-end)

When asked to “scrape, update, push PR, merge PR”, follow this exact sequence:

### 0) Create a working branch

- Ensure clean working tree.
- Create branch: `chore/update-awesome-<YYYYMMDD>`.

### 1) Scrape Discord for new GitHub repos

From repo root:

```bash
cd discord_scraping
npm install
./run.sh --headless
```

Notes:
- The scraper stores state in `discord_scraping/data/` (gitignored).
- `run.sh` automatically compares discovered repos vs `../README.md` and prints repos **not yet listed**.

Optional controls:

```bash
# Full rescan
node scraper.js --reset
./run.sh --headless

# Help
node scraper.js --help
```

### 2) Triage findings (only add real, relevant resources)

For each “new repository not in awesome list” printed by `run.sh`:

- Verify link works and points to the intended project.
- Confirm the repo is **actively maintained** (commits within ~1 year).
- Confirm it has documentation (README/docs).
- Confirm it is **not a duplicate** of an existing entry.
- Decide the correct section (Extensions / Skills / Tools & Utilities / etc.).
- Write a **single-line entry**: `- [name](url) — short value-focused description`
- Keep entries **alphabetically sorted within the section**.

### 3) Update README

- Edit `README.md` to add validated entries.
- Keep the list concise; do not reformat unrelated sections.

### 4) Quality checks

- Run any repo checks available locally.
- At minimum: ensure markdown renders and links look correct.

If GitHub Actions exists (link-checker), do **not** trigger anything special; opening a PR is sufficient.

### 5) Commit + push

- Commit with message: `chore: update awesome list from discord scrape`.
- Push the branch to origin.

### 6) Open a Pull Request

- Create PR describing:
  - date/time of scrape
  - number of repos found
  - which ones were added and where
  - any repos skipped (and why)

### 7) Merge protocol (requires explicit approval)

- Wait for the user to explicitly approve merging.
- Only after approval:
  - merge the PR
  - delete the branch (optional)

## Discord scraper documentation (source of truth)

- `discord_scraping/README.md` — how to run, configure servers/forums, reset state, troubleshoot.
- `discord_scraping/run.sh` — runs scraper + compares `data/all-repos.json` against `README.md`.

## Safety / scope

- Only modify files **inside this repository**.
- Do not modify global config, dotfiles, or `~/.pi/*`.
