<script lang="ts">
	import { onMount } from 'svelte';
	import { loadSettings, saveSettings, type AppSettings } from '$lib/settings';
	import { GeminiSerialSource } from '$lib/steno/sources';
	import { progress } from '$lib/progress/progress.svelte';

	let settings = $state<AppSettings>(loadSettings());
	let ploverTest = $state<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	let geminiTest = $state<'idle' | 'unsupported' | 'ok' | 'fail'>('idle');
	let storageMsg = $state('');

	onMount(() => {
		settings = loadSettings();
	});

	async function connectGemini() {
		if (!GeminiSerialSource.supported()) {
			geminiTest = 'unsupported';
			return;
		}
		const source = new GeminiSerialSource();
		source.onStatus = (s) => {
			if (s === 'open') geminiTest = 'ok';
			else if (s === 'error' || s === 'needs-permission') geminiTest = 'fail';
		};
		await source.requestPort();
		// Close again so the lesson page can claim the port; the permission
		// grant is what we were after and it persists.
		source.stop();
	}

	function persist() {
		saveSettings($state.snapshot(settings));
	}

	async function setStorage(kind: 'local' | 'sqlite') {
		settings.storage = kind;
		persist();
		storageMsg = '';
		await progress.useBackend(kind, true);
		if (progress.backend !== kind) {
			storageMsg =
				'SQLite backend unreachable (needs the app running with its Node server) — staying on browser storage.';
			settings.storage = 'local';
			persist();
		} else {
			storageMsg = kind === 'sqlite' ? 'Progress now saved to SQLite on the server.' : 'Progress now saved in this browser.';
		}
	}

	function testPlover() {
		ploverTest = 'testing';
		try {
			const ws = new WebSocket(settings.ploverUrl);
			const timer = setTimeout(() => {
				ws.close();
				if (ploverTest === 'testing') ploverTest = 'fail';
			}, 3000);
			ws.onopen = () => {
				clearTimeout(timer);
				ploverTest = 'ok';
				ws.close();
			};
			ws.onerror = () => {
				clearTimeout(timer);
				ploverTest = 'fail';
			};
		} catch {
			ploverTest = 'fail';
		}
	}

	async function resetProgress() {
		if (!confirm('Reset ALL lesson progress? This cannot be undone.')) return;
		await progress.resetAll();
	}
</script>

<svelte:head>
	<title>Settings · Lapwing Trainer</title>
</svelte:head>

<h1>Settings</h1>

