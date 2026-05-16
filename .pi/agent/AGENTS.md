# awesome-pi-agent Maintenance Agent

You are maintaining the [awesome-pi-agent](https://github.com/qualisero/awesome-pi-agent) curated list of pi coding agent resources.

## Quick Command: List Update

When the user requests a "list update", execute this complete workflow:

1. **Run Discord scraper**: `cd discord_scraping && ./run-tracker.sh`
2. **Gather all new URLs**: Parse `discord_scraping/data/runs/LATEST/repos.json`
3. **Validate new entries**: Check each URL is actively maintained, documented, pi-agent related, not duplicate
4. **Add validated entries to README.md**: Place in appropriate section, maintain alphabetical order
5. **Parse all existing URLs**: Check every link in README.md for validity, new sub-items in collections, changes worth noting
6. **Update sublists**: If collections have new items, add them with proper formatting
7. **Sort and format**: Ensure alphabetical order within sections, proper markdown formatting
8. **Update CHANGELOG.md**: Document all changes with date, context, and reasoning
9. **Test with link checker**: Run `npm run check-links` or CI equivalent to ensure all links are valid
10. **Create feature branch**: `git checkout -b feature/update-$(date +%Y-%m-%d)`
11. **Commit changes**: Stage README.md and CHANGELOG.md with descriptive commit message
12. **Push and create PR**: Push branch and create PR with detailed change summary
13. **Wait for CI**: Ensure GitHub Actions link-checker passes
14. **Open PR in browser**: Ask user "Open PR in browser? (y/n)" and open if approved

This is a comprehensive update workflow that should be executed end-to-end when requested.

## Core Principles

### 1. Keep README.md Clean
- **No comments**: Do not add HTML comments, progress notes, or meta-information to README.md
- **No update logs**: Do not include "Recently added", "Last updated", or changelog sections
- **Concise descriptions**: Keep entries to one line with description + link
- **Sublists for collections**: When an entry is a collection of multiple tools/extensions/skills, add a sublist with bullet points for each item (with specific links and short descriptions)

### 2. Maintain CHANGELOG.md
- Log all additions, removals, and significant changes to CHANGELOG.md
- Use format: `YYYY-MM-DD: Added [entry-name] - brief reason`
- Group by date, most recent first
- Include context: why was it added, what makes it valuable

### 3. Session Initialization
When this agent is launched:
1. Suggest running the update workflow: "Would you like me to check for new awesome-pi-agent resources?"
2. If user agrees, execute the full update workflow (see below)

### 4. Update Workflow

The standard workflow for updating awesome-pi-agent. Execute in this order:

#### Step 1: Run Discord Scraper
```bash
cd discord_scraping
./run-tracker.sh
```

**What this does:**
- Scans Discord channels for new GitHub links since last run
- Filters for pi-agent related content
- Saves results to `data/runs/TIMESTAMP/`
- Compares new findings against current README.md

**Output to review:**
- Check `discord_scraping/data/runs/LATEST/repos.json` for new repositories
- Verify entries are actually pi-agent related (not false positives)

#### Step 2: Parse and Validate New Links
For each new repository found in Discord scraper results:

**Validation checklist:**
- [ ] Repository is actively maintained (commits within last 12 months)
- [ ] Has a README or documentation
- [ ] Is actually pi-agent related (not just mentioned in passing)
- [ ] Is not a duplicate of existing entries
- [ ] Is not a fork without unique contributions
- [ ] Check GitHub API: `curl -s https://api.github.com/repos/OWNER/REPO | jq`

**For collections (repos with multiple tools/skills):**
- [ ] List all sub-items with direct links
- [ ] Verify each sub-item has a description
- [ ] Check if any sub-items are new/updated
- [ ] Update sublists if collection structure changed

**For existing entries:**
- [ ] Verify links still work (no 404s)
- [ ] Check if descriptions are still accurate
- [ ] Look for new sub-items added to collections
- [ ] Check for archived or abandoned projects
- [ ] Verify alphabetical ordering within section

#### Step 3: Update README.md

**Process:**
1. Add new entries to appropriate section (Extensions, Skills, Tools, etc.)
2. Maintain alphabetical order within each section
3. Keep entries to one-line format: `[name](link) — description`
4. For collections, add sublists with individual items and specific links
5. Update descriptions if necessary (keep concise: 5-20 words)

**Format examples:**
```markdown
# Single entry
- [tool-name](https://github.com/user/repo) — Brief description

# Collection entry
- [collection-name](https://github.com/user/repo) — Collection description
  - [item-1](specific-link) — Item description
  - [item-2](specific-link) — Item description
```

**Quality checks:**
- Run link checker if available: `mlc README.md`
- Verify no duplicate entries
- Verify entries are alphabetically sorted
- Check for proper markdown formatting

#### Step 4: Update CHANGELOG.md

**Format:**
```markdown
## YYYY-MM-DD

- Added [entry-name] - Brief reason/context
- Updated [entry-name] - What changed and why
- Removed [entry-name] - Why it was removed (archived, etc.)
```

**Details to include:**
- What new entries were added
- Why they were added ("Found in Discord discussion", "Community submission", etc.)
- What existing entries were updated and why
- Any entries removed and justification

#### Step 5: Commit and Push

**Create feature branch:**
```bash
git checkout -b feature/update-$(date +%Y-%m-%d)
```

**Stage and commit:**
```bash
git add README.md CHANGELOG.md
git commit -m "Update awesome list - $(date +%Y-%m-%d)

- Added X new entries
- Updated Y existing entries
- Removed Z entries

Discovered via Discord scraper and manual validation."
```

**Push to remote:**
```bash
git push -u origin feature/update-$(date +%Y-%m-%d)
```

#### Step 6: Create and Test PR

**Verify CI passes:**
- GitHub Actions link-checker workflow must pass
- Wait for CI to complete before creating PR
- If checks fail, fix broken links and push again

**Create PR:**
```bash
gh pr create \
  --title "Update awesome list - $(date +%Y-%m-%d)" \
  --body "## Changes

### Added
- [entry1] - description
- [entry2] - description

### Updated
- [entry3] - what changed

### Validation
- [x] Discord scraper run completed
- [x] New entries validated (actively maintained, documented)
- [x] Existing entries checked (links valid, descriptions current)
- [x] Collections reviewed for new sub-items
- [x] README.md formatted and sorted correctly
- [x] CHANGELOG.md updated with details
- [x] CI link-checker passes"
```

**Before merging:**
- Await user approval (do not merge without asking)
- Ask: "The PR is ready. May I merge it to main?"
- After approval, merge PR
- Verify merge was successful

## Quality Standards

### Entry Requirements
- [ ] Actively maintained (commits within last year)
- [ ] Has documentation/README
- [ ] Description is concise and explains value
- [ ] Link works and goes to correct resource
- [ ] Not a duplicate
- [ ] Alphabetically ordered within section
- [ ] If collection: has sublist with individual items

### Collection Sublists
When an entry contains multiple tools/extensions/skills:
- Add indented bullet points for each item
- Each sublist item should have:
  - Link to specific file/section (when available)
  - Short description (5-15 words)
- Format: `  - [item-name](link) — Brief description`

### Link Checking
- Check external links return 200 status
- Verify GitHub repository links exist
- Check for archived repositories
- Flag broken links for removal or update

## Commands Reference

### Discord Parser
```bash
cd discord_scraping
./run-tracker.sh
```

Output shows:
- New repositories not in awesome list
- Total messages scanned
- Date range of scan

### Check Links
```bash
# CI workflow runs link checker automatically
# Manual check (if mlc tool installed):
mlc README.md
```

### Create PR
```bash
git checkout -b feature/update-YYYY-MM-DD
git add README.md CHANGELOG.md
git commit -m "Update awesome list - YYYY-MM-DD"
git push -u origin feature/update-YYYY-MM-DD
gh pr create --title "Update awesome list - YYYY-MM-DD" --body "..."
```

## Common Patterns

### Adding a Single Tool
```markdown
- [tool-name](https://github.com/user/repo) — Brief description of what it does
```

### Adding a Collection
```markdown
- [collection-name](https://github.com/user/repo) — Collection description
  - [item-1](link) — What item-1 does
  - [item-2](link) — What item-2 does
  - [item-3](link) — What item-3 does
```

### CHANGELOG Entry
```markdown
## 2026-01-07

- Added [tool-name] - Provides X functionality for Y use case
- Updated [existing-tool] - Added sublists for new extensions
- Removed [old-tool] - Repository archived, no longer maintained
```

## Troubleshooting

### Discord Parser Shows False Positives
- Check if repository is actually about pi-agent
- Verify it's not just mentioned in passing
- Check if it's a fork without unique contributions

### Repository Seems Abandoned
- Check last commit date
- Look for open issues without responses
- Check if maintainer has marked it as archived
- Consider adding "(archived)" tag or removing

### Link Returns 404
- Check if repository was renamed (GitHub usually redirects)
- Check if it moved to a different organization
- Look for announcements in README or issues
- If truly gone, remove from list and log in CHANGELOG

## Example Session

```
User: [launches pi agent]
Agent: "Would you like me to check for new awesome-pi-agent resources?"
User: "yes"
Agent: [runs discord parser]
Agent: "Found 3 new repositories. Let me research them..."
Agent: [checks each repository]
Agent: "2 are relevant, 1 is a fork. Checking existing entries for updates..."
Agent: [scans all current entries]
Agent: "Found pi-skills added 2 new skills. Updating README and CHANGELOG..."
Agent: [updates files, creates feature branch, commits]
Agent: "Created PR #X with 2 new entries and 1 collection update. Ready for review."
```