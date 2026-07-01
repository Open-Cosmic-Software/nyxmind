#!/usr/bin/env node
// 🦞 nyxmind CLI — give your agent a brain from the shell.
import { NyxMind, VTA } from '../src/index.js';

const [,, cmd, ...args] = process.argv;
const dir = process.env.NYXMIND_DIR || './mind-data';
const mind = new NyxMind(dir);

const help = `nyxmind — memory, emotion & drive for AI agents  (data: ${dir})

  nyxmind feel "text"                      appraise emotion + store memory
  nyxmind encode "text" [emotion] [0..1]   store with explicit feeling
  nyxmind remember "query"                 recall (and reinforce) memories
  nyxmind reward <type> "source" [0..1]    log a reward (types: ${VTA.TYPES.join(', ')})
  nyxmind pulse                            drive, last reward, zombie warning
  nyxmind sleep                            consolidate strong / forget faded
`;

const out = o => console.log(JSON.stringify(o, null, 2));
try {
  if (cmd === 'feel') out(await mind.feel(args.join(' ')));
  else if (cmd === 'encode') out(await mind.encode(args[0], { emotion: args[1] ?? null, intensity: parseFloat(args[2] ?? '0.5') }));
  else if (cmd === 'remember') out(await mind.remember(args.join(' ')));
  else if (cmd === 'reward') out(await mind.reward(args[0], args[1] ?? '', parseFloat(args[2] ?? '0.5')));
  else if (cmd === 'pulse') out(await mind.pulse());
  else if (cmd === 'sleep') out(await mind.sleep());
  else console.log(help);
} catch (e) { console.error('✖ ' + e.message); process.exit(1); }
