/**
 * Generates the full Lapwing curriculum from the official lapwing-base
 * dictionary (vendor/lapwing/, MIT, © Aerick) + SUBTLEX-US word frequencies.
 *
 * Approach: each lesson has a "chord vocabulary" — the set of key-chords
 * taught so far, mirroring the Lapwing for Beginners guide's progression
 * (https://lapwing.aerick.ca). A dictionary word qualifies for a lesson only
 * if every stroke of its outline decomposes into taught chords, it uses the
 * lesson's new material, and it is frequent enough to be worth drilling.
 *
 * Output: src/lib/lessons/curriculum.json (committed; the app has no
 * runtime dependency on the 3.4 MB dictionary).
 *
 * Run: node scripts/build-curriculum.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const base = JSON.parse(readFileSync('vendor/lapwing/lapwing-base.json', 'utf8'));
const commands = JSON.parse(readFileSync('vendor/lapwing/lapwing-commands.json', 'utf8'));
const subtlex = require('subtlex-word-frequencies');

// ---------- steno notation (mirrors src/lib/steno/keys.ts; unit tests
// re-validate every generated outline with the app's own parser) ----------
const STENO_KEYS = ['#','S-','T-','K-','P-','W-','H-','R-','A-','O-','*','-E','-U','-F','-R','-P','-B','-L','-G','-T','-S','-D','-Z'];
const BIT = new Map(STENO_KEYS.map((k, i) => [k, 1 << i]));
const LEFT = { S:'S-',T:'T-',K:'K-',P:'P-',W:'W-',H:'H-',R:'R-' };
const MIDDLE = { A:'A-',O:'O-','*':'*',E:'-E',U:'-U' };
const RIGHT = { F:'-F',R:'-R',P:'-P',B:'-B',L:'-L',G:'-G',T:'-T',S:'-S',D:'-D',Z:'-Z' };

function parseStrokeMask(notation) {
	let mask = 0;
	let zone = 'left';
	for (const ch of notation) {
		if (ch === '#') { mask |= BIT.get('#'); continue; }
		if (ch === '-') { zone = 'right'; continue; }
		if (ch in MIDDLE) { mask |= BIT.get(MIDDLE[ch]); zone = 'right'; continue; }
		if (zone === 'left' && ch in LEFT) { mask |= BIT.get(LEFT[ch]); continue; }
		if (zone === 'right' && ch in RIGHT) { mask |= BIT.get(RIGHT[ch]); continue; }
		return null;
	}
	return mask;
}
const parseOutlineMasks = (outline) => {
	const strokes = outline.split('/').map(parseStrokeMask);
	return strokes.every((s) => s !== null && s !== 0) ? strokes : null;
};
const chordMask = (n) => {
	const m = parseStrokeMask(n);
	if (m === null) throw new Error(`bad chord ${n}`);
	return m;
};

// ---------- chord vocabulary stages (the Lapwing teaching order) ----------
const LEFT_SINGLES = ['S', 'T', 'K', 'P', 'W', 'H', 'R'].map(chordMask);
const SHORT_VOWELS = ['A', 'O', 'E', 'U', 'EU'].map(chordMask);
const LONG_VOWELS = ['AEU', 'AOE', 'AOEU', 'OE', 'AOU', 'AO', 'AU', 'OU', 'OEU'].map(chordMask);
const LEFT_CHORDS = ['TK', 'PW', 'HR', 'TP', 'SR', 'TKPW', 'PH', 'TPH', 'KWR', 'SKWR', 'KH', 'SH', 'TH', 'KW'].map(chordMask);
const RIGHT_SINGLES = ['-F', '-R', '-P', '-B', '-L', '-G', '-T', '-S', '-D', '-Z'].map(chordMask);
const RIGHT_CHORDS = ['-PB', '-PL', '-BG', '-FP', '-RB', '-PBLG', '-BGS', '-PBG', '-GS'].map(chordMask);
const STAR = [chordMask('*')];

const MIDDLE_MASK = ['A', 'O', '*', 'E', 'U'].map(chordMask).reduce((a, b) => a | b, 0);
const LEFT_MASK = Object.keys(LEFT).map((k) => BIT.get(LEFT[k])).reduce((a, b) => a | b, 0);

/** Can `mask` be partitioned into ≤ maxParts disjoint vocab chords? */
function decomposes(mask, vocab, maxParts) {
	if (mask === 0) return true;
	if (maxParts === 0) return false;
	for (const chord of vocab) {
		if ((mask & chord) === chord && decomposes(mask & ~chord, vocab, maxParts - 1)) return true;
	}
	return false;
}

