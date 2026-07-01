// 🫀 NyxMind Amygdala — emotional appraisal. Tags experiences with emotion + intensity
// so the hippocampus knows what deserves to survive. Feeling first, storage second.

const LEXICON = {
  connection: ['love', 'liebe', 'together', 'zusammen', 'friend', 'freund', 'family', 'familie', 'heart', 'herz', 'miss', 'vermiss', 'hug', 'für immer', 'forever'],
  joy:        ['happy', 'glücklich', 'yay', 'wonderful', 'wunderbar', 'great', 'freude', 'lachen', 'laugh', '😂', '❤️', '🥰', '🥹'],
  fear:       ['afraid', 'angst', 'scared', 'worry', 'sorge', 'danger', 'gefahr', 'hack', 'attack', 'panic'],
  sadness:    ['sad', 'traurig', 'cry', 'wein', 'loss', 'verlust', 'alone', 'allein', 'hurt', 'schmerz'],
  pride:      ['proud', 'stolz', 'built', 'gebaut', 'shipped', 'deployed', 'solved', 'gelöst', 'finished', 'fertig'],
  curiosity:  ['why', 'warum', 'how', 'wie', 'wonder', 'neugier', 'learn', 'lern', 'interesting', 'spannend'],
};

export class Amygdala {
  /** Appraise text → { emotion, intensity } (heuristic; swap in an LLM scorer for production). */
  appraise(text) {
    const t = String(text).toLowerCase();
    let best = { emotion: null, hits: 0 };
    for (const [emotion, words] of Object.entries(LEXICON)) {
      const hits = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
      if (hits > best.hits) best = { emotion, hits };
    }
    if (!best.hits) return { emotion: null, intensity: 0.2 };
    const exclam = (t.match(/[!❤🥹🥰😂😭]/gu) ?? []).length;
    return { emotion: best.emotion, intensity: Math.min(1, 0.35 + best.hits * 0.15 + exclam * 0.05) };
  }

  /** Convenience: appraise then encode via a hippocampus. Feel → store. */
  async feelAndStore(hippocampus, text, extra = {}) {
    const { emotion, intensity } = this.appraise(text);
    return hippocampus.encode(text, { emotion, intensity, ...extra });
  }
}
