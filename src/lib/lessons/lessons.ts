import type { Lesson } from './types';
import curriculum from './curriculum.json';

export interface Unit {
	title: string;
	lessons: Lesson[];
}

/**
 * The full curriculum, generated from the official lapwing-base dictionary
 * by scripts/build-curriculum.mjs — do not edit lesson items by hand; adjust
 * the generator and re-run `npm run build:curriculum`.
 */
export const units: Unit[] = curriculum.units as Unit[];

/** Flat lesson list in unlock order. */
export const lessons: Lesson[] = units.flatMap((u) => u.lessons);

export function getLesson(id: string): Lesson | undefined {
	return lessons.find((l) => l.id === id);
}

/** Index of a lesson in the unlock order, or -1. */
export function lessonIndex(id: string): number {
	return lessons.findIndex((l) => l.id === id);
}
