---
name: changelog
description: Update CHANGELOG.md with user-facing changes from the current branch. Use when creating a pull request or when pushing changes to a branch that already has an open pull request. Analyzes the branch diff against main, identifies user-facing changes, and adds dated entries to CHANGELOG.md.
---

# Changelog

Update CHANGELOG.md with user-facing changes from the current branch.

## Workflow

### 1. Get the diff

Get the full diff of the current branch against main:

```bash
git diff main...HEAD
```

### 2. Identify user-facing changes

Analyze the diff and identify changes that affect the user. Ignore internal refactors, code style changes, and developer-only changes (test infrastructure, CI config, etc.) unless they have user-facing impact.

Categorize each change:

- **Added** - new features
- **Changed** - changes in existing functionality
- **Deprecated** - soon-to-be removed features
- **Removed** - removed features
- **Fixed** - bug fixes
- **Security** - vulnerability fixes

If there are no user-facing changes, inform the user and stop.

### 3. Write entries

Each entry should:

- Be written for humans. Describe what the user can now do or what changed from their perspective.
- Focus on outcomes and impact, not implementation details. Skip sub-features and internal specifics (e.g. don't mention specific icons added, individual links moved, or UI patterns used).
- Use plain language, not technical jargon.
- One bullet per feature. A bullet can have multiple sentences if needed, but don't split a single feature into multiple bullets.
- Use "Changed" (not "Added") when replacing or converting existing functionality into a new form (e.g. converting a dialog into a panel).
- Avoid em dashes. Use periods or commas instead.

### 4. Update CHANGELOG.md

Use today's date (YYYY-MM-DD) as the section heading. More recent dates go at the top (below the `# Changelog` title).

Only include category subheadings (Added, Changed, etc.) that have entries.

**If today's date heading already exists**: merge intelligently — add new bullets under existing category subheadings, create new subheadings as needed, skip duplicate entries.

**If today's date heading does not exist**: create a new `## YYYY-MM-DD` section at the top (below the title).

Format:

```markdown
# Changelog

## 2026-02-06

### Added

- You can now export notes as PDF from the share menu.

### Fixed

- Fixed a bug where tags with special characters weren't searchable.

## 2026-01-15

### Changed

- The sidebar now remembers your scroll position between sessions.
```

### 5. Commit

After editing CHANGELOG.md, commit with message "Update changelog".