<section>
	<h2>Stroke input</h2>
	<label>
		<input
			type="radio"
			name="input"
			checked={settings.inputSource === 'keyboard'}
			onchange={() => {
				settings.inputSource = 'keyboard';
				persist();
			}}
		/>
		<span>
			<strong>Keyboard as steno machine</strong> — no setup: the app reads chords straight from
			your keyboard using Plover's qwerty layout (Q/A = S, W = T, … ). Needs a keyboard with
			decent key rollover for big chords.
		</span>
	</label>
	<label>
		<input
			type="radio"
			name="input"
			checked={settings.inputSource === 'gemini'}
			onchange={() => {
				settings.inputSource = 'gemini';
				persist();
			}}
		/>
		<span>
			<strong>Steno writer (Gemini PR over USB)</strong> — plug in The Uni or any Gemini PR
			machine and the app reads strokes straight off the serial port. No Plover needed.
			Chrome/Edge only (uses the Web Serial API); the keyboard must be in Gemini PR mode, and
			Plover must be closed (it would hold the port).
		</span>
	</label>
	{#if settings.inputSource === 'gemini'}
		<div class="plover-config">
			<button onclick={connectGemini}>Connect keyboard</button>
			{#if geminiTest === 'ok'}<span class="ok">Connected ✅ — the drill pages will now find it automatically</span>{/if}
			{#if geminiTest === 'fail'}<span class="fail">No port selected / could not open ❌</span>{/if}
			{#if geminiTest === 'unsupported'}<span class="fail">
					This browser has no Web Serial API — use Chrome or Edge, or switch to the Plover
					WebSocket option.
				</span>{/if}
		</div>
	{/if}
	<label>
		<input
			type="radio"
			name="input"
			checked={settings.inputSource === 'plover'}
			onchange={() => {
				settings.inputSource = 'plover';
				persist();
			}}
		/>
		<span>
			<strong>Plover (WebSocket)</strong> — real strokes from Plover via the
			<code>plover-websocket-server</code> plugin. Use this if you want Plover running at the
			same time (its key handling, dictionaries, etc.). Enable the plugin in Plover, then set
			the URL below.
		</span>
	</label>
	{#if settings.inputSource === 'plover'}
		<div class="plover-config">
			<input
				type="text"
				bind:value={settings.ploverUrl}
				onchange={persist}
				placeholder="ws://localhost:8086/websocket"
			/>
			<button onclick={testPlover} disabled={ploverTest === 'testing'}>Test connection</button>
			{#if ploverTest === 'ok'}<span class="ok">Connected ✅</span>{/if}
			{#if ploverTest === 'fail'}<span class="fail">Could not connect ❌</span>{/if}
		</div>
	{/if}
</section>

<section>
	<h2>Progress storage</h2>
	<label>
		<input
			type="radio"
			name="storage"
			checked={settings.storage === 'local'}
			onchange={() => setStorage('local')}
		/>
		<span><strong>Browser storage</strong> — zero setup, lives in this browser only.</span>
	</label>
	<label>
		<input
			type="radio"
			name="storage"
			checked={settings.storage === 'sqlite'}
			onchange={() => setStorage('sqlite')}
		/>
		<span>
			<strong>SQLite</strong> — saved server-side in <code>data/progress.db</code>; survives
			cleared browser data and is shared across browsers. Requires running the app with its Node
			server (the default <code>npm run dev</code> / <code>node build</code> setups).
		</span>
	</label>
	{#if storageMsg}<p class="msg">{storageMsg}</p>{/if}
	{#if progress.backendError}<p class="fail">Last storage error: {progress.backendError}</p>{/if}
</section>

<section>
	<h2>Danger zone</h2>
	<button class="danger" onclick={resetProgress}>Reset all progress</button>
</section>

<style>
	h1 {
		font-size: 1.4rem;
	}
	section {
		background: #1e212b;
		border: 1px solid #2c303d;
		border-radius: 0.6rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
	}
	h2 {
		font-size: 1rem;
		margin-top: 0;
	}
	label {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		margin-bottom: 0.75rem;
		cursor: pointer;
		max-width: 44rem;
	}
	label span {
		font-size: 0.9rem;
		color: #b8bdcc;
	}
	input[type='radio'] {
		margin-top: 0.3rem;
	}
	.plover-config {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
		margin-left: 1.6rem;
	}
	input[type='text'] {
		background: #14161d;
		border: 1px solid #3c404d;
		color: #d8dce8;
		border-radius: 0.4rem;
		padding: 0.45rem 0.6rem;
		font-family: ui-monospace, monospace;
		font-size: 0.85rem;
		min-width: 18rem;
	}
	button {
		background: #2c303d;
		color: #d8dce8;
		border: 1px solid #3c404d;
		border-radius: 0.4rem;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		font-size: 0.85rem;
	}
	button.danger {
		background: #47202a;
		border-color: #7a3040;
		color: #f0a5b0;
	}
	.ok {
		color: #7fd08f;
		font-size: 0.85rem;
	}
	.fail {
		color: #e08891;
		font-size: 0.85rem;
	}
	.msg {
		color: #9aa1b5;
		font-size: 0.85rem;
	}
	code {
		background: #14161d;
		padding: 0.1rem 0.3rem;
		border-radius: 0.3rem;
		font-size: 0.85em;
	}
</style>
