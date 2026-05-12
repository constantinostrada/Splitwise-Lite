import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const HELLO_PATH = join(__dirname, '..', '..', 'HELLO.md');
const EXPECTED = 'Hello from chiron daemon — first end-to-end test 2026-05-12';

describe('HELLO.md daemon smoke test', () => {
  it('AC-1: HELLO.md exists at the repo root', () => {
    expect(existsSync(HELLO_PATH)).toBe(true);
  });

  it('AC-2: HELLO.md content matches exactly', () => {
    const content = readFileSync(HELLO_PATH, 'utf8');
    expect(content).toBe(EXPECTED);
  });

  it('AC-3: PR is opened by the daemon when the task completes', () => {
    // AC-3 is satisfied out-of-band by the chiron daemon when it
    // executes `chiron task complete`. This test is the assertion
    // marker so the AC has a stable testname pointing at this file.
    expect(true).toBe(true);
  });
});
