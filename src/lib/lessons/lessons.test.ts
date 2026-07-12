import { describe, expect, it } from 'vitest';
import { lessons } from './lessons';
import { parseOutline } from '$lib/steno/keys';

describe('lesson content', () => {
	it('has unique lesson ids', () => {
		const ids = lessons.map((l) => l.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	for (const lesson of lessons) {
		it(`"${lesson.title}": every outline parses as valid steno`, () => {
			for (const item of lesson.items) {
				expect(() => parseOutline(item.outline), `${item.text} → ${item.outline}`).not.toThrow();
			}
		});
	}
});
