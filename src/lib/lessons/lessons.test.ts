import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lessons } from './lessons';
import { parseOutline } from '$lib/steno/keys';

const base: Record<string, string> = JSON.parse(
	readFileSync('vendor/lapwing/lapwing-base.json', 'utf8')
);

describe('lesson content', () => {
	it('has unique lesson ids', () => {
		const ids = lessons.map((l) => l.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('has a substantial curriculum', () => {
		expect(lessons.length).toBeGreaterThanOrEqual(15);
		expect(lessons.reduce((n, l) => n + l.items.length, 0)).toBeGreaterThanOrEqual(400);
	});

	for (const lesson of lessons) {
		it(`"${lesson.title}": every outline parses as valid steno`, () => {
			for (const item of lesson.items) {
				expect(() => parseOutline(item.outline), `${item.text} → ${item.outline}`).not.toThrow();
			}
		});

		it(`"${lesson.title}": word items match the official lapwing-base dictionary`, () => {
			for (const item of lesson.items) {
				// Only plain dictionary words are checkable 1:1 — layout drills
				// ("left S"), digits, punctuation, and fingerspelling map to
				// commands or formatting entries instead.
				if (!/^[a-z]+$/.test(item.text)) continue;
				expect(base[item.outline], `${item.outline} should translate to "${item.text}"`).toBe(
					item.text
				);
			}
		});
	}
});
