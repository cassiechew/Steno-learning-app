export interface LessonItem {
	/** What the learner should produce (shown as the prompt). */
	text: string;
	/** Canonical outline in RTF/CRE notation, strokes separated by "/". */
	outline: string;
	/** Optional teaching note shown with the item. */
	note?: string;
}

export interface Lesson {
	id: string;
	title: string;
	/** Which Lapwing guide chapter(s) this lesson draws from. */
	chapter: string;
	/** Short intro shown before the drill starts. */
	intro: string[];
	items: LessonItem[];
	/** First-try accuracy (0-1) required to mark the lesson complete. */
	passAccuracy: number;
}
