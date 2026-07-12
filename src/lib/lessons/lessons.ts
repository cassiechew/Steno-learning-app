import type { Lesson } from './types';

/**
 * Curriculum modeled on the Lapwing for Beginners guide. Lessons unlock in
 * order; each introduces a small set of keys or rules and drills them.
 *
 * Outlines follow lapwing-base conventions. The drill matches raw strokes
 * against these outlines (not dictionary translations), so alternate valid
 * outlines are not accepted — that is intentional while learning theory.
 */
export const lessons: Lesson[] = [
	{
		id: 'layout',
		title: 'Meet the keyboard',
		chapter: 'Lapwing ch. 2 — Steno basics',
		intro: [
			'A steno keyboard has a LEFT bank (initial consonants), four VOWEL keys under your thumbs, an asterisk, and a RIGHT bank (final consonants).',
			'Keys are always read in steno order: S T K P W H R — A O * E U — F R P B L G T S D Z.',
			'This drill just asks you to press each key on its own. Watch the diagram: it shows exactly which key to hit.'
		],
		items: [
			{ text: 'left S', outline: 'S' },
			{ text: 'left T', outline: 'T' },
			{ text: 'left K', outline: 'K' },
			{ text: 'left P', outline: 'P' },
			{ text: 'left W', outline: 'W' },
			{ text: 'left H', outline: 'H' },
			{ text: 'left R', outline: 'R' },
			{ text: 'vowel A', outline: 'A' },
			{ text: 'vowel O', outline: 'O' },
			{ text: 'asterisk', outline: '*' },
			{ text: 'vowel E', outline: 'E' },
			{ text: 'vowel U', outline: 'U' },
			{ text: 'right F', outline: '-F' },
			{ text: 'right R', outline: '-R' },
			{ text: 'right P', outline: '-P' },
			{ text: 'right B', outline: '-B' },
			{ text: 'right L', outline: '-L' },
			{ text: 'right G', outline: '-G' },
			{ text: 'right T', outline: '-T' },
			{ text: 'right S', outline: '-S' },
			{ text: 'right D', outline: '-D' },
			{ text: 'right Z', outline: '-Z' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'cvc-short-vowels',
		title: 'First words: short vowels',
		chapter: 'Lapwing ch. 3 — One-syllable words',
		intro: [
			'Words are stroked phonetically: initial consonant + vowel + final consonant, all pressed together as one chord.',
			'Short vowel sounds: A = "a" in cat, O = "o" in hot, E = "e" in pet, U = "u" in cut.',
			'The short "i" of "sit" has no key of its own — it is the two-key chord EU, pressed with one thumb.'
		],
		items: [
			{ text: 'cat', outline: 'KAT' },
			{ text: 'tap', outline: 'TAP' },
			{ text: 'sat', outline: 'SAT' },
			{ text: 'hat', outline: 'HAT' },
			{ text: 'rat', outline: 'RAT' },
			{ text: 'cab', outline: 'KAB' },
			{ text: 'pal', outline: 'PAL' },
			{ text: 'tag', outline: 'TAG' },
			{ text: 'car', outline: 'KAR' },
			{ text: 'pad', outline: 'PAD' },
			{ text: 'hot', outline: 'HOT' },
			{ text: 'top', outline: 'TOP' },
			{ text: 'hop', outline: 'HOP' },
			{ text: 'rot', outline: 'ROT' },
			{ text: 'pot', outline: 'POT' },
			{ text: 'pet', outline: 'PET' },
			{ text: 'set', outline: 'SET' },
			{ text: 'wet', outline: 'WET' },
			{ text: 'red', outline: 'RED' },
			{ text: 'web', outline: 'WEB' },
			{ text: 'cut', outline: 'KUT' },
			{ text: 'hut', outline: 'HUT' },
			{ text: 'pup', outline: 'PUP' },
			{ text: 'rub', outline: 'RUB' },
			{ text: 'hug', outline: 'HUG' },
			{ text: 'sit', outline: 'SEUT', note: 'Short "i" = EU' },
			{ text: 'tip', outline: 'TEUP', note: 'Short "i" = EU' },
			{ text: 'hit', outline: 'HEUT', note: 'Short "i" = EU' },
			{ text: 'kit', outline: 'KEUT', note: 'Short "i" = EU' },
			{ text: 'rip', outline: 'REUP', note: 'Short "i" = EU' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'long-vowels',
		title: 'Long vowels & diphthongs',
		chapter: 'Lapwing ch. 4 — Vowel chords',
		intro: [
			'Long vowels are two- and three-key thumb chords:',
			'AEU = long a (cape) · AOE = long e (heat) · AOEU = long i (site) · OE = long o (hope) · AOU = long u (cute) · AO = "oo" (soup)',
			'Diphthongs: AU = "aw" (saw) · OU = "ow" (how) · OEU = "oy" (toy)'
		],
		items: [
			{ text: 'pay', outline: 'PAEU' },
			{ text: 'say', outline: 'SAEU' },
			{ text: 'way', outline: 'WAEU' },
			{ text: 'rate', outline: 'RAEUT' },
			{ text: 'cape', outline: 'KAEUP' },
			{ text: 'tape', outline: 'TAEUP' },
			{ text: 'see', outline: 'SAOE' },
			{ text: 'key', outline: 'KAOE' },
			{ text: 'heat', outline: 'HAOET' },
			{ text: 'peat', outline: 'PAOET' },
			{ text: 'seep', outline: 'SAOEP' },
			{ text: 'pie', outline: 'PAOEU' },
			{ text: 'tie', outline: 'TAOEU' },
			{ text: 'site', outline: 'SAOEUT' },
			{ text: 'ripe', outline: 'RAOEUP' },
			{ text: 'kite', outline: 'KAOEUT' },
			{ text: 'toe', outline: 'TOE' },
			{ text: 'hope', outline: 'HOEP' },
			{ text: 'rope', outline: 'ROEP' },
			{ text: 'soap', outline: 'SOEP' },
			{ text: 'cute', outline: 'KAOUT' },
			{ text: 'cue', outline: 'KAOU' },
			{ text: 'soup', outline: 'SAOP' },
			{ text: 'root', outline: 'RAOT' },
			{ text: 'cool', outline: 'KAOL' },
			{ text: 'saw', outline: 'SAU' },
			{ text: 'raw', outline: 'RAU' },
			{ text: 'haul', outline: 'HAUL' },
			{ text: 'how', outline: 'HOU' },
			{ text: 'cow', outline: 'KOU' },
			{ text: 'out', outline: 'OUT' },
			{ text: 'pout', outline: 'POUT' },
			{ text: 'toy', outline: 'TOEU' },
			{ text: 'soy', outline: 'SOEU' },
			{ text: 'coil', outline: 'KOEUL' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'left-hand-chords',
		title: 'Left-hand consonant chords',
		chapter: 'Lapwing ch. 5 — Initial consonant chords',
		intro: [
			'Missing initial consonants are chords on the left bank:',
			'TK = d · PW = b · HR = l · TP = f · SR = v · TKPW = g · PH = m · TPH = n · KWR = y · SKWR = j',
			'And the "h-family" digraphs: KH = ch · SH = sh · TH = th'
		],
		items: [
			{ text: 'dad', outline: 'TKAD' },
			{ text: 'dot', outline: 'TKOT' },
			{ text: 'date', outline: 'TKAEUT' },
			{ text: 'deep', outline: 'TKAOEP' },
			{ text: 'bat', outline: 'PWAT' },
			{ text: 'bed', outline: 'PWED' },
			{ text: 'boat', outline: 'PWOET' },
			{ text: 'buy', outline: 'PWAOEU' },
			{ text: 'lap', outline: 'HRAP' },
			{ text: 'let', outline: 'HRET' },
			{ text: 'late', outline: 'HRAEUT' },
			{ text: 'low', outline: 'HROE' },
			{ text: 'fat', outline: 'TPAT' },
			{ text: 'fed', outline: 'TPED' },
			{ text: 'foe', outline: 'TPOE' },
			{ text: 'vat', outline: 'SRAT' },
			{ text: 'vet', outline: 'SRET' },
			{ text: 'vote', outline: 'SROET' },
			{ text: 'gap', outline: 'TKPWAP' },
			{ text: 'got', outline: 'TKPWOT' },
			{ text: 'gate', outline: 'TKPWAEUT' },
			{ text: 'map', outline: 'PHAP' },
			{ text: 'met', outline: 'PHET' },
			{ text: 'mode', outline: 'PHOED' },
			{ text: 'nap', outline: 'TPHAP' },
			{ text: 'net', outline: 'TPHET' },
			{ text: 'nod', outline: 'TPHOD' },
			{ text: 'yap', outline: 'KWRAP' },
			{ text: 'yet', outline: 'KWRET' },
			{ text: 'yell', outline: 'KWREL' },
			{ text: 'jab', outline: 'SKWRAB' },
			{ text: 'jet', outline: 'SKWRET' },
			{ text: 'jog', outline: 'SKWROG' },
			{ text: 'chat', outline: 'KHAT' },
			{ text: 'chip', outline: 'KHEUP' },
			{ text: 'shed', outline: 'SHED' },
			{ text: 'ship', outline: 'SHEUP' },
			{ text: 'shape', outline: 'SHAEUP' },
			{ text: 'thud', outline: 'THUD' },
			{ text: 'thaw', outline: 'THAU' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'right-hand-chords',
		title: 'Right-hand consonant chords',
		chapter: 'Lapwing ch. 6 — Final consonant chords',
		intro: [
			'Missing final consonants are chords on the right bank:',
			'-PB = n · -PL = m · -BG = k · -FP = ch · -RB = sh · -PBLG = j · -BGS = x · -PBG = ng',
			'These free up your left hand: now any consonant can start OR end a word.'
		],
		items: [
			{ text: 'pan', outline: 'PAPB' },
			{ text: 'ten', outline: 'TEPB' },
			{ text: 'rain', outline: 'RAEUPB' },
			{ text: 'line', outline: 'HRAOEUPB' },
			{ text: 'ram', outline: 'RAPL' },
			{ text: 'hem', outline: 'HEPL' },
			{ text: 'time', outline: 'TAOEUPL' },
			{ text: 'roam', outline: 'ROEPL' },
			{ text: 'pack', outline: 'PABG' },
			{ text: 'lick', outline: 'HREUBG' },
			{ text: 'lake', outline: 'HRAEUBG' },
			{ text: 'book', outline: 'PWAOBG' },
			{ text: 'batch', outline: 'PWAFP' },
			{ text: 'rich', outline: 'REUFP' },
			{ text: 'coach', outline: 'KOEFP' },
			{ text: 'cash', outline: 'KARB' },
			{ text: 'dish', outline: 'TKEURB' },
			{ text: 'leash', outline: 'HRAOERB' },
			{ text: 'badge', outline: 'PWAPBLG' },
			{ text: 'page', outline: 'PAEUPBLG' },
			{ text: 'ridge', outline: 'REUPBLG' },
			{ text: 'leaf', outline: 'HRAOEF' },
			{ text: 'safe', outline: 'SAEUF' },
			{ text: 'life', outline: 'HRAOEUF' },
			{ text: 'tax', outline: 'TABGS' },
			{ text: 'box', outline: 'PWOBGS' },
			{ text: 'six', outline: 'SEUBGS' },
			{ text: 'ring', outline: 'REUPBG' },
			{ text: 'song', outline: 'SOPBG' },
			{ text: 'king', outline: 'KEUPBG' },
			{ text: 'rent', outline: 'REPBT' },
			{ text: 'paint', outline: 'PAEUPBT' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'asterisk',
		title: 'The asterisk & fingerspelling',
		chapter: 'Lapwing ch. 7 — The asterisk key',
		intro: [
			'The asterisk alone (*) undoes your last stroke — you will use it constantly.',
			'* also modifies strokes: final *T = "-th" (bath = PWA*T).',
			'Fingerspelling writes single letters for names and odd words: the letter chord + *.'
		],
		items: [
			{ text: 'undo (asterisk alone)', outline: '*' },
			{ text: 'bath', outline: 'PWA*T', note: 'final *T = "th"' },
			{ text: 'math', outline: 'PHA*T', note: 'final *T = "th"' },
			{ text: 'path', outline: 'PA*T', note: 'final *T = "th"' },
			{ text: 'letter a', outline: 'A*' },
			{ text: 'letter b', outline: 'PW*' },
			{ text: 'letter c', outline: 'KR*' },
			{ text: 'letter d', outline: 'TK*' },
			{ text: 'letter e', outline: 'E*' },
			{ text: 'letter f', outline: 'TP*' },
			{ text: 'letter g', outline: 'TKPW*' },
			{ text: 'letter h', outline: 'H*' },
			{ text: 'letter i', outline: 'EU*' },
			{ text: 'letter j', outline: 'SKWR*' },
			{ text: 'letter k', outline: 'K*' },
			{ text: 'letter l', outline: 'HR*' },
			{ text: 'letter m', outline: 'PH*' },
			{ text: 'letter n', outline: 'TPH*' },
			{ text: 'letter o', outline: 'O*' },
			{ text: 'letter p', outline: 'P*' },
			{ text: 'letter q', outline: 'KW*' },
			{ text: 'letter r', outline: 'R*' },
			{ text: 'letter s', outline: 'S*' },
			{ text: 'letter t', outline: 'T*' },
			{ text: 'letter u', outline: 'U*' },
			{ text: 'letter v', outline: 'SR*' },
			{ text: 'letter w', outline: 'W*' },
			{ text: 'letter x', outline: 'KP*' },
			{ text: 'letter y', outline: 'KWR*' },
			{ text: 'letter z', outline: 'STKPW*' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'suffix-keys',
		title: 'Suffix keys: -G, -S, -D, -Z',
		chapter: 'Lapwing ch. 8 — Suffix keys',
		intro: [
			'The last four right-bank keys double as one-key suffixes added to the same stroke:',
			'-G = "-ing" · -S = plural/possessive "s" · -D = past tense "-ed" · -Z = "s" when -S is unreachable',
			'Steno order still applies: -S sits before -D, so a plural added to a word ending in D must use -Z instead ("pads" = PADZ, never PADS).'
		],
		items: [
			{ text: 'cats', outline: 'KATS' },
			{ text: 'taps', outline: 'TAPS' },
			{ text: 'hits', outline: 'HEUTS' },
			{ text: 'sheds', outline: 'SHEDZ', note: '-S is before -D in steno order, so plural after D uses -Z' },
			{ text: 'pads', outline: 'PADZ', note: 'same rule: D then Z' },
			{ text: 'cows', outline: 'KOUZ', note: 'after a vowel, use -Z' },
			{ text: 'toys', outline: 'TOEUZ', note: 'after a vowel, use -Z' },
			{ text: 'paying', outline: 'PAEUG' },
			{ text: 'saying', outline: 'SAEUG' },
			{ text: 'seeing', outline: 'SAOEG' },
			{ text: 'going', outline: 'TKPWOEG' },
			{ text: 'showed', outline: 'SHOED' },
			{ text: 'stayed', outline: 'STAEUD' },
			{ text: 'rained', outline: 'RAEUPBD' },
			{ text: 'packed', outline: 'PABGD' },
			{ text: 'timed', outline: 'TAOEUPLD' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'multisyllable',
		title: 'Two-syllable words',
		chapter: 'Lapwing ch. 10 — Writing multisyllable words',
		intro: [
			'Longer words are written as one stroke per syllable, in sequence.',
			'A syllable that is just a vowel gets stroked on its own: "away" = A/WAEU.',
			'Mis-stroke a syllable? Hit * to back up one stroke and redo it.'
		],
		items: [
			{ text: 'sunset', outline: 'SUPB/SET' },
			{ text: 'laptop', outline: 'HRAP/TOP' },
			{ text: 'hotdog', outline: 'HOT/TKOG' },
			{ text: 'teacup', outline: 'TAOE/KUP' },
			{ text: 'rainbow', outline: 'RAEUPB/PWOE' },
			{ text: 'napkin', outline: 'TPHAP/KEUPB' },
			{ text: 'away', outline: 'A/WAEU', note: 'initial vowel syllable stands alone' },
			{ text: 'ahead', outline: 'A/HED' },
			{ text: 'along', outline: 'A/HROPBG' },
			{ text: 'avoid', outline: 'A/SROEUD' },
			{ text: 'depend', outline: 'TKE/PEPBD' },
			{ text: 'combine', outline: 'KOPL/PWAOEUPB' },
			{ text: 'window', outline: 'WEUPB/TKOE' },
			{ text: 'happen', outline: 'HAP/EPB' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'briefs-1',
		title: 'Starter briefs',
		chapter: 'Lapwing ch. 11 — Common briefs',
		intro: [
			'Briefs are memorized shortcuts for the most frequent words — they ignore phonetics to save strokes.',
			'These ~25 briefs cover a huge share of everyday English. Drill them until they are reflex.'
		],
		items: [
			{ text: 'the', outline: '-T' },
			{ text: 'of', outline: '-F' },
			{ text: 'and', outline: 'SKP' },
			{ text: 'I', outline: 'EU' },
			{ text: 'you', outline: 'U' },
			{ text: 'it', outline: 'T' },
			{ text: 'is', outline: 'S' },
			{ text: 'are', outline: 'R' },
			{ text: 'with', outline: 'W' },
			{ text: 'can', outline: 'K' },
			{ text: 'will', outline: 'HR' },
			{ text: 'have', outline: 'SR' },
			{ text: 'be', outline: '-B' },
			{ text: 'this', outline: 'TH' },
			{ text: 'that', outline: 'THA' },
			{ text: 'was', outline: 'WAS' },
			{ text: 'for', outline: 'TPOR' },
			{ text: 'on', outline: 'OPB' },
			{ text: 'at', outline: 'AT' },
			{ text: 'we', outline: 'WE' },
			{ text: 'he', outline: 'E' },
			{ text: 'she', outline: 'SHE' },
			{ text: 'do', outline: 'TKO' },
			{ text: 'go', outline: 'TKPWOE' },
			{ text: 'so', outline: 'SO' },
			{ text: 'not', outline: 'TPHOT' }
		],
		passAccuracy: 0.9
	},
	{
		id: 'numbers-punctuation',
		title: 'Numbers & punctuation',
		chapter: 'Lapwing ch. 13 — Numbers and punctuation',
		intro: [
			'The number bar (#) turns letter keys into digits: #S = 1, #T- = 2, #P- = 3, #H = 4, #A = 5, #O = 0, #-F = 6, #-P = 7, #-L = 8, #-T = 9.',
			'Punctuation gets its own strokes: TP-PL = period · KW-BG = comma · H-F = question mark · TP-BG = exclamation · KPA = capitalize next word.'
		],
		items: [
			{ text: '1', outline: '#S' },
			{ text: '2', outline: '#T' },
			{ text: '3', outline: '#P' },
			{ text: '4', outline: '#H' },
			{ text: '5', outline: '#A' },
			{ text: '0', outline: '#O' },
			{ text: '6', outline: '#-F' },
			{ text: '7', outline: '#-P' },
			{ text: '8', outline: '#-L' },
			{ text: '9', outline: '#-T' },
			{ text: 'period .', outline: 'TP-PL' },
			{ text: 'comma ,', outline: 'KW-BG' },
			{ text: 'question mark ?', outline: 'H-F' },
			{ text: 'exclamation !', outline: 'TP-BG' },
			{ text: 'capitalize next', outline: 'KPA' }
		],
		passAccuracy: 0.9
	}
];

export function getLesson(id: string): Lesson | undefined {
	return lessons.find((l) => l.id === id);
}

/** Index of a lesson in the unlock order, or -1. */
export function lessonIndex(id: string): number {
	return lessons.findIndex((l) => l.id === id);
}
