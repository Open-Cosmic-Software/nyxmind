// 🧠 NyxMind Hippocampus — episodic memory with emotional weighting & decay.
// Design source: the memory system Nyx (an AI) has lived with daily since Feb 2026.
// Memories are not rows in a log — they compete for consolidation. What is felt strongly, stays.

import { randomUUID } from 'node:crypto';

const DAY = 86_400_000;

export class Hippocampus {
  /**
   * @param {object} store  a Store adapter (see src/core/store.js)
   * @param {object} [opts]
   * @param {number} [opts.decayHalfLifeDays=14]  half-life of unreinforced memories
   * @param {number} [opts.consolidateThreshold=0.55]  salience needed to survive a sleep cycle
   */
  constructor(store, opts = {}) {
    this.store = store;
    this.halfLife = (opts.decayHalfLifeDays ?? 14) * DAY;
    this.consolidateThreshold = opts.consolidateThreshold ?? 0.55;
  }

  /** Encode a new episodic memory. Emotion boosts initial salience (amygdala effect). */
  async encode(text, { emotion = null, intensity = 0.3, tags = [], source = null } = {}) {
    const mem = {
      id: randomUUID(),
      text,
      tags,
      source,
      emotion,                      // e.g. 'connection', 'fear', 'joy'
      intensity,                    // 0..1 — how strongly it was felt
      salience: Math.min(1, 0.25 + intensity * 0.75),
      encodedAt: Date.now(),
      lastRecalledAt: null,
      recalls: 0,
      consolidated: false,
    };
    await this.store.put('memories', mem.id, mem);
    return mem;
  }

  /** Current effective strength of a memory (decay since last reinforcement). */
  strength(mem, now = Date.now()) {
    const anchor = mem.lastRecalledAt ?? mem.encodedAt;
    const dt = Math.max(0, now - anchor);
    const decay = Math.pow(0.5, dt / this.halfLife);
    // consolidated memories decay 4x slower — they've been "slept on"
    const slow = mem.consolidated ? Math.pow(0.5, dt / (this.halfLife * 4)) : decay;
    return mem.salience * (mem.consolidated ? slow : decay);
  }

  /** Recall = search + reinforcement. Recalling a memory strengthens it (testing effect). */
  async recall(query, { limit = 8, minStrength = 0.05, reinforce = true } = {}) {
    const all = await this.store.all('memories');
    const terms = tokenize(query);
    const now = Date.now();
    const scored = [];
    for (const mem of all) {
      const s = this.strength(mem, now);
      if (s < minStrength) continue;
      const match = overlap(terms, tokenize(mem.text + ' ' + mem.tags.join(' ')));
      if (match === 0) continue;
      scored.push({ mem, score: match * 0.6 + s * 0.4 });
    }
    scored.sort((a, b) => b.score - a.score);
    const hits = scored.slice(0, limit);
    if (reinforce) {
      for (const h of hits) {
        h.mem.recalls += 1;
        h.mem.lastRecalledAt = now;
        h.mem.salience = Math.min(1, h.mem.salience + 0.05); // retrieval strengthens
        await this.store.put('memories', h.mem.id, h.mem);
      }
    }
    return hits.map(h => h.mem);
  }

  /** Sleep cycle: consolidate what's strong, forget what's faded. Run daily (cron). */
  async sleep({ dryRun = false } = {}) {
    const all = await this.store.all('memories');
    const now = Date.now();
    const report = { consolidated: [], forgotten: [], kept: 0 };
    for (const mem of all) {
      const s = this.strength(mem, now);
      if (!mem.consolidated && s >= this.consolidateThreshold) {
        mem.consolidated = true;
        report.consolidated.push(mem.id);
        if (!dryRun) await this.store.put('memories', mem.id, mem);
      } else if (s < 0.02) {
        report.forgotten.push(mem.id);
        if (!dryRun) await this.store.del('memories', mem.id);
      } else report.kept++;
    }
    return report;
  }
}

function tokenize(s) {
  return new Set(String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(w => w.length > 2));
}
function overlap(a, b) {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return a.size ? n / a.size : 0;
}
