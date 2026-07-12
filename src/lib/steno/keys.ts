/**
 * Core steno key model.
 *
 * A stroke is a set of StenoKey ids. Keys are ordered by standard steno order:
 *   # S T K P W H R A O * E U F R P B L G T S D Z
 * Left-bank and right-bank keys that share a letter get distinct ids
 * ("S-" vs "-S") so strokes can be represented as plain sets.
 */

export const STENO_KEYS = [
	'#',
	'S-',
	'T-',
	'K-',
	'P-',
	'W-',
	'H-',
	'R-',
	'A-',
	'O-',
	'*',
	'-E',
	'-U',
	'-F',
	'-R',
	'-P',
	'-B',
	'-L',
	'-G',
	'-T',
	'-S',
	'-D',
	'-Z'
] as const;

export type StenoKey = (typeof STENO_KEYS)[number];

const KEY_ORDER = new Map<StenoKey, number>(STENO_KEYS.map((k, i) => [k, i]));

const LEFT_KEYS: Record<string, StenoKey> = {
	S: 'S-',
	T: 'T-',
	K: 'K-',
	P: 'P-',
	W: 'W-',
	H: 'H-',
	R: 'R-'
};

const MIDDLE_KEYS: Record<string, StenoKey> = {
	A: 'A-',
	O: 'O-',
	'*': '*',
	E: '-E',
	U: '-U'
};

const RIGHT_KEYS: Record<string, StenoKey> = {
	F: '-F',
	R: '-R',
	P: '-P',
	B: '-B',
	L: '-L',
	G: '-G',
	T: '-T',
	S: '-S',
	D: '-D',
	Z: '-Z'
};

/** A stroke is a set of steno keys. */
export type Stroke = Set<StenoKey>;

export function strokesEqual(a: Stroke, b: Stroke): boolean {
	if (a.size !== b.size) return false;
	for (const k of a) if (!b.has(k)) return false;
	return true;
}

/**
 * Parse one stroke of RTF/CRE steno notation (e.g. "KAT", "TP-PL", "-T",
 * "STKPW*") into a key set. Throws on characters that can't be placed.
 */
export function parseStroke(notation: string): Stroke {
	const keys: Stroke = new Set();
	let zone: 'left' | 'right' = 'left';
	for (const ch of notation) {
		if (ch === '#') {
			keys.add('#');
			continue;
		}
		if (ch === '-') {
			zone = 'right';
			continue;
		}
		if (ch in MIDDLE_KEYS) {
			keys.add(MIDDLE_KEYS[ch]);
			zone = 'right';
			continue;
		}
		if (zone === 'left' && ch in LEFT_KEYS) {
			keys.add(LEFT_KEYS[ch]);
			continue;
		}
		if (zone === 'right' && ch in RIGHT_KEYS) {
			keys.add(RIGHT_KEYS[ch]);
			continue;
		}
		throw new Error(`Cannot parse steno stroke "${notation}" at "${ch}"`);
	}
	return keys;
}

/** Parse a full outline like "SUPB/SET" into a list of strokes. */
export function parseOutline(outline: string): Stroke[] {
	return outline.split('/').map(parseStroke);
}

const MIDDLE_SET: Set<StenoKey> = new Set(['A-', 'O-', '*', '-E', '-U']);
const RIGHT_SET: Set<StenoKey> = new Set(['-F', '-R', '-P', '-B', '-L', '-G', '-T', '-S', '-D', '-Z']);

/** Format a key set back into canonical steno notation. */
export function formatStroke(stroke: Stroke): string {
	const sorted = [...stroke].sort((a, b) => (KEY_ORDER.get(a) ?? 0) - (KEY_ORDER.get(b) ?? 0));
	const hasMiddle = sorted.some((k) => MIDDLE_SET.has(k));
	const hasRight = sorted.some((k) => RIGHT_SET.has(k));
	let out = '';
	for (const key of sorted) {
		if (!hasMiddle && hasRight && RIGHT_SET.has(key) && !out.includes('-')) {
			out += '-';
		}
		out += key === '#' ? '#' : key.replace('-', '');
	}
	return out;
}

export function formatOutline(strokes: Stroke[]): string {
	return strokes.map(formatStroke).join('/');
}
