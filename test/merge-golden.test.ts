import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { merge } from '../src/index';

// Golden baseline for the merge engine, built from the real class corpus of
// soybean-ui packages/ui/src/styles (extracted 2026-09-03): full class strings,
// adjacent pairs, same-group collisions, and hand-picked edge cases.
//
// Regenerate outputs with the currently installed engine:
//   UPDATE_MERGE_GOLDEN=1 pnpm vitest --run test/merge-golden.test.ts
// The committed outputs were produced by tailwind-merge 3.6.0 and must stay
// byte-identical across engine swaps.

const CHUNK_SIZE = 1000;

interface MergeGolden {
  inputs: string[];
  outputs: string[];
}

const fixturePath = fileURLToPath(new URL('./fixtures/merge-golden.json', import.meta.url));
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as MergeGolden;

if (process.env.UPDATE_MERGE_GOLDEN) {
  fixture.outputs = fixture.inputs.map(input => merge([input]));
  writeFileSync(fixturePath, `${JSON.stringify(fixture)}\n`);
}

describe('merge golden baseline', () => {
  it('fixture integrity', () => {
    expect(fixture.inputs.length).toBeGreaterThan(10_000);
    expect(fixture.outputs.length).toBe(fixture.inputs.length);
  });

  it.each(Array.from({ length: Math.ceil(fixture.inputs.length / CHUNK_SIZE) }, (_, i) => i))(
    'chunk %i matches frozen outputs',
    chunkIndex => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fixture.inputs.length);

      for (let i = start; i < end; i += 1) {
        const input = fixture.inputs[i];
        expect(merge([input]), `golden #${i} input: ${JSON.stringify(input)}`).toBe(fixture.outputs[i]);
      }
    }
  );
});