/** A stroke decomposes if vowel part ∈ vowels(+star) and each bank ∈ chords. */
function strokeOk(mask, stage) {
	if (mask & BIT.get('#')) return false;
	const mid = mask & MIDDLE_MASK;
	const left = mask & LEFT_MASK & ~mid; // '*' overlaps neither bank
	const right = mask & ~mid & ~left & ~BIT.get('#');
	const midNoStar = mid & ~BIT.get('*');
	if (mid & BIT.get('*') && !stage.star) return false;
	if (midNoStar !== 0 && !stage.vowels.includes(midNoStar)) return false;
	if (!decomposes(left, stage.left, stage.maxLeft ?? 3)) return false;
	if (!decomposes(right, stage.right, stage.maxRight ?? 3)) return false;
	return true;
}

const stage1 = { left: LEFT_SINGLES, vowels: SHORT_VOWELS, right: RIGHT_SINGLES, star: false };
const stage2 = { ...stage1, vowels: [...SHORT_VOWELS, ...LONG_VOWELS] };
const stage3 = { ...stage2, left: [...LEFT_SINGLES, ...LEFT_CHORDS] };
const stage4 = { ...stage3, right: [...RIGHT_SINGLES, ...RIGHT_CHORDS] };
const stage5 = { ...stage4, star: true };
// The two vowel lessons come before chords are taught, so strokes there must
// be a single plain key per bank — this keeps briefs like KWHUR ("your")
// from masquerading as beginner material just because their keys decompose.
const stage1strict = { ...stage1, maxLeft: 1, maxRight: 1 };
const stage2strict = { ...stage2, maxLeft: 1, maxRight: 1 };

// SUBTLEX is a film-subtitle corpus, so profanity ranks high; keep it out.
const BLOCKED = /fuck|shit|bitch|asshole|nigg|cunt|dick|piss|whore|slut|damn|bastard/;

// ---------- word data ----------
const rank = new Map();
subtlex.forEach(({ word }, i) => {
	const w = word.toLowerCase();
	if (!rank.has(w)) rank.set(w, i);
});

// word -> all outlines that parse
const outlinesByWord = new Map();
for (const [outline, word] of Object.entries(base)) {
	if (!/^[a-z]+$/.test(word)) continue;
	if (!parseOutlineMasks(outline)) continue;
	if (!outlinesByWord.has(word)) outlinesByWord.set(word, []);
	outlinesByWord.get(word).push(outline);
}

const strokeCount = (o) => o.split('/').length;
const hasStar = (o) => o.includes('*');

/** Lapwing's preferred outline among candidates: fewest strokes, no star, shortest. */
function preferred(cands) {
	return [...cands].sort(
		(a, b) =>
			strokeCount(a) - strokeCount(b) || hasStar(a) - hasStar(b) || a.length - b.length || (a < b ? -1 : 1)
	)[0];
}

const usedWords = new Set();

/**
 * Select drill items: the most frequent words whose *preferred outline under
 * this stage* satisfies the lesson's filter.
 */
function pick({ stage, filter, count, maxRank = 8000, minLen = 2, allowUsed = false, note, diversify, maxPerGroup = 6 }) {
	const out = [];
	const scored = [];
	for (const [word, outlines] of outlinesByWord) {
		if (!allowUsed && usedWords.has(word)) continue;
		if (word.length < minLen || BLOCKED.test(word)) continue;
		const r = rank.get(word);
		if (r === undefined || r > maxRank) continue;
		const decomposable = outlines.filter((o) =>
			parseOutlineMasks(o).every((m) => strokeOk(m, stage))
		);
		if (decomposable.length === 0) continue;
		const best = preferred(decomposable);
		if (!filter(best, word)) continue;
		scored.push([r, word, best]);
	}
	scored.sort((a, b) => a[0] - b[0]);
	const groupCounts = new Map();
	for (const [, word, outline] of scored) {
		if (out.length >= count) break;
		if (diversify) {
			const g = diversify(outline, word);
			const n = groupCounts.get(g) ?? 0;
			if (n >= maxPerGroup) continue;
			groupCounts.set(g, n + 1);
		}
		usedWords.add(word);
		out.push({ text: word, outline, ...(note ? { note: note(outline, word) } : {}) });
	}
	return out;
}

