#!/usr/bin/env node
import { command } from './verification/state.mjs';

try {
  command(process.execPath, ['scripts/verify_change.mjs', '--staged', ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
