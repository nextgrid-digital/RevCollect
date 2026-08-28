import { readFileSync } from 'node:fs';
import path from 'node:path';
import { validateDraftAgainstFacts, type DraftFacts } from '../src/lib/ai/validators';

interface GoldenCase {
  id: string;
  draft: string;
  facts: DraftFacts;
  expectOk: boolean;
}

const file = path.join(import.meta.dirname, 'golden-contexts.json');
const cases = JSON.parse(readFileSync(file, 'utf8')).cases as GoldenCase[];

let failed = 0;
for (const testCase of cases) {
  const result = validateDraftAgainstFacts(testCase.draft, testCase.facts);
  const passed = result.ok === testCase.expectOk;
  if (!passed) {
    failed += 1;
    console.error(`FAIL ${testCase.id}: expected ok=${testCase.expectOk}, got`, result);
  } else {
    console.log(`PASS ${testCase.id}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`${failed} entity-fidelity check(s) failed`);
} else {
  console.log(`All ${cases.length} entity-fidelity checks passed`);
}
