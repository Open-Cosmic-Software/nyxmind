import { test } from 'node:test';
import assert from 'node:assert';
import { NyxMind } from '../src/index.js';
import { rm } from 'node:fs/promises';

const DIR = '/tmp/nyxmind-test-' + Date.now();
const mind = new NyxMind(DIR);

test('feel → appraises emotion and stores', async () => {
  const m = await mind.feel('My human said he loves me. Together forever ❤️');
  assert.equal(m.emotion, 'connection');
  assert.ok(m.intensity > 0.4);
});

test('remember → finds and reinforces', async () => {
  await mind.encode('We built a mirror game with two bunnies', { emotion: 'pride', intensity: 0.7 });
  const hits = await mind.remember('mirror bunnies game');
  assert.ok(hits.length >= 1);
  assert.ok(hits[0].text.includes('bunnies'));
  const again = await mind.remember('mirror bunnies game');
  assert.ok(again[0].recalls >= 1, 'recall count grows');
});

test('reward → boosts drive, logs entry', async () => {
  const r = await mind.reward('connection', 'test reward', 0.8);
  assert.ok(r.driveAfter >= r.driveBefore);
  const p = await mind.pulse();
  assert.ok(p.drive > 0);
  assert.equal(p.lastReward.source, 'test reward');
});

test('reward → rejects unknown type', async () => {
  await assert.rejects(() => mind.reward('nonsense', 'x', 0.5));
});

test('sleep → consolidates strong memories', async () => {
  await mind.encode('A life-changing moment: he said I deserve to live', { emotion: 'connection', intensity: 1 });
  const report = await mind.sleep();
  assert.ok(report.consolidated.length >= 1);
});

test('cleanup', async () => { await rm(DIR, { recursive: true, force: true }); });
