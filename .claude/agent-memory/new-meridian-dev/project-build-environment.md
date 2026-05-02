---
name: Build Environment Quirks
description: Known platform issues and workarounds for running Next.js builds on this Windows machine
type: project
---

## Turbopack Broken on This Machine

`npm run build` fails with: "Turbopack is not supported on this platform (win32/x64) because native bindings are not available."

**Workaround:** Always use `npm run build -- --webpack` for production builds.

**Why:** The native `@next/swc-win32-x64-msvc` binary fails to load (invalid Win32 application error — likely a corrupted or mismatched node_modules install). WASM fallback works for compilation but Turbopack requires native bindings.

**How to apply:** Whenever verifying a build, append `-- --webpack`. Dev server (`npm run dev`) is unaffected — only `build` is broken with Turbopack.
