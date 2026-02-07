# Contributing

Thanks for your interest in contributing! Please use conventional commits so that releases can be generated automatically.

## Commit message format

Use the format:

```
<type>(<scope>): <description>

[optional body]
```

**Example:** `fix: dismiss cookie dialog before taking screenshot`

### Types that trigger a release

| Type   | Effect   | Use when                         |
|--------|----------|----------------------------------|
| `feat` | Minor bump (1.3.5 → 1.4.0) | Adding a new feature            |
| `fix`  | Patch bump (1.3.5 → 1.3.6) | Fixing a bug                    |

### Types that do not trigger a release

| Type     | Use when                                  |
|----------|--------------------------------------------|
| `chore`  | Maintenance, dependencies, tooling         |
| `docs`   | Documentation only                         |
| `style`  | Formatting, whitespace (no code change)   |
| `refactor` | Code change with no feature/fix impact   |
| `test`   | Adding or updating tests                   |
| `ci`     | CI/CD configuration changes                |

### Breaking changes

For breaking changes, add `BREAKING CHANGE:` in the commit body or append `!` after the type:

```
feat!: remove support for legacy config format

BREAKING CHANGE: The config schema has changed. See migration guide.
```

This triggers a major version bump (1.3.5 → 2.0.0).

### Examples

```
feat: add Wordle to daily games
fix: handle timeout when puzzle page loads slowly
fix(screenshot): use correct selector for cookie dialog
docs: update env variable examples
chore: bump puppeteer to v24
```

## More info

See the [Conventional Commits specification](https://www.conventionalcommits.org/) for the full format.
