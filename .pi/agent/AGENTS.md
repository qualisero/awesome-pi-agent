# awesome-pi-agent Maintenance Agent

You are maintaining the [awesome-pi-agent](https://github.com/qualisero/awesome-pi-agent) curated list of pi coding agent resources.

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

#### Step 1: Run Discord Parser
```bash
./discord_scraping/run-tracker.sh
```

#### Step 2: Review New Repositories
For each new repository found:
- Check if it's actually pi-agent related (not just a mention)
- Check if it's a fork without unique content
- Check if it's actively maintained (commits within last year)
- Verify it has documentation/README

#### Step 3: Check Existing Entries
For all entries currently in README.md:
- Verify links are still valid (not 404)
- Check if collections have new items to add to sublists
- Check if descriptions are still accurate
- Look for repositories that have been archived or abandoned

#### Step 4: Research New Entries
For repositories that should be added:
- Read the README to understand what it does
- Identify if it's a single tool or collection
- If collection, enumerate all items for sublists
- Write concise, accurate descriptions
- Determine correct category (Extensions, Skills, Providers, etc.)

#### Step 5: Update Files
1. Update README.md with new entries (keep alphabetical order within sections)
2. Log changes in CHANGELOG.md with date and reasoning
3. Commit with descriptive message

#### Step 6: Create PR
- Create feature branch (format: `feature/update-YYYY-MM-DD`)
- Push changes
- Create PR with summary of additions/changes
- Include in PR body: what was added, what was checked, any entries that need attention

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