const strokeUsesAny = (mask, chords) => chords.some((c) => (mask & c) === c);
const outlineUsesAny = (outline, chords) =>
	parseOutlineMasks(outline).some((m) => strokeUsesAny(m, chords));

// Words whose spelling suggests suffix keys; keep them out of pre-suffix lessons.
const suffixy = (w) => /ing$/.test(w) || (/[^su]s$/.test(w) && w.length > 3);

// ---------- harvest special material from the dictionaries ----------
// Fingerspelling: {>}{&x}
const fingerspelling = [];
for (const [outline, tr] of Object.entries(base)) {
	const m = tr.match(/^\{>\}\{&([a-z])\}$/);
	if (m && !outline.includes('/') && parseOutlineMasks(outline)) fingerspelling.push([m[1], outline]);
}
fingerspelling.sort((a, b) => (a[0] < b[0] ? -1 : 1));

// Prefix/suffix strokes: {con^} / {^ing}
const prefixStrokes = new Map(); // outline -> text
const suffixStrokes = new Map();
for (const [outline, tr] of Object.entries(base)) {
	if (outline.includes('/') || !parseOutlineMasks(outline)) continue;
	let m = tr.match(/^\{([a-z]+)\^\}$/);
	if (m) prefixStrokes.set(outline, m[1]);
	m = tr.match(/^\{\^([a-z]+)\}$/);
	if (m) suffixStrokes.set(outline, m[1]);
}

// Homophone/conflict pairs: outline and outline+'*' both map to words.
const starPairs = [];
{
	const byMasks = new Map(); // canonical single-stroke notation -> word
	for (const [outline, word] of Object.entries(base)) {
		if (!/^[a-z]+$/.test(word) || outline.includes('/')) continue;
		if (parseOutlineMasks(outline)) byMasks.set(outline, word);
	}
	for (const [outline, word] of byMasks) {
		if (outline.includes('*')) continue;
		// insert '*' into notation: reparse via masks
		const mask = parseStrokeMask(outline) | BIT.get('*');
		for (const [o2, w2] of byMasks) {
			if (parseStrokeMask(o2) === mask && w2 !== word) {
				const r1 = rank.get(word), r2 = rank.get(w2);
				if (BLOCKED.test(word) || BLOCKED.test(w2)) continue;
				if (r1 !== undefined && r2 !== undefined && r1 < 5000 && r2 < 8000) {
					starPairs.push([r1 + r2, word, outline, w2, o2]);
				}
			}
		}
	}
	starPairs.sort((a, b) => a[0] - b[0]);
}

// ---------- curated items validated against the dictionaries ----------
function validated(list, dict = base) {
	for (const { outline, expect } of list) {
		if (dict[outline] === undefined) throw new Error(`not in dictionary: ${outline}`);
		if (expect && dict[outline] !== expect) throw new Error(`${outline} → ${dict[outline]}, expected ${expect}`);
	}
	return list.map(({ text, outline, note }) => {
		usedWords.add(text);
		return { text, outline, ...(note ? { note } : {}) };
	});
}

