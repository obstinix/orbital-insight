# Contributing to Orbital Insight

Thank you for contributing to Orbital Insight! To maintain code quality and system architecture integrity, please follow these guidelines when submitting pull requests.

## 🌿 Branch Naming Conventions

All feature and bug fix branches should branch from `main` and follow these prefixes:
- `feat/` for new features (e.g. `feat/cme-particles`)
- `fix/` for bug fixes (e.g. `fix/white-screen`)
- `refactor/` for code restructurings (e.g. `refactor/three-canvas-init`)
- `docs/` for documentation updates (e.g. `docs/contributing-guide`)
- `devops/` for CI/CD or infra configuration (e.g. `devops/sentry-setup`)

## 💬 Commit Message Formats

We use conventional commits to standardize project histories. Formats must match:

`<type>(<scope>): <short description>`

### Types:
- `feat`: A new user-visible feature.
- `fix`: A bug fix.
- `refactor`: Code restructuring without visual/logic changes.
- `docs`: Documentation edits.
- `style`: Formatting, missing semi-colons, etc.
- `test`: Adding missing tests or refactoring tests.
- `chore`: Internal tool/dependency updates.

### Examples:
- `feat(engine): add coronal mass ejection (CME) GPU particles`
- `fix(auth): prevent clerk provider initialization errors in mock mode`
- `docs(readme): add local setup and quickstart guidelines`

## 📁 Pull Request Checklist

Before submitting a pull request, ensure:
1. All files pass linting checks without warnings:
   ```bash
   npm run lint
   ```
2. The TypeScript compiler verifies all workspaces compile cleanly:
   ```bash
   npm run typecheck
   ```
3. A clean production build succeeds locally:
   ```bash
   npm run build
   ```
4. All commits are properly signed or formatted. If committing on behalf of the project core author, ensure authorship metadata is correct:
   ```bash
   git commit --author="obstinix <obstinix@gmail.com>"
   ```

## 🌌 Code Guidelines
- **WebGL & Performance**: Keep all webgl rendering calls capped at max 2.0 pixel ratio. Render components conditionally and use GPU tier checking to throttle options on low-end hardware.
- **Mock Mode**: Ensure all credentialed service integrations are guarded behind `import.meta.env.VITE_USE_MOCK` checks and have fully operational local/mock/offline fallbacks.
