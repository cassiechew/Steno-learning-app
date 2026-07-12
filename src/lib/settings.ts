import { browser } from '$app/environment';

export interface AppSettings {
	inputSource: 'keyboard' | 'plover';
	ploverUrl: string;
	storage: 'local' | 'sqlite';
}

const SETTINGS_KEY = 'steno-settings-v1';

export const defaultSettings: AppSettings = {
	inputSource: 'keyboard',
	ploverUrl: 'ws://localhost:8086/websocket',
	storage: 'local'
};

export function loadSettings(): AppSettings {
	if (!browser) return { ...defaultSettings };
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return { ...defaultSettings };
		return { ...defaultSettings, ...JSON.parse(raw) };
	} catch {
		return { ...defaultSettings };
	}
}

export function saveSettings(settings: AppSettings): void {
	if (!browser) return;
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
