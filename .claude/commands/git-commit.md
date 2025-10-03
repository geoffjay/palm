---
description: Git conventions and workflow guidelines using Conventional Commits
---

# Git Conventions and Workflow Guidelines 🔄

## Language Requirements

All git-related text MUST be written in English:

- Commit messages
- Branch names
- Pull request titles and descriptions
- Code review comments
- Issue titles and descriptions

## Commit Message Format

All commit messages MUST follow the [Conventional Commits](mdc:https:/www.conventionalcommits.org) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts

### Scope

The scope should be the name of the component affected (as perceived by the person reading the changelog).

Examples:

- `feat(auth): add login with Google`
- `fix(api): handle null response from server`
- `docs(readme): update installation steps`

### Description

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No dot (.) at the end
- Write in english

## Branch Naming Convention

Branches should follow this pattern:

```
<type>/<short-description>
```

For features and fixes that are tracked in a project management system, include the ticket number:

```
<type>/<ticket-number>-<short-description>
```

Examples:

- `feat/add-google-auth`
- `fix/handle-null-responses`
- `docs/update-readme`
- `feat/PROJ-123-add-google-auth`
- `fix/PROJ-456-handle-null-responses`

## Workflow Guidelines

1. **Protected Branches**

   - `main` (or `master`): Production-ready code, protected branch
   - Direct commits to protected branches are NOT allowed
   - All changes must come through Pull Requests

2. **Feature Development**

   ```bash
   # First, check if you're on a protected branch
   git branch --show-current

   # If on main/master, create and checkout a new feature branch
   git checkout -b feat/my-new-feature main

   # Make changes and commit
   git add .
   git commit -m "feat(scope): add new feature"

   # Keep branch updated with main
   git fetch origin main
   git rebase origin/main

   # Push changes
   git push origin feat/my-new-feature
   ```

3. **Pull Request Process**

   - Create PR from feature branch to main/master
   - Use PR template if available
   - Request at least 2 code reviews
   - All tests must pass
   - No merge conflicts
   - Squash commits when merging

4. **Release Process**

   ```bash
   # Create release branch from main
   git checkout main
   git pull origin main
   git checkout -b release/v1.0.0

   # After testing, merge back to main via PR
   # After PR is approved and merged:
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "version 1.0.0"
   git push origin main --tags
   ```

## Examples

✅ Good Commits:

```bash
feat(auth): implement JWT authentication
fix(api): handle edge case in user validation
docs(api): update API documentation
style(components): format according to style guide
refactor(database): optimize query performance
test(auth): add unit tests for login flow
```

❌ Bad Commits:

```bash
Fixed stuff
Updated code
WIP
Quick fix
```

## Pre-commit Hooks

Consider using pre-commit hooks to enforce these conventions:

- Commit message format validation
- Code linting
- Test execution
- Branch naming validation
- Protected branch validation
