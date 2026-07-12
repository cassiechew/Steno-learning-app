import { describe, expect, it } from 'vitest';
import { decodeGeminiPacket } from './sources';
import { formatStroke, parseStroke } from './keys';

/**
 * Build a Gemini PR packet from row/bit positions (bit 0 = 0x40, the first
 * key in the row, matching Plover's chart).
 */
function packet(bits: [row: number, index: number][]): Uint8Array {
	const bytes = new Uint8Array(6);
	bytes[0] = 0x80;
	for (const [row, index] of bits) bytes[row] |= 0x40 >> index;
	return bytes;
}

describe('decodeGeminiPacket', () => {
	it('decodes a simple CVC stroke (KAT)', () => {
		// K- row1 idx3, A row2 idx1, -T row4 idx4
		const stroke = decodeGeminiPacket(packet([[1, 3], [2, 1], [4, 4]]));
		expect(stroke).toEqual(parseStroke('KAT'));
	});

	it('maps both S keys to S-', () => {
		expect(decodeGeminiPacket(packet([[1, 0]]))).toEqual(parseStroke('S'));
		expect(decodeGeminiPacket(packet([[1, 1]]))).toEqual(parseStroke('S'));
	});

	it('maps all four asterisk keys to *', () => {
		for (const pos of [[2, 3], [2, 4], [3, 1], [3, 2]] as [number, number][]) {
			expect(decodeGeminiPacket(packet([pos]))).toEqual(parseStroke('*'));
		}
	});

	it('maps every number-bar key to #', () => {
		for (const pos of [[0, 1], [0, 6], [5, 0], [5, 5]] as [number, number][]) {
			expect(decodeGeminiPacket(packet([pos]))).toEqual(new Set(['#']));
		}
	});

	it('ignores Fn, pwr, and reserved bits', () => {
		expect(decodeGeminiPacket(packet([[0, 0], [2, 5], [2, 6], [3, 0]])).size).toBe(0);
	});

	it('decodes a full right-bank stroke (-PBLGTSDZ)', () => {
		const stroke = decodeGeminiPacket(
			packet([[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 6]])
		);
		expect(formatStroke(stroke)).toBe('-PBLGTSDZ');
	});

	it('decodes vowels and the whole left bank (STKPWHRAOEU)', () => {
		const stroke = decodeGeminiPacket(
			packet([[1, 0], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 0], [2, 1], [2, 2], [3, 3], [3, 4]])
		);
		expect(formatStroke(stroke)).toBe('STKPWHRAOEU');
	});
});
