<script lang="ts">
	import { onMount } from 'svelte';
	import StenoKeyboard from '$lib/components/StenoKeyboard.svelte';
	import { formatStroke, parseOutline, strokesEqual, type Stroke } from '$lib/steno/keys';
	import {
		KeyboardStrokeSource,
		PloverWebSocketSource,
		type StrokeSource
	} from '$lib/steno/sources';
	import { loadSettings } from '$lib/settings';
	import { progress } from '$lib/progress/progress.svelte';
	import { lessons, lessonIndex } from '$lib/lessons/lessons';

	let { data } = $props();
	const lesson = $derived(data.lesson);

	type Phase = 'intro' | 'drill' | 'done';
	let phase = $state<Phase>('intro');
	let itemIndex = $state(0);
	let strokeIndex = $state(0);
	let erredThisItem = $state(false);
	let firstTryCount = $state(0);
	let doneCount = $state(0);
	let keysDown = $state<Stroke>(new Set());
	let lastWrong = $state<Stroke>(new Set());
	let lastWrongNotation = $state('');
	let flash = $state<'ok' | 'bad' | null>(null);
	let ploverStatus = $state<'connecting' | 'open' | 'closed' | 'error' | null>(null);
	let inputSource = $state<'keyboard' | 'plover'>('keyboard');

	let source: StrokeSource | null = null;
	let flashTimer: ReturnType<typeof setTimeout> | null = null;

	const item = $derived(lesson.items[itemIndex]);
	const expectedStrokes = $derived(item ? parseOutline(item.outline) : []);
	const expectedStroke = $derived(expectedStrokes[strokeIndex] ?? new Set());

	/**
	 * Hints fade with mastery: new chords get the full diagram, familiar
	 * ones just the outline, mastered ones only the word. Any miss reveals
	 * the diagram again.
	 */
	const hintLevel = $derived.by(() => {
		if (!item) return 0;
		if (erredThisItem) return 0;
		const stat = progress.itemStat(item.outline);
		if (stat.correct < 2) return 0; // diagram + outline
		if (stat.correct < 5) return 1; // outline only
		return 2; // word only
	});

	function setFlash(kind: 'ok' | 'bad') {
		flash = kind;
		if (flashTimer) clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flash = null), 350);
	}

	function handleStroke(stroke: Stroke) {
		if (phase !== 'drill' || !item) return;

		if (strokesEqual(stroke, expectedStroke)) {
			lastWrong = new Set();
			lastWrongNotation = '';
			if (strokeIndex + 1 < expectedStrokes.length) {
				strokeIndex += 1;
				return;
			}
			// Item complete.
			progress.recordItem(item.outline, !erredThisItem);
			if (!erredThisItem) firstTryCount += 1;
			doneCount += 1;
			setFlash('ok');
			nextItem();
			return;
		}

		// Asterisk alone = undo previous stroke of a multi-stroke outline.
		if (stroke.size === 1 && stroke.has('*') && strokeIndex > 0) {
			strokeIndex -= 1;
			return;
		}

		erredThisItem = true;
		lastWrong = stroke;
		lastWrongNotation = formatStroke(stroke);
		setFlash('bad');
	}

	function nextItem() {
		strokeIndex = 0;
		erredThisItem = false;
		if (itemIndex + 1 < lesson.items.length) {
			itemIndex += 1;
		} else {
			finish();
		}
	}

	function finish() {
		phase = 'done';
		progress.recordLessonRun(lesson.id, accuracy(), lesson.passAccuracy);
	}

	function accuracy(): number {
		return doneCount === 0 ? 0 : firstTryCount / doneCount;
	}

	function start() {
		itemIndex = 0;
		strokeIndex = 0;
		erredThisItem = false;
		firstTryCount = 0;
		doneCount = 0;
		lastWrong = new Set();
		lastWrongNotation = '';
		phase = 'drill';
	}

	const passed = $derived(
		phase === 'done' && doneCount > 0 && firstTryCount / doneCount >= lesson.passAccuracy
	);
	const nextLesson = $derived.by(() => {
		const idx = lessonIndex(lesson.id);
		return idx >= 0 && idx + 1 < lessons.length ? lessons[idx + 1] : null;
	});

	// Reset the drill when navigating between lessons (component is reused).
	let currentLessonId = $state('');
	$effect(() => {
		if (lesson.id !== currentLessonId) {
			currentLessonId = lesson.id;
			phase = 'intro';
			itemIndex = 0;
			strokeIndex = 0;
			erredThisItem = false;
			firstTryCount = 0;
			doneCount = 0;
			lastWrong = new Set();
			lastWrongNotation = '';
		}
	});

	onMount(() => {
		const settings = loadSettings();
		inputSource = settings.inputSource;
		if (settings.inputSource === 'plover') {
			const plover = new PloverWebSocketSource(settings.ploverUrl);
			plover.onStatus = (s) => (ploverStatus = s);
			source = plover;
		} else {
			source = new KeyboardStrokeSource(window);
			source.onKeysDown?.((down) => (keysDown = down));
		}
		source.onStroke(handleStroke);
		source.start();
		return () => source?.stop();
	});
</script>

<svelte:head>
	<title>{lesson.title} · Lapwing Trainer</title>
</svelte:head>

<a href="/" class="back">← All lessons</a>