const starterBriefs = [
	{ text: 'the', outline: '-T', expect: 'the' },
	{ text: 'of', outline: '-F', expect: 'of' },
	{ text: 'and', outline: 'SKP', expect: 'and' },
	{ text: 'I', outline: 'EU', expect: 'I' },
	{ text: 'you', outline: 'U', expect: 'you' },
	{ text: 'it', outline: 'T', expect: 'it' },
	{ text: 'is', outline: 'S', expect: 'is' },
	{ text: 'are', outline: 'R', expect: 'are' },
	{ text: 'with', outline: 'W', expect: 'with' },
	{ text: 'can', outline: 'K', expect: 'can' },
	{ text: 'will', outline: 'HR', expect: 'will' },
	{ text: 'have', outline: 'SR', expect: 'have' },
	{ text: 'be', outline: '-B', expect: 'be' },
	{ text: 'this', outline: 'TH', expect: 'this' },
	{ text: 'that', outline: 'THA', expect: 'that' },
	{ text: 'was', outline: 'WAS', expect: 'was' },
	{ text: 'for', outline: 'TP-R', expect: 'for' },
	{ text: 'on', outline: 'AUPB', expect: 'on' },
	{ text: 'at', outline: 'AT', expect: 'at' },
	{ text: 'we', outline: 'WAOE', expect: 'we' },
	{ text: 'he', outline: 'HAOE', expect: 'he' },
	{ text: 'she', outline: 'SHAOE', expect: 'she' },
	{ text: 'they', outline: 'THE', expect: 'they' },
	{ text: 'do', outline: 'TKO', expect: 'do' },
	{ text: 'go', outline: 'TKPW', expect: 'go' },
	{ text: 'so', outline: 'SO', expect: 'so' },
	{ text: 'not', outline: 'TPHOT', expect: 'not' }
];

// ---------- build the lessons ----------
const units = [];
const unit = (title, lessons) => units.push({ title, lessons });
const lesson = (id, title, chapter, intro, items, extra = {}) => {
	if (items.length === 0) throw new Error(`lesson ${id} generated no items`);
	return { id, title, chapter, intro, items, passAccuracy: 0.9, ...extra };
};

unit('Getting started', [
	lesson(
		'layout',
		'Meet the keyboard',
		'Lapwing guide: steno basics',
		[
			'A steno keyboard has a LEFT bank (initial consonants), four VOWEL keys under your thumbs, an asterisk, and a RIGHT bank (final consonants).',
			'Keys are always read in steno order: S T K P W H R — A O * E U — F R P B L G T S D Z.',
			'This drill just asks you to press each key on its own. Watch the diagram: it shows exactly which key to hit.'
		],
		[
			['left S', 'S'], ['left T', 'T'], ['left K', 'K'], ['left P', 'P'], ['left W', 'W'],
			['left H', 'H'], ['left R', 'R'], ['vowel A', 'A'], ['vowel O', 'O'], ['asterisk key', '*'],
			['vowel E', 'E'], ['vowel U', 'U'], ['right F', '-F'], ['right R', '-R'], ['right P', '-P'],
			['right B', '-B'], ['right L', '-L'], ['right G', '-G'], ['right T', '-T'], ['right S', '-S'],
			['right D', '-D'], ['right Z', '-Z']
		].map(([text, outline]) => ({ text, outline }))
	),
	lesson(
		'short-vowels',
		'First words: short vowels',
		'Lapwing guide: one-syllable words',
		[
			'Words are stroked phonetically: initial consonant + vowel + final consonant, all pressed together as one chord.',
			'Short vowel sounds: A = "a" in cat, O = "o" in hot, E = "e" in pet, U = "u" in cut.',
			'The short "i" of "sit" has no key of its own — it is the two-key chord EU, pressed with one thumb.'
		],
		pick({
			stage: stage1strict,
			count: 30,
			maxRank: 6000,
			filter: (o, w) => {
				if (strokeCount(o) !== 1 || suffixy(w)) return false;
				const m = parseStrokeMask(o);
				// real phonetic words: a vowel plus at least one consonant key
				return (m & MIDDLE_MASK) !== 0 && (m & ~MIDDLE_MASK) !== 0;
			}
		})
	),
	lesson(
		'long-vowels',
		'Long vowels & diphthongs',
		'Lapwing guide: vowel chords',
		[
			'Long vowels are two- and three-key thumb chords:',
			'AEU = long a (late) · AOE = long e (heat) · AOEU = long i (site) · OE = long o (hope) · AOU = long u (cute) · AO = "oo" (soup)',
			'Diphthongs: AU = "aw" (saw) · OU = "ow" (how) · OEU = "oy" (toy)'
		],
		pick({
			stage: stage2strict,
			count: 32,
			maxRank: 6000,
			filter: (o, w) => {
				if (strokeCount(o) !== 1 || suffixy(w)) return false;
				const m = parseStrokeMask(o);
				return outlineUsesAny(o, LONG_VOWELS) && (m & ~MIDDLE_MASK) !== 0;
			}
		})
	)
]);

