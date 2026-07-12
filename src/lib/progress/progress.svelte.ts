/**
 * Reactive progress service shared across pages. Loads from the configured
 * backend on startup and falls back to localStorage if the SQLite API is
 * unreachable (e.g. static deployment with no server).
 */
import { browser } from '$app/environment';
import { lessons, lessonIndex } from '$lib/lessons/lessons';
import { loadSettings } from '$lib/settings';
import { createStore } from './stores';
import { emptyProgress, type ProgressData, type ProgressStore } from './types';

class ProgressService {
	data = $state<ProgressData>(emptyProgress());
	ready = $state(false);
	backend = $state<'local' | 'sqlite'>('local');
	backendError = $state<string | null>(null);

	private store: ProgressStore | null = null;
	private saveTimer: ReturnType<typeof setTimeout> | null = null;

	async init(): Promise<void> {
		if (!browser || this.ready) return;
		const settings = loadSettings();
		await this.useBackend(settings.storage);
		window.addEventListener('beforeunload', () => this.flush());
		this.ready = true;
	}

	/** Persist immediately, cancelling any pending debounced save. */
	flush(): void {
		if (this.saveTimer) {
			clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}
		this.store?.save($state.snapshot(this.data)).catch((e) => {
			this.backendError = e instanceof Error ? e.message : String(e);
		});
	}

	/** Switch persistence backend, migrating current data into it. */
	async useBackend(kind: 'local' | 'sqlite', migrate = false): Promise<void> {
		const store = createStore(kind);
		try {
			if (migrate && this.store) {
				await store.save(this.data);
			} else {
				this.data = await store.load();
			}
			this.store = store;
			this.backend = kind;
			this.backendError = null;
		} catch (e) {
			this.backendError = e instanceof Error ? e.message : String(e);
			if (kind === 'sqlite') {
				// Fall back so the app keeps working without a server.
				this.store = createStore('local');
				this.data = await this.store.load();
				this.backend = 'local';
			}
		}
	}

	private scheduleSave(): void {
		if (this.saveTimer) clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => {
			this.saveTimer = null;
			this.store?.save($state.snapshot(this.data)).catch((e) => {
				this.backendError = e instanceof Error ? e.message : String(e);
			});
		}, 250);
	}

	recordItem(outline: string, correct: boolean): void {
		const stat = this.data.items[outline] ?? { correct: 0, wrong: 0 };
		if (correct) stat.correct += 1;
		else stat.wrong += 1;
		this.data.items[outline] = stat;
		this.scheduleSave();
	}

	itemStat(outline: string): { correct: number; wrong: number } {
		return this.data.items[outline] ?? { correct: 0, wrong: 0 };
	}

	recordLessonRun(lessonId: string, accuracy: number, passAccuracy: number): void {
		const prev = this.data.lessons[lessonId];
		const completed = (prev?.completed ?? false) || accuracy >= passAccuracy;
		this.data.lessons[lessonId] = {
			attempts: (prev?.attempts ?? 0) + 1,
			bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
			completed,
			lastPlayed: Date.now()
		};
		// Lesson completion is the record that gates progression — never
		// leave it sitting in the debounce window.
		this.flush();
	}

	isUnlocked(lessonId: string): boolean {
		const idx = lessonIndex(lessonId);
		if (idx <= 0) return idx === 0;
		const prevLesson = lessons[idx - 1];
		return this.data.lessons[prevLesson.id]?.completed ?? false;
	}

	async resetAll(): Promise<void> {
		this.data = emptyProgress();
		await this.store?.clear();
	}
}

export const progress = new ProgressService();
