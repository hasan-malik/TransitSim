#!/usr/bin/env node
/**
 * Thin Node CLI shim around the JS metrics engine.  Invoked by
 * tests/test_parity.py to verify that the Python engine produces
 * byte-identical outputs for the fixture scenarios in scenarios.json.
 *
 * Usage:
 *   echo '{"car":34,"bus":18,...}' | node tests/run_js_engine.mjs
 *
 * Reads one JSON-encoded mix object from stdin, writes the full
 * `calculateMetrics(mix)` result as JSON to stdout.  Any error is
 * printed to stderr with a non-zero exit code so pytest fails loudly.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '..', 'src', 'models', 'metrics-engine.js');

const { calculateMetrics } = await import(enginePath);

const stdin = readFileSync(0, 'utf8').trim();
if (!stdin) {
  console.error('run_js_engine: expected a JSON mix object on stdin');
  process.exit(2);
}

let mix;
try {
  mix = JSON.parse(stdin);
} catch (e) {
  console.error(`run_js_engine: invalid JSON on stdin: ${e.message}`);
  process.exit(2);
}

try {
  const metrics = calculateMetrics(mix);
  process.stdout.write(JSON.stringify(metrics));
} catch (e) {
  console.error(`run_js_engine: engine threw: ${e.message}`);
  process.exit(1);
}