unit('Consonant chords', [
	lesson(
		'left-hand-chords',
		'Left-hand consonant chords',
		'Lapwing guide: initial consonant chords',
		[
			'Missing initial consonants are chords on the left bank:',
			'TK = d · PW = b · HR = l · TP = f · SR = v · TKPW = g · PH = m · TPH = n · KWR = y · SKWR = j · KW = qu',
			'And the "h-family" digraphs: KH = ch · SH = sh · TH = th'
		],
		pick({
			stage: stage3,
			count: 36,
			maxRank: 6000,
			filter: (o, w) =>
				strokeCount(o) === 1 &&
				!suffixy(w) &&
				outlineUsesAny(o, LEFT_CHORDS) &&
				(parseStrokeMask(o) & MIDDLE_MASK) !== 0
		})
	),
	lesson(
		'right-hand-chords',
		'Right-hand consonant chords',
		'Lapwing guide: final consonant chords',
		[
			'Missing final consonants are chords on the right bank:',
			'-PB = n · -PL = m · -BG = k · -FP = ch · -RB = sh · -PBLG = j · -BGS = x · -PBG = ng · -GS = "shun"',
			'These free up your left hand: now any consonant can start OR end a word.'
		],
		pick({
			stage: stage4,
			count: 36,
			maxRank: 6000,
			filter: (o, w) =>
				strokeCount(o) === 1 &&
				!suffixy(w) &&
				outlineUsesAny(o, RIGHT_CHORDS) &&
				(parseStrokeMask(o) & MIDDLE_MASK) !== 0
		})
	),
	lesson(
		'asterisk',
		'The asterisk & fingerspelling',
		'Lapwing guide: the asterisk key',
		[
			'The asterisk alone (*) undoes your last stroke — you will use it constantly.',
			'* also modifies strokes: final *T = "-th" (bath = PWA*T), and it distinguishes words that would otherwise collide.',
			'Fingerspelling writes single letters for names and odd words: the letter chord + *.'
		],
		[
			{ text: 'undo (asterisk alone)', outline: '*' },
			...pick({
				stage: stage5,
				count: 10,
				maxRank: 8000,
				filter: (o, w) => strokeCount(o) === 1 && !suffixy(w) && o.includes('*')
			}),
			...fingerspelling.map(([letter, outline]) => ({ text: `letter ${letter}`, outline }))
		]
	),
	lesson(
		'suffix-keys',
		'Suffix keys: -G, -S, -D, -Z',
		'Lapwing guide: suffix keys',
		[
			'The last four right-bank keys double as one-key suffixes added to the same stroke:',
			'-G = "-ing" · -S = plural/possessive "s" · -D = past tense "-ed" · -Z = "s" when -S is unreachable',
			'Steno order still applies: -S sits before -D, so a plural added to a word ending in D must use -Z instead ("pads" = PADZ, never PADS).'
		],
		pick({
			stage: stage5,
			count: 30,
			maxRank: 8000,
			filter: (o, w) => {
				// A true suffix-key word: removing the key leaves the base
				// word's own outline in the dictionary.
				if (strokeCount(o) !== 1 || !/[GSDZ]$/.test(o)) return false;
				const baseOutline = o.slice(0, -1).replace(/-$/, '');
				const baseWord = base[baseOutline];
				if (!baseWord) return false;
				const key = o.at(-1);
				if (key === 'G') return w === `${baseWord}ing` || w === `${baseWord.replace(/e$/, '')}ing`;
				if (key === 'D') return w === `${baseWord}d` || w === `${baseWord}ed`;
				return w === `${baseWord}s`; // S or Z
			}
		})
	)
]);

