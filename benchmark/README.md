# Benchmark

This directory contains Vitest benchmark suites inspired by the css-variants benchmark layout.

## Run

- `pnpm bench`
- `pnpm bench:cv`
- `pnpm bench:scv`

## Coverage

- `cv`: compares `@soybeanjs/cva`, `css-variants`, and `class-variance-authority`
- `scv`: compares `@soybeanjs/cva`, `css-variants`, and `tailwind-variants/lite`
- Each suite includes `basic`, `defaults`, `compound variants`, and `complex real-world component` cases

## Notes

- `@soybeanjs/cva` uses `merges` for runtime overrides, so the no-variants benchmark uses `merges` for this library while the comparison libraries use their own override props such as `className`, `classNames`, or `class`.
- The benchmark files import the local source directly so measurements reflect the current workspace code, not a published build.
