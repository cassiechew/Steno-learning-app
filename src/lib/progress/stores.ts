import { emptyProgress, type ProgressData, type ProgressStore } from './types';

const LOCAL_KEY = 'steno-progress-v1';

export class LocalStorageStore implements ProgressStore {
	readonly kind = 'local' as const;

	async load(): Promise<ProgressData> {
		try {
			const raw = localStorage.getItem(LOCAL_KEY);
			if (!raw) return emptyProgress();
			return { ...emptyProgress(), ...JSON.parse(raw) };
		} catch {
			return emptyProgress();
		}
	}

	async save(data: ProgressData): Promise<void> {
		localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
	}

	async clear(): Promise<void> {
		localStorage.removeItem(LOCAL_KEY);
	}
}

export class SqliteStore implements ProgressStore {
	readonly kind = 'sqlite' as const;

	async load(): Promise<ProgressData> {
		const res = await fetch('/api/progress');
		if (!res.ok) throw new Error(`progress API: ${res.status}`);
		const data = await res.json();
		return { ...emptyProgress(), ...data };
	}

	async save(data: ProgressData): Promise<void> {
		const res = await fetch('/api/progress', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data),
			// So a save fired from beforeunload still completes.
			keepalive: true
		});
		if (!res.ok) throw new Error(`progress API: ${res.status}`);
	}

	async clear(): Promise<void> {
		const res = await fetch('/api/progress', { method: 'DELETE' });
		if (!res.ok) throw new Error(`progress API: ${res.status}`);
	}
}

export function createStore(kind: 'local' | 'sqlite'): ProgressStore {
	return kind === 'sqlite' ? new SqliteStore() : new LocalStorageStore();
}