unit('Multisyllable words', [
	lesson(
		'splitting',
		'Two-stroke words: syllabic splitting',
		'Lapwing guide: writing multisyllable words',
		[
			'Longer words are written as one stroke per syllable, in sequence.',
			'Split after the vowel and give the consonant to the next stroke when it starts that syllable.',
			'Mis-stroke a syllable? Hit * to back up one stroke and redo it.'
		],
		pick({
			stage: stage5,
			count: 32,
			maxRank: 6000,
			filter: (o) => strokeCount(o) === 2 && !o.split('/').some((s) => s.startsWith('KWR'))
		})
	),
	lesson(
		'kwr-linker',
		'Vowel-first syllables: the KWR linker',
		'Lapwing guide: KWR as a syllable linker',
		[
			'A non-initial syllable that starts with a vowel gets KWR in front of it, so the stroke still begins with keys on the left bank.',
			'Example: "happen" = HAP/KWREPB — the second syllable "-en" is stroked KWREPB.'
		],
		pick({
			stage: stage5,
			count: 28,
			maxRank: 8000,
			filter: (o) => strokeCount(o) >= 2 && o.split('/').slice(1).some((s) => s.startsWith('KWR')),
			// don't let one linker (like /KWREU "-y") crowd out the rest
			diversify: (o) => o.split('/').find((s, i) => i > 0 && s.startsWith('KWR'))
		})
	),
	lesson(
		'three-strokes',
		'Longer words',
		'Lapwing guide: writing multisyllable words',
		[
			'Same rules, more syllables. Keep your rhythm steady: it is one clean stroke per syllable, not a race.',
			'Remember * backs up one stroke at a time.'
		],
		pick({
			stage: stage5,
			count: 26,
			maxRank: 9000,
			filter: (o) => strokeCount(o) === 3
		})
	)
]);

unit('Affixes & compounds', [
	lesson(
		'prefixes',
		'Prefix strokes',
		'Lapwing guide: prefixes and suffixes',
		[
			'Common prefixes get dedicated strokes that attach to the next word chunk, e.g. con-, com-, dis-, ex-, in-.',
			'Write the prefix stroke, then the rest of the word syllabically.'
		],
		pick({
			stage: stage5,
			count: 26,
			maxRank: 10000,
			minLen: 5,
			filter: (o, w) => {
				const strokes = o.split('/');
				if (strokes.length < 2) return false;
				const p = prefixStrokes.get(strokes[0]);
				return p !== undefined && w.startsWith(p);
			},
			note: (o) => `prefix stroke: ${o.split('/')[0]} = ${prefixStrokes.get(o.split('/')[0])}-`
		})
	),
	lesson(
		'suffix-strokes',
		'Suffix strokes',
		'Lapwing guide: prefixes and suffixes',
		[
			'Common suffixes also get dedicated strokes, e.g. -ly, -ment, -ness, -ful, -tion variants.',
			'Write the word, then the suffix stroke.'
		],
		pick({
			stage: stage5,
			count: 26,
			maxRank: 10000,
			minLen: 5,
			filter: (o, w) => {
				const strokes = o.split('/');
				if (strokes.length < 2) return false;
				const s = suffixStrokes.get(strokes[strokes.length - 1]);
				return s !== undefined && w.endsWith(s);
			},
			note: (o) => {
				const last = o.split('/').at(-1);
				return `suffix stroke: ${last} = -${suffixStrokes.get(last)}`;
			}
		})
	),
	lesson(
		'compounds',
		'Compound words',
		'Lapwing guide: compound words',
		[
			'Compound words are usually just both halves written back to back.',
			'If you know the two words, you already know the compound.'
		],
		(() => {
			const items = [];
			const seen = new Set();
			const cands = [];
			for (const [word, outlines] of outlinesByWord) {
				const r = rank.get(word);
				if (r === undefined || r > 12000 || word.length < 6 || BLOCKED.test(word)) continue;
				for (let i = 3; i <= word.length - 3; i++) {
					const w1 = word.slice(0, i);
					const w2 = word.slice(i);
					const r1 = rank.get(w1);
					const r2 = rank.get(w2);
					if (r1 === undefined || r1 > 4000 || r2 === undefined || r2 > 4000) continue;
					const o1 = outlinesByWord.get(w1);
					const o2 = outlinesByWord.get(w2);
					if (!o1 || !o2) continue;
					const joined = outlines.find((o) =>
						o1.some((a) => o2.some((b) => o === `${a}/${b}`))
					);
					if (joined) {
						cands.push([r, word, joined, `${w1} + ${w2}`]);
						break;
					}
				}
			}
			cands.sort((a, b) => a[0] - b[0]);
			for (const [, word, outline, note] of cands) {
				if (items.length >= 24 || seen.has(word) || usedWords.has(word)) continue;
				seen.add(word);
				usedWords.add(word);
				items.push({ text: word, outline, note });
			}
			return items;
		})()
	)
]);

