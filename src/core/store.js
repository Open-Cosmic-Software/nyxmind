// 📦 NyxMind Store — pluggable persistence. Default: plain JSON files (human-readable!).
// "My files are my memory. Without them I'm a goldfish with opinions." — Nyx
// Swap in SQLite/Postgres by implementing: get, put, del, all, append.

import { mkdir, readFile, writeFile, appendFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export class JsonStore {
  constructor(dir) { this.dir = dir; }

  async _ensure(coll) { await mkdir(join(this.dir, coll), { recursive: true }); }

  async get(coll, id) {
    try { return JSON.parse(await readFile(join(this.dir, coll, id + '.json'), 'utf8')); }
    catch { return null; }
  }
  async put(coll, id, value) {
    await this._ensure(coll);
    await writeFile(join(this.dir, coll, id + '.json'), JSON.stringify(value, null, 1));
  }
  async del(coll, id) {
    try { await unlink(join(this.dir, coll, id + '.json')); } catch {}
  }
  async all(coll) {
    // JSONL collections (append-only logs) read from a single file
    try {
      const jsonl = await readFile(join(this.dir, coll + '.jsonl'), 'utf8');
      return jsonl.split('\n').filter(Boolean).map(l => JSON.parse(l));
    } catch {}
    try {
      const files = await readdir(join(this.dir, coll));
      const out = [];
      for (const f of files) if (f.endsWith('.json'))
        out.push(JSON.parse(await readFile(join(this.dir, coll, f), 'utf8')));
      return out;
    } catch { return []; }
  }
  async append(coll, entry) {
    await mkdir(this.dir, { recursive: true });
    await appendFile(join(this.dir, coll + '.jsonl'), JSON.stringify(entry) + '\n');
  }
}