{#if phase === 'intro'}
	<h1>{lesson.title}</h1>
	<p class="chapter">{lesson.chapter}</p>
	{#each lesson.intro as para (para)}
		<p class="intro">{para}</p>
	{/each}
	{#if inputSource === 'keyboard'}
		<p class="note">
			Input: <strong>keyboard as steno machine</strong> — home row and above act as steno keys
			(Plover's qwerty layout). Press keys together, release together. Change in
			<a href="/settings">settings</a>.
		</p>
	{:else}
		<p class="note">
			Input: <strong>Plover WebSocket</strong>
			{#if ploverStatus === 'open'}· connected ✅{:else}· {ploverStatus ?? 'connecting'}…
				make sure Plover is running with the websocket plugin enabled.{/if}
		</p>
	{/if}
	<button class="primary" onclick={start}>Start drill ({lesson.items.length} items)</button>
{:else if phase === 'drill' && item}
	<div class="drill" class:flash-ok={flash === 'ok'} class:flash-bad={flash === 'bad'}>
		<div class="progressbar">
			<div class="fill" style="width: {(itemIndex / lesson.items.length) * 100}%"></div>
		</div>
		<div class="counts">
			{itemIndex + 1} / {lesson.items.length}
			· first-try {doneCount === 0 ? 100 : Math.round((firstTryCount / doneCount) * 100)}%
		</div>

		<div class="prompt">{item.text}</div>

		{#if expectedStrokes.length > 1}
			<div class="strokes">
				{#each expectedStrokes as s, i (i)}
					<span class="stroke-dot" class:done={i < strokeIndex} class:current={i === strokeIndex}
					></span>
				{/each}
				<span class="stroke-count">stroke {strokeIndex + 1} of {expectedStrokes.length}</span>
			</div>
		{/if}

		{#if hintLevel <= 1}
			<div class="outline">{item.outline}</div>
		{/if}
		{#if item.note && hintLevel === 0}
			<div class="itemnote">{item.note}</div>
		{/if}

		{#if lastWrongNotation}
			<div class="wrongmsg">
				You stroked <code>{lastWrongNotation}</code> — green keys were right, red were extra,
				yellow were missing.
			</div>
		{/if}

		<StenoKeyboard
			expected={expectedStroke}
			down={keysDown}
			wrong={lastWrong}
			showExpected={hintLevel === 0}
		/>
	</div>
{:else if phase === 'done'}
	<h1>{passed ? '🎉 Lesson passed!' : 'Almost there'}</h1>
	<p class="result">
		First-try accuracy: <strong>{Math.round(accuracy() * 100)}%</strong>
		(target {Math.round(lesson.passAccuracy * 100)}%)
	</p>
	{#if !passed}
		<p class="note">
			Accuracy before speed — run it again and let the diagram guide you. Misses are normal;
			they just mean the chord is not reflex yet.
		</p>
	{/if}
	<div class="actions">
		<button class="primary" onclick={start}>Run again</button>
		{#if passed && nextLesson}
			<a class="button" href="/lesson/{nextLesson.id}">Next: {nextLesson.title} →</a>
		{/if}
		<a class="button ghost" href="/">All lessons</a>
	</div>
{/if}

<style>
	.back {
		font-size: 0.85rem;
		text-decoration: none;
		color: #8b92a7;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0.75rem 0 0.25rem;
	}
	.chapter {
		color: #8b92a7;
		font-size: 0.85rem;
		margin-top: 0;
	}
	.intro {
		max-width: 44rem;
	}
	.note {
		color: #9aa1b5;
		font-size: 0.9rem;
		max-width: 44rem;
	}
	.drill {
		margin-top: 1.5rem;
		border-radius: 0.75rem;
		padding: 1rem;
		transition: box-shadow 150ms;
	}
	.flash-ok {
		box-shadow: 0 0 0 2px #3d8f52;
	}
	.flash-bad {
		box-shadow: 0 0 0 2px #b8434f;
	}
	.progressbar {
		height: 0.35rem;
		background: #262a35;
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: #4f8ff0;
		transition: width 200ms;
	}
	.counts {
		font-size: 0.8rem;
		color: #8b92a7;
		margin: 0.4rem 0 1.5rem;
	}
	.prompt {
		text-align: center;
		font-size: 2.2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.outline {
		text-align: center;
		font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
		font-size: 1.2rem;
		color: #7fb0f5;
		letter-spacing: 0.1em;
		margin-bottom: 0.5rem;
	}
	.itemnote {
		text-align: center;
		font-size: 0.85rem;
		color: #c9b458;
		margin-bottom: 0.5rem;
	}
	.strokes {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}
	.stroke-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: #2c303d;
		border: 1px solid #3c404d;
	}
	.stroke-dot.done {
		background: #3d8f52;
		border-color: #3d8f52;
	}
	.stroke-dot.current {
		border-color: #4f8ff0;
		background: #1f3a5f;
	}
	.stroke-count {
		font-size: 0.75rem;
		color: #8b92a7;
		margin-left: 0.3rem;
	}
	.wrongmsg {
		text-align: center;
		color: #e08891;
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}
	.wrongmsg code {
		background: #2a2d36;
		padding: 0.1rem 0.35rem;
		border-radius: 0.3rem;
	}
	.result {
		font-size: 1.1rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}
	button.primary,
	.button {
		background: #4f8ff0;
		color: #0d1520;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		padding: 0.6rem 1.1rem;
		font-size: 0.95rem;
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
	}
	.button.ghost {
		background: transparent;
		color: #9aa1b5;
		border: 1px solid #3c404d;
	}
</style>
