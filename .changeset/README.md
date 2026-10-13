# Changesets

This directory holds the pending release notes of the publishable packages
(`@audiolab/core`, `@audiolab/react`). Every change that consumers can notice
comes with a changeset:

```bash
npx changeset            # pick the packages and the bump, write a summary
```

The two packages are _linked_: they always release with the same version. The
release procedure itself is documented in
[docs/INTEGRATION.md](../docs/INTEGRATION.md#releases).
