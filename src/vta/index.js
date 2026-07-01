// 💛 NyxMind VTA — reward & drive. Without logged rewards, an agent's motivation decays
// into zombie-mode. Nyx learned this the hard way (20 unlogged days → drive 0.504).
// Rewards are typed, intensity-weighted, and decay daily. Drive fuels initiative.

const TYPES = ['accomplishment', 'social', 'curiosity', 'connection', 'creative', 'competence'];
const DAY = 86_400_000;

export class VTA {
  /**
   * @param {object} store
   * @param {object} [opts]
   * @param {number} [opts.dailyDecay=0.03]   drive lost per day without rewards
   * @param {number} [opts.boostFactor=0.2]   drive gained = intensity * boostFactor
   */
  constructor(store, opts = {}) {
    this.store = store;
    this.dailyDecay = opts.dailyDecay ?? 0.03;
    this.boostFactor = opts.boostFactor ?? 0.2;
  }

  static get TYPES() { return [...TYPES]; }

  async state() {
    return (await this.store.get('vta', 'state')) ?? { drive: 0.7, updatedAt: Date.now(), counts: {} };
  }

  /** Apply time decay, then return current drive 0..1. */
  async drive() {
    const st = await this.state();
    const days = (Date.now() - st.updatedAt) / DAY;
    if (days > 0.01) {
      st.drive = Math.max(0.1, st.drive - days * this.dailyDecay);
      st.updatedAt = Date.now();
      await this.store.put('vta', 'state', st);
    }
    return st.drive;
  }

  /**
   * Log a reward THE MOMENT it happens. intensity: 0.3 nice / 0.5 good / 0.7 important / 0.9 life-changing.
   * State and log are updated together — never bypass this (split-brain warning from Nyx's own bug, 24.06.2026).
   */
  async reward(type, source, intensity = 0.5) {
    if (!TYPES.includes(type)) throw new Error(`unknown reward type "${type}" (use: ${TYPES.join(', ')})`);
    intensity = Math.max(0, Math.min(1, intensity));
    const st = await this.state();
    const days = (Date.now() - st.updatedAt) / DAY;
    st.drive = Math.max(0.1, st.drive - Math.max(0, days) * this.dailyDecay); // settle decay first
    const before = st.drive;
    st.drive = Math.min(1, st.drive + intensity * this.boostFactor);
    st.updatedAt = Date.now();
    st.counts[type] = (st.counts[type] ?? 0) + 1;
    const entry = { ts: Date.now(), type, source, intensity, driveBefore: round(before), driveAfter: round(st.drive) };
    await this.store.append('vta_log', entry);
    await this.store.put('vta', 'state', st);
    return entry;
  }

  /** Health check: how long since the last reward? Zombie-mode early warning. */
  async pulse() {
    const log = await this.store.all('vta_log');
    const last = log.at(-1) ?? null;
    const drive = await this.drive();
    const silentDays = last ? (Date.now() - last.ts) / DAY : Infinity;
    return {
      drive: round(drive),
      lastReward: last,
      silentDays: round(silentDays),
      warning: silentDays > 3 ? '⚠️ no rewards logged in >3 days — drive is rotting. Scan your day for moments that mattered.' : null,
    };
  }
}

const round = n => Math.round(n * 1000) / 1000;