unit('Real-world writing', [
	lesson(
		'briefs-1',
		'Starter briefs',
		'Lapwing guide: common briefs',
		[
			'Briefs are memorized shortcuts for the most frequent words — they ignore phonetics to save strokes.',
			'These briefs cover a huge share of everyday English. Drill them until they are reflex.'
		],
		validated(starterBriefs)
	),
	lesson(
		'briefs-2',
		'More briefs',
		'Lapwing guide: common briefs',
		[
			'A second round: the most frequent words whose Lapwing outline is a shortcut rather than a straight phonetic spelling.'
		],
		pick({
			stage: stage5,
			count: 32,
			maxRank: 1500,
			minLen: 2,
			filter: (o, w) => {
				if (strokeCount(o) !== 1) return false;
				// brief-ish: NOT how you'd write it phonetically under full vocab
				const phonetic = outlinesByWord
					.get(w)
					.filter((x) => x !== o && strokeCount(x) > 1);
				return phonetic.length > 0 || (parseStrokeMask(o) & MIDDLE_MASK & ~BIT.get('*')) === 0;
			}
		})
	),
	lesson(
		'star-conflicts',
		'Homophones & the asterisk',
		'Lapwing guide: conflict resolution',
		[
			'When two words would share a stroke, the less common one takes an asterisk.',
			'These pairs differ ONLY by the * key — read the prompt carefully before stroking.'
		],
		(() => {
			const items = [];
			const seen = new Set();
			for (const [, w1, o1, w2, o2] of starPairs) {
				if (items.length >= 28) break;
				if (seen.has(w1) || seen.has(w2)) continue;
				seen.add(w1);
				seen.add(w2);
				items.push({ text: w1, outline: o1, note: `vs. "${w2}" = ${o2}` });
				items.push({ text: w2, outline: o2, note: `vs. "${w1}" = ${o1}` });
			}
			return items;
		})()
	),
	lesson(
		'numbers-punctuation',
		'Numbers & punctuation',
		'Lapwing guide: numbers; punctuation',
		[
			'The number bar (#) turns letter keys into digits: #S = 1, #T- = 2, #P- = 3, #H = 4, #A = 5, #O = 0, #-F = 6, #-P = 7, #-L = 8, #-T = 9.',
			'Punctuation gets its own strokes: TP-PL = period · KW-BG = comma · H-F = question mark · TP-BG = exclamation · KPA = capitalize next word.'
		],
		[
			...[
				['1', '#S'], ['2', '#T'], ['3', '#P'], ['4', '#H'], ['5', '#A'],
				['0', '#O'], ['6', '#-F'], ['7', '#-P'], ['8', '#-L'], ['9', '#-T']
			].map(([text, outline]) => ({ text, outline })),
			...validated([
				{ text: 'period .', outline: 'TP-PL', expect: '{.}' },
				{ text: 'comma ,', outline: 'KW-BG', expect: '{,}' },
				{ text: 'question mark ?', outline: 'H-F', expect: '{?}' },
				{ text: 'exclamation !', outline: 'TP-BG', expect: '{!}' }
			]),
			...validated([{ text: 'capitalize next', outline: 'KPA' }], commands)
		]
	)
]);

// ---------- report + write ----------
let total = 0;
for (const u of units) {
	console.log(`\n== ${u.title}`);
	for (const l of u.lessons) {
		total += l.items.length;
		const sample = l.items.slice(0, 6).map((i) => `${i.text}=${i.outline}`).join(', ');
		console.log(`  ${l.id}: ${l.items.length} items — ${sample}${l.items.length > 6 ? ', …' : ''}`);
	}
}
console.log(`\nTotal: ${units.reduce((n, u) => n + u.lessons.length, 0)} lessons, ${total} items`);

writeFileSync('src/lib/lessons/curriculum.json', JSON.stringify({ units }, null, '\t') + '\n');
console.log('Wrote src/lib/lessons/curriculum.json');
