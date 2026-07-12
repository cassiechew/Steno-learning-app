/**
 * Minimal Web Serial API declarations (Chromium-only API, not yet in
 * TypeScript's DOM lib). Just the surface GeminiSerialSource uses.
 */
interface SerialPort {
	readonly readable: ReadableStream<Uint8Array> | null;
	open(options: { baudRate: number }): Promise<void>;
	close(): Promise<void>;
}

interface Serial {
	getPorts(): Promise<SerialPort[]>;
	requestPort(options?: { filters?: { usbVendorId?: number; usbProductId?: number }[] }): Promise<SerialPort>;
}

interface Navigator {
	readonly serial: Serial;
}
