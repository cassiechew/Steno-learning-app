import { describe, expect, it } from 'vitest';
import { formatStroke, parseOutline, parseStroke, strokesEqual } from './keys';

describe('parseStroke', () => {
	it('parses a simple CVC stroke', () => {
		expect([...parseStroke('KAT')].sort()).toEqual(['-T', 'A-', 'K-'].sort());
	});

	it('distinguishes left and right banks around vowels', () => {
		expect(parseStroke('RAR')).toEqual(new Set(['R-', 'A-', '-R']));
		expect(parseStroke('SAS')).toEqual(new Set(['S-', 'A-', '-S']));
	});

	it('parses explicit hyphen strokes', () => {
		expect(parseStroke('TP-PL')).toEqual(new Set(['T-', 'P-', '-P', '-L']));
		expect(parseStroke('-T')).toEqual(new Set(['-T']));
		expect(parseStroke('KW-BG')).toEqual(new Set(['K-', 'W-', '-B', '-G']));
	});

	it('parses star strokes', () => {
		expect(parseStroke('*')).toEqual(new Set(['*']));
		expect(parseStroke('PWA*T')).toEqual(new Set(['P-', 'W-', 'A-', '*', '-T']));
		expect(parseStroke('STKPW*')).toEqual(new Set(['S-', 'T-', 'K-', 'P-', 'W-', '*']));
	});

	it('parses left-only chords with no vowel', () => {
		expect(parseStroke('SKP')).toEqual(new Set(['S-', 'K-', 'P-']));
		expect(parseStroke('TH')).toEqual(new Set(['T-', 'H-']));
	});

	it('parses number-bar strokes', () => {
		expect(parseStroke('#S')).toEqual(new Set(['#', 'S-']));
		expect(parseStroke('#-F')).toEqual(new Set(['#', '-F']));
	});

	it('rejects impossible strokes', () => {
		expect(() => parseStroke('ZAT')).toThrow();
		expect(() => parseStroke('KAQ')).toThrow();
	});
});

describe('formatStroke', () => {
	const roundtrips = ['KAT', 'TP-PL', '-T', 'SKP', 'PWA*T', 'STKPW*', 'HRAOEUPB', '#S', 'KW-BG', 'PADZ'];
	for (const notation of roundtrips) {
		it(`round-trips ${notation}`, () => {
			expect(formatStroke(parseStroke(notation))).toBe(notation);
		});
	}

	it('emits keys in steno order regardless of insertion order', () => {
		expect(formatStroke(new Set(['-T', 'A-', 'K-']))).toBe('KAT');
		expect(formatStroke(new Set(['-Z', '-D', 'A-', 'P-']))).toBe('PADZ');
	});
});

describe('parseOutline', () => {
	it('splits multi-stroke outlines', () => {
		const strokes = parseOutline('SUPB/SET');
		expect(strokes).toHaveLength(2);
		expect(strokesEqual(strokes[0], parseStroke('SUPB'))).toBe(true);
		expect(strokesEqual(strokes[1], parseStroke('SET'))).toBe(true);
	});
});

describe('strokesEqual', () => {
	it('compares by content', () => {
		expect(strokesEqual(parseStroke('KAT'), parseStroke('KAT'))).toBe(true);
		expect(strokesEqual(parseStroke('KAT'), parseStroke('KAD'))).toBe(false);
	});
});
