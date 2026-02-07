# Contributing

Thanks for your interest in contributing to DailyGameBot! Please use conventional commits so that releases can be generated automatically.

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

Use `feat` for new features such as a new game, and `fix` for bugfixes such as adjusting to a site's DOM changing.

### Types that do not trigger a release

| Type     | Use when                                  |
|----------|--------------------------------------------|
| `chore`  | Maintenance, dependencies, tooling         |
| `docs`   | Documentation only                         |
| `style`  | Formatting, whitespace (no code change)   |
| `refactor` | Code change with no feature/fix impact   |
| `test`   | Adding or updating tests                   |
| `ci`     | CI/CD configuration changes                |

### Major versions

As this isn't a library or API, the semver concept of a "breaking change" doesn't really apply. Use a major version change only if you believe the fundamental way the bot operates has changed enough to justify it (e.g. a wide-sweeping refactor or rewrite), or if the way it would appear to the end-user or maintainer has changed enough to justify it.

For a major version, add `BREAKING CHANGE:` in the commit body or append `!` after the type:

```
feat!: remove support for legacy config format

BREAKING CHANGE: The config schema has changed. See migration guide.
```

This triggers a major version bump (1.3.5 → 2.0.0).

## More info

In general, decide between `feat`, `fix`, and `feat!` following the guidelines [amon gives in this Software Engineering Stack Overflow answer](https://softwareengineering.stackexchange.com/a/255201)

See the [Conventional Commits specification](https://www.conventionalcommits.org/) for the full format.
