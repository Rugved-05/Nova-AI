import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data/users');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function registerUser(name, email) {
  const id = uuidv4();
  const userDir = path.join(DATA_DIR, id);
  await ensureDir(userDir);
  const profile = { id, name, email, createdAt: new Date().toISOString() };
  await fs.writeFile(path.join(userDir, 'profile.json'), JSON.stringify(profile, null, 2));
  return profile;
}

export async function logEvent(userId, event) {
  const userDir = path.join(DATA_DIR, userId);
  await ensureDir(userDir);
  const line = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';
  await fs.appendFile(path.join(userDir, 'events.log'), line);
}

export async function getUserEvents(userId) {
  const file = path.join(DATA_DIR, userId, 'events.log');
  try {
    const data = await fs.readFile(file, 'utf8');
    return data.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
