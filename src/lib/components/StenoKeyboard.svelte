<script lang="ts">
	import type { StenoKey, Stroke } from '$lib/steno/keys';

	interface Props {
		/** Keys the learner should press (highlighted as targets). */
		expected?: Stroke;
		/** Keys currently held down (live feedback). */
		down?: Stroke;
		/** Keys of the last wrong stroke, to show the mismatch. */
		wrong?: Stroke;
		/** Hide the expected highlight (for higher mastery levels). */
		showExpected?: boolean;
	}

	let { expected = new Set(), down = new Set(), wrong = new Set(), showExpected = true }: Props = $props();

	// Grid layout: 10 columns x 3 key rows + number bar. [key, col, row, span-rows]
	type Cell = { key: StenoKey; label: string; col: number; row: number; tall?: boolean };

	const cells: Cell[] = [
		{ key: 'S-', label: 'S', col: 1, row: 2, tall: true },
		{ key: 'T-', label: 'T', col: 2, row: 2 },
		{ key: 'K-', label: 'K', col: 2, row: 3 },
		{ key: 'P-', label: 'P', col: 3, row: 2 },
		{ key: 'W-', label: 'W', col: 3, row: 3 },
		{ key: 'H-', label: 'H', col: 4, row: 2 },
		{ key: 'R-', label: 'R', col: 4, row: 3 },
		{ key: '*', label: '*', col: 5, row: 2, tall: true },
		{ key: '-F', label: 'F', col: 6, row: 2 },
		{ key: '-R', label: 'R', col: 6, row: 3 },
		{ key: '-P', label: 'P', col: 7, row: 2 },
		{ key: '-B', label: 'B', col: 7, row: 3 },
		{ key: '-L', label: 'L', col: 8, row: 2 },
		{ key: '-G', label: 'G', col: 8, row: 3 },
		{ key: '-T', label: 'T', col: 9, row: 2 },
		{ key: '-S', label: 'S', col: 9, row: 3 },
		{ key: '-D', label: 'D', col: 10, row: 2 },
		{ key: '-Z', label: 'Z', col: 10, row: 3 }
	];

	const vowels: Cell[] = [
		{ key: 'A-', label: 'A', col: 3, row: 4 },
		{ key: 'O-', label: 'O', col: 4, row: 4 },
		{ key: '-E', label: 'E', col: 6, row: 4 },
		{ key: '-U', label: 'U', col: 7, row: 4 }
	];

	function classesFor(key: StenoKey): string {
		const cls: string[] = ['key'];
		if (showExpected && expected.has(key)) cls.push('expected');
		if (down.has(key)) cls.push('down');
		if (wrong.has(key)) cls.push(expected.has(key) ? 'wrong-hit' : 'wrong-extra');
		if (showExpected && wrong.size > 0 && expected.has(key) && !wrong.has(key)) cls.push('missed');
		return cls.join(' ');
	}
</script>

<div class="board" role="img" aria-label="Steno keyboard diagram">
	<div class="numbar {showExpected && expected.has('#') ? 'expected' : ''} {down.has('#') ? 'down' : ''} {wrong.has('#') ? 'wrong-hit' : ''}">
		#
	</div>
	<div class="grid">
		{#each [...cells, ...vowels] as cell (cell.key + cell.col)}
			<div
				class={classesFor(cell.key)}
				style="grid-column: {cell.col}; grid-row: {cell.row - 1} {cell.tall ? '/ span 2' : ''};"
			>
				{cell.label}
			</div>
		{/each}
	</div>
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		user-select: none;
		max-width: 34rem;
		margin: 0 auto;
	}
	.numbar {
		height: 1.4rem;
		border-radius: 0.4rem;
		background: var(--key-bg, #2a2d36);
		border: 1px solid var(--key-border, #3c404d);
		color: var(--key-fg, #9aa1b5);
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		grid-template-rows: repeat(3, 3rem);
		gap: 0.35rem;
	}
	.key {
		border-radius: 0.4rem;
		background: var(--key-bg, #2a2d36);
		border: 1px solid var(--key-border, #3c404d);
		color: var(--key-fg, #9aa1b5);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
		transition: background 80ms, border-color 80ms, color 80ms;
	}
	.expected,
	.numbar.expected {
		background: #1f3a5f;
		border-color: #4f8ff0;
		color: #cfe2ff;
	}
	.down,
	.numbar.down {
		background: #3a6ea5 !important;
		border-color: #8bb8f0 !important;
		color: #fff !important;
	}
	.wrong-extra {
		background: #5f1f28;
		border-color: #f04f63;
		color: #ffd7dc;
	}
	.wrong-hit {
		background: #2e5f1f;
		border-color: #6fd04f;
		color: #dfffd2;
	}
	.missed {
		background: #5f4a1f;
		border-color: #f0c04f;
		color: #fff0cf;
	}
</style>
