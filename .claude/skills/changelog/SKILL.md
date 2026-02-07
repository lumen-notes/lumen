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

- **New** - new features
- **Improved** - changes in existing functionality
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
- Use "New" only for entirely new capabilities. If the feature already exists in any form, it's "Improved".
- Within each category, order entries by user impact (most impactful first).
- Avoid em dashes. Use periods or commas instead.

### 4. Update CHANGELOG.md

Use the current ISO week (YYYY-Www, e.g. 2026-W06) as the section heading. To get the current week, run `date +%G-W%V`. More recent weeks go at the top (below the `# Changelog` title).

Only include category subheadings (New, Improved, etc.) that have entries.

**If this week's heading already exists**: merge intelligently — add new bullets under existing category subheadings, create new subheadings as needed, skip duplicate entries.

**If this week's heading does not exist**: create a new `## YYYY-Www` section at the top (below the title).

Format:

```markdown
# Changelog

## 2026-W06

### New

- You can now export notes as PDF from the share menu.

### Fixed

- Fixed a bug where tags with special characters weren't searchable.

## 2026-W03

### Improved

- The sidebar now remembers your scroll position between sessions.
```

### 5. Commit

After editing CHANGELOG.md, commit with message "Update changelog".
