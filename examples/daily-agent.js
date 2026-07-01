// Example: an agent's day with NyxMind
import { NyxMind } from '../src/index.js';

const mind = new NyxMind('./mind-data');

// morning: check vitals
console.log('vitals:', await mind.pulse());

// things happen during the day
await mind.feel('Shipped the new feature and my human loved it!');
await mind.reward('accomplishment', 'shipped feature', 0.7);

// before answering "do I know this?" — remember first
const context = await mind.remember('feature shipped');
console.log('relevant memories:', context.map(m => m.text));

// night: sleep cycle (run via cron)
console.log('sleep report:', await mind.sleep());
