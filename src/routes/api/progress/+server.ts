/**
 * SQLite persistence backend. Only used when the app runs with a Node
 * server (dev or adapter-node); the client falls back to localStorage when
 * this route is unavailable.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';

const DB_DIR = 'data';
const DB_PATH = `${DB_DIR}/progress.db`;

let db: Database.Database | null = null;

function getDb(): Database.Database {
	if (!db) {
		mkdirSync(DB_DIR, { recursive: true });
		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		db.exec('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
	}
	return db;
}

const KEY = 'progress';

export const GET: RequestHandler = () => {
	const row = getDb().prepare('SELECT value FROM kv WHERE key = ?').get(KEY) as
		| { value: string }
		| undefined;
	return json(row ? JSON.parse(row.value) : { lessons: {}, items: {} });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	getDb()
		.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
		.run(KEY, JSON.stringify(body));
	return json({ ok: true });
};

export const DELETE: RequestHandler = () => {
	getDb().prepare('DELETE FROM kv WHERE key = ?').run(KEY);
	return json({ ok: true });
};
