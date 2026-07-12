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

/**
 * Gemini PR packet layout (as used by The Uni, Javelin/QMK boards, and most
 * hobbyist writers): 6 bytes per stroke, the first byte has its MSB set, and
 * each byte's low 7 bits map to keys, bit 0x40 first. Mirrors Plover's chart.
 */
const GEMINI_KEY_CHART: (StenoKey | null)[][] = [
	[null, '#', '#', '#', '#', '#', '#'], // Fn, #1–#6
	['S-', 'S-', 'T-', 'K-', 'P-', 'W-', 'H-'], // S1, S2, T-, K-, P-, W-, H-
	['R-', 'A-', 'O-', '*', '*', null, null], // R-, A, O, *1, *2, res, res
	[null, '*', '*', '-E', '-U', '-F', '-R'], // pwr, *3, *4, E, U, -F, -R
	['-P', '-B', '-L', '-G', '-T', '-S', '-D'],
	['#', '#', '#', '#', '#', '#', '-Z'] // #7–#C, -Z
];

/** Decode one 6-byte Gemini PR packet into a stroke. */
export function decodeGeminiPacket(packet: Uint8Array): Stroke {
	const stroke: Stroke = new Set();
	for (let i = 0; i < 6; i++) {
		const byte = packet[i] ?? 0;
		for (let j = 0; j < 7; j++) {
			if (byte & (0x40 >> j)) {
				const key = GEMINI_KEY_CHART[i][j];
				if (key) stroke.add(key);
			}
		}
	}
	return stroke;
}

export type GeminiStatus =
	| 'unsupported'
	| 'needs-permission'
	| 'connecting'
	| 'open'
	| 'closed'
	| 'error';

/**
 * Reads strokes straight from a Gemini PR writer over the Web Serial API —
 * no Plover needed. Chromium-only (Chrome/Edge); the first connection needs
 * a user gesture to grant the port, after which it reconnects silently.
 */
export class GeminiSerialSource implements StrokeSource {
	private port: SerialPort | null = null;
	private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
	private strokeListeners: StrokeListener[] = [];
	private stopped = false;
	onStatus: ((status: GeminiStatus) => void) | null = null;

	static supported(): boolean {
		return typeof navigator !== 'undefined' && 'serial' in navigator;
	}

	async start() {
		this.stopped = false;
		if (!GeminiSerialSource.supported()) {
			this.onStatus?.('unsupported');
			return;
		}
		const ports = await navigator.serial.getPorts();
		if (ports.length === 0) {
			this.onStatus?.('needs-permission');
			return;
		}
		await this.connectTo(ports[0]);
	}

	/** Prompt for the port — must be called from a click handler. */
	async requestPort() {
		if (!GeminiSerialSource.supported()) {
			this.onStatus?.('unsupported');
			return;
		}
		try {
			const port = await navigator.serial.requestPort();
			await this.connectTo(port);
		} catch {
			// user dismissed the picker
			this.onStatus?.('needs-permission');
		}
	}

	private async connectTo(port: SerialPort) {
		this.onStatus?.('connecting');
		try {
			await port.open({ baudRate: 9600 });
		} catch {
			this.onStatus?.('error');
			return;
		}
		this.port = port;
		this.onStatus?.('open');
		void this.readLoop();
	}

	private async readLoop() {
		let packet: number[] = [];
		while (!this.stopped && this.port?.readable) {
			this.reader = this.port.readable.getReader();
			try {
				for (;;) {
					const { value, done } = await this.reader.read();
					if (done) break;
					for (const byte of value ?? []) {
						if (byte & 0x80) {
							packet = [byte]; // header byte starts (and is part of) a packet
						} else if (packet.length > 0) {
							packet.push(byte);
						} // else: desynced mid-packet byte — wait for next header
						if (packet.length === 6) {
							const stroke = decodeGeminiPacket(Uint8Array.from(packet));
							packet = [];
							if (stroke.size > 0) for (const fn of this.strokeListeners) fn(stroke);
						}
					}
				}
			} catch {
				// transient read error (e.g. cable unplugged); loop re-checks readable
			} finally {
				this.reader?.releaseLock();
				this.reader = null;
			}
		}
		if (!this.stopped) this.onStatus?.('closed');
	}

	stop() {
		this.stopped = true;
		const reader = this.reader;
		const port = this.port;
		this.port = null;
		void (async () => {
			try {
				await reader?.cancel();
			} catch {
				// already released
			}
			try {
				await port?.close();
			} catch {
				// already closed
			}
		})();
	}

	onStroke(fn: StrokeListener) {
		this.strokeListeners.push(fn);
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
