# AGENTS.md

## Project

`@soybeanjs/cva` — a small, performance-focused npm library for Tailwind CSS variant recipes. Two recipe APIs: `cv` (returns one class string) and `scv` (returns a slot-to-class map), plus helpers `alias`, `derive`, `defaults`, `cn`, `merge` and the `VariantProps` type. Runtime overrides are passed as rest arguments, never `class`/`className` props.

## Commands

Package manager is pnpm (`pnpm@11.25.0`).

- `pnpm test` — vitest run (all tests)
- `pnpm test -- test/index.test.ts` or `pnpm vitest --run test/tw-merge.test.ts` — focused test file
- `pnpm typecheck` — `tsc --noEmit --skipLibCheck`
- `pnpm lint` / `pnpm fmt` — via `vp` (vite-plus) with `@soybeanjs/oxc-config`
- `pnpm build` — `vp pack`, outputs to `dist/`
- `pnpm bench` / `bench:cv` / `bench:scv` — vitest benchmarks in `benchmark/`

Releases are done with `soy release` (`@soybeanjs/cli`); CI (`.github/workflows/release.yml`) publishes to npm on `v*` tags.

## Layout

- `src/` — flat modules, one feature per file: `cv.ts`, `scv.ts`, `alias.ts`, `derive.ts`, `defaults.ts`, `cn.ts`, `merge.ts`, `merge-config.ts`
- `src/index.ts` — the only public entry point; every public export (values from feature files, types from `types.ts`) must be re-exported here
- `src/internal.ts` — recipe runtime metadata (`recipeMetadata` symbol attached to every recipe) and the props-context stack (`withRecipePropsContext` / `getCurrentRecipeProps`) that lets recipes called inside `extendBase` inherit the outer recipe's resolved props
- `src/shared.ts` — normalization helpers; variant values normalize to strings (booleans become `'true'`/`'false'` keys but are exposed as `boolean` props)
- `src/types.ts` — all public and internal type definitions; types are a first-class feature here (type-level tests live in `test/index.test.ts` with an `IsEqual` helper)
- `test/` — vitest suites; `globals: false`, so import `describe/it/expect` from `'vitest'`
- `benchmark/` — perf suites comparing against `class-variance-authority`, `css-variants`, `tailwind-variants`; they import `../src` directly, so they always measure current workspace code

## Rules and gotchas

- ESM-only package (`"type": "module"`); named exports only, no default exports.
- Performance is the product: the merge engine (`twMerge` from the `cn` package) runs only when runtime override args are passed, and the no-override path returns prejoined output directly. Preserve this fast path when touching `cv.ts`/`scv.ts`.
- `test/merge-golden.test.ts` freezes the merge engine's outputs for a 15,660-case corpus extracted from soybean-ui styles (baseline produced by tailwind-merge 3.6.0 before the swap to `cn`). Regenerate with `UPDATE_MERGE_GOLDEN=1 pnpm vitest --run test/merge-golden.test.ts` only when an intentional behavior change is being made.
- `scv` cannot directly extend a `cv` recipe — only slot-mapped entries (`extend: [{ root: someCvRecipe }]`) or other `scv` recipes. `alias` remaps slot names, and runtime overrides must target the renamed slot.
- `extendBase` receives fully resolved props (inherited + local defaults + call-time props) and runs after inherited `extend` recipes resolve, before local `base` appends.
- Recipe functions carry hidden metadata via a `Symbol.for` key; wrappers (`alias`, `derive`, `defaults`) must re-attach it or extension/inheritance breaks.
- `vite.config.ts` `pack.entry` contains stale paths (`src/colord.ts`, `src/palette`, `src/plugins`) that don't exist; the real published entry is `src/index.ts` only (see `dist/`). Don't add entries there blindly.
- Path alias `@/*` → `./src/*` is configured, but source files use relative imports; follow that.
