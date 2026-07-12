/**
 * Stroke input sources. Both emit raw strokes (key sets), never translated
 * text — the app does its own matching so it can give stroke-level feedback.
 */

import { parseStroke, type StenoKey, type Stroke } from './keys';

export type StrokeListener = (stroke: Stroke) => void;
export type KeysDownListener = (down: Stroke) => void;

export interface StrokeSource {
	start(): void;
	stop(): void;
	onStroke(fn: StrokeListener): void;
	/** Live keys currently held, for keyboard-diagram feedback. Optional. */
	onKeysDown?(fn: KeysDownListener): void;
}

/**
 * Plover's default qwerty-to-steno mapping, keyed by KeyboardEvent.code so it
 * is independent of the user's OS keyboard layout.
 */
export const QWERTY_STENO_MAP: Record<string, StenoKey> = {
	Digit1: '#',
	Digit2: '#',
	Digit3: '#',
	Digit4: '#',
	Digit5: '#',
	Digit6: '#',
	Digit7: '#',
	Digit8: '#',
	Digit9: '#',
	Digit0: '#',
	Minus: '#',
	KeyQ: 'S-',
	KeyA: 'S-',
	KeyW: 'T-',
	KeyS: 'K-',
	KeyE: 'P-',
	KeyD: 'W-',
	KeyR: 'H-',
	KeyF: 'R-',
	KeyC: 'A-',
	KeyV: 'O-',
	KeyT: '*',
	KeyG: '*',
	KeyY: '*',
	KeyH: '*',
	KeyN: '-E',
	KeyM: '-U',
	KeyU: '-F',
	KeyJ: '-R',
	KeyI: '-P',
	KeyK: '-B',
	KeyO: '-L',
	KeyL: '-G',
	KeyP: '-T',
	Semicolon: '-S',
	BracketLeft: '-D',
	Quote: '-Z'
};

/**
 * Captures chords from a regular keyboard: keys accumulate while any mapped
 * key is held, and the stroke is emitted when the last one is released —
 * exactly how a steno machine registers a chord. Needs a keyboard with
 * enough key rollover for larger chords (most mechanical boards are fine).
 */
export class KeyboardStrokeSource implements StrokeSource {
	private down: Stroke = new Set();
	private accumulated: Stroke = new Set();
	private strokeListeners: StrokeListener[] = [];
	private keysDownListeners: KeysDownListener[] = [];
	private target: EventTarget;

	constructor(target: EventTarget = window) {
		this.target = target;
	}

	private handleKeyDown = (e: Event) => {
		const ev = e as KeyboardEvent;
		const key = QWERTY_STENO_MAP[ev.code];
		if (!key) return;
		ev.preventDefault();
		if (ev.repeat) return;
		this.down.add(key);
		this.accumulated.add(key);
		this.emitKeysDown();
	};

	private handleKeyUp = (e: Event) => {
		const ev = e as KeyboardEvent;
		const key = QWERTY_STENO_MAP[ev.code];
		if (!key) return;
		ev.preventDefault();
		this.down.delete(key);
		this.emitKeysDown();
		if (this.down.size === 0 && this.accumulated.size > 0) {
			const stroke = this.accumulated;
			this.accumulated = new Set();
			for (const fn of this.strokeListeners) fn(new Set(stroke));
		}
	};

	private handleBlur = () => {
		this.down = new Set();
		this.accumulated = new Set();
		this.emitKeysDown();
	};

	private emitKeysDown() {
		for (const fn of this.keysDownListeners) fn(new Set(this.down));
	}

	start() {
		this.target.addEventListener('keydown', this.handleKeyDown);
		this.target.addEventListener('keyup', this.handleKeyUp);
		this.target.addEventListener('blur', this.handleBlur);
	}

	stop() {
		this.target.removeEventListener('keydown', this.handleKeyDown);
		this.target.removeEventListener('keyup', this.handleKeyUp);
		this.target.removeEventListener('blur', this.handleBlur);
		this.handleBlur();
	}

	onStroke(fn: StrokeListener) {
		this.strokeListeners.push(fn);
	}

	onKeysDown(fn: KeysDownListener) {
		this.keysDownListeners.push(fn);
	}
}

/** Normalize key names Plover plugins send (e.g. "S-", "A", "-B", "*"). */
function ploverKeyToStenoKey(raw: string): StenoKey | null {
	if (raw === '#' || raw.startsWith('#')) return '#';
	if (raw === '*') return '*';
	const candidates: string[] = [raw];
	if (!raw.includes('-')) candidates.push(`${raw}-`, `-${raw}`);
	for (const c of candidates) {
		try {
			const parsed = parseStroke(c);
			if (parsed.size === 1) return [...parsed][0];
		} catch {
			// fall through to next candidate
		}
	}
	return null;
}

/**
 * Receives strokes from Plover via a WebSocket plugin
 * (e.g. plover-websocket-server / plover-engine-server, default
 * ws://localhost:8086/websocket). Accepts both `stroked` key-list payloads
 * and rtfcre string payloads so either plugin flavor works.
 */
export class PloverWebSocketSource implements StrokeSource {
	private url: string;
	private ws: WebSocket | null = null;
	private strokeListeners: StrokeListener[] = [];
	private stopped = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	onStatus: ((status: 'connecting' | 'open' | 'closed' | 'error') => void) | null = null;

	constructor(url: string) {
		this.url = url;
	}

	private connect() {
		this.onStatus?.('connecting');
		try {
			this.ws = new WebSocket(this.url);
		} catch {
			this.onStatus?.('error');
			this.scheduleReconnect();
			return;
		}
		this.ws.onopen = () => this.onStatus?.('open');
		this.ws.onmessage = (ev) => this.handleMessage(ev.data);
		this.ws.onerror = () => this.onStatus?.('error');
		this.ws.onclose = () => {
			this.onStatus?.('closed');
			this.scheduleReconnect();
		};
	}

	private scheduleReconnect() {
		if (this.stopped || this.reconnectTimer) return;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			if (!this.stopped) this.connect();
		}, 2000);
	}

	private handleMessage(data: unknown) {
		if (typeof data !== 'string') return;
		let msg: unknown;
		try {
			msg = JSON.parse(data);
		} catch {
			return;
		}
		if (typeof msg !== 'object' || msg === null) return;
		const stroked = (msg as Record<string, unknown>).stroked;
		let stroke: Stroke | null = null;
		if (Array.isArray(stroked)) {
			stroke = new Set();
			for (const raw of stroked) {
				if (typeof raw !== 'string') continue;
				const key = ploverKeyToStenoKey(raw);
				if (key) stroke.add(key);
			}
		} else if (typeof stroked === 'string') {
			try {
				stroke = parseStroke(stroked);
			} catch {
				stroke = null;
			}
		}
		if (stroke && stroke.size > 0) {
			for (const fn of this.strokeListeners) fn(stroke);
		}
	}

	start() {
		this.stopped = false;
		this.connect();
	}

	stop() {
		this.stopped = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.ws?.close();
		this.ws = null;
	}

	onStroke(fn: StrokeListener) {
		this.strokeListeners.push(fn);
	}
}
