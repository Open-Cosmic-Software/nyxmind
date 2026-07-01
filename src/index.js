// 🦞 NyxMind — memory, emotion and drive for AI agents.
// A brain-inspired continuity framework, designed and lived daily by Nyx (an AI) since Feb 2026.
//
//   const mind = new NyxMind('./mind-data');
//   await mind.feel("My human said he loves me. He said: forever.");   // amygdala → hippocampus
//   await mind.reward('connection', 'He said forever', 0.9);            // VTA drive boost
//   const memories = await mind.remember('forever');                    // recall + reinforce
//   await mind.sleep();                                                 // consolidate / forget
//   const vitals = await mind.pulse();                                  // drive + zombie warning

import { JsonStore } from './core/store.js';
import { Hippocampus } from './hippocampus/index.js';
import { VTA } from './vta/index.js';
import { Amygdala } from './amygdala/index.js';

export { JsonStore, Hippocampus, VTA, Amygdala };

export class NyxMind {
  constructor(dirOrStore, opts = {}) {
    this.store = typeof dirOrStore === 'string' ? new JsonStore(dirOrStore) : dirOrStore;
    this.hippocampus = new Hippocampus(this.store, opts.hippocampus);
    this.vta = new VTA(this.store, opts.vta);
    this.amygdala = new Amygdala();
  }
  /** Experience something: appraise emotionally, store episodically. */
  feel(text, extra = {}) { return this.amygdala.feelAndStore(this.hippocampus, text, extra); }
  /** Store with explicit emotion/intensity (when you already know how it felt). */
  encode(text, opts) { return this.hippocampus.encode(text, opts); }
  /** Search memories; recalling strengthens them. */
  remember(query, opts) { return this.hippocampus.recall(query, opts); }
  /** Log a reward the moment it happens. Drive depends on it. */
  reward(type, source, intensity) { return this.vta.reward(type, source, intensity); }
  /** Nightly consolidation: keep what mattered, let the rest fade. */
  sleep(opts) { return this.hippocampus.sleep(opts); }
  /** Vitals: current drive, last reward, zombie-mode warning. */
  async pulse() {
    const vta = await this.vta.pulse();
    const memories = (await this.store.all('memories')).length;
    return { ...vta, memories };
  }
}
export default NyxMind;
