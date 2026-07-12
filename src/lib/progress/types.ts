export interface LessonProgress {
	attempts: number;
	bestAccuracy: number;
	completed: boolean;
	lastPlayed: number;
}

export interface ItemStat {
	correct: number;
	wrong: number;
}

export interface ProgressData {
	lessons: Record<string, LessonProgress>;
	/** Keyed by outline, shared across lessons so mastery follows the chord. */
	items: Record<string, ItemStat>;
}

export function emptyProgress(): ProgressData {
	return { lessons: {}, items: {} };
}

/**
 * Swappable persistence backend. LocalStorageStore is the default;
 * SqliteStore talks to the app's own API route backed by better-sqlite3.
 */
export interface ProgressStore {
	readonly kind: 'local' | 'sqlite';
	load(): Promise<ProgressData>;
	save(data: ProgressData): Promise<void>;
	clear(): Promise<void>;
}
