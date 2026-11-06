# Releasing

Releases are published to npm by [`.github/workflows/release.yml`](.github/workflows/release.yml)
when a `v*` tag is pushed. There is no npm token in the repository: the
workflow uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers),
and every version gets a provenance attestation.

## One-time setup

1. Publish the first version by hand, so the package exists on npm:
   ```bash
   npm login
   npm publish --access public
   ```
2. On npmjs.com open the package → **Settings** → **Trusted Publisher** →
   **GitHub Actions** and fill in:
   - Organization or user: `dadashi44`
   - Repository: `nuxt-payload-xray`
   - Workflow filename: `release.yml`
3. Optional, recommended: in the same settings set **Publishing access** to
   require two-factor authentication and disallow tokens. After that only the
   workflow can publish.

## Every release

```bash
npm version patch   # or minor / major: bumps package.json, commits, tags
git push --follow-tags
```

The workflow checks that the tag matches `package.json`, runs typecheck, tests
and build, publishes to npm and creates a GitHub release with generated notes.

## Demo GIF

```bash
npm run build
vhs .github/demo.tape   # needs https://github.com/charmbracelet/vhs
```
