<script lang="ts">
	import { units, lessons } from '$lib/lessons/lessons';
	import { progress } from '$lib/progress/progress.svelte';

	const flatIndex = (id: string) => lessons.findIndex((l) => l.id === id);
</script>

<h1>Learn stenography, one chord at a time</h1>
<p class="sub">
	The full <strong>Lapwing theory</strong> course — {lessons.length} lessons generated from the
	official lapwing-base dictionary, following the
	<a href="https://lapwing.aerick.ca" target="_blank" rel="noreferrer">Lapwing for Beginners</a>
	guide. Each lesson unlocks the next at 90% first-try accuracy — accuracy before speed.
</p>

{#each units as unit (unit.title)}
	<h2>{unit.title}</h2>
	<ol class="lessons">
		{#each unit.lessons as lesson (lesson.id)}
			{@const lp = progress.data.lessons[lesson.id]}
			{@const unlocked = progress.isUnlocked(lesson.id)}
			<li class:locked={!unlocked} class:completed={lp?.completed}>
				<div class="status">
					{#if lp?.completed}✅{:else if unlocked}▶️{:else}🔒{/if}
				</div>
				<div class="info">
					{#if unlocked}
						<a href="/lesson/{lesson.id}" class="title">{flatIndex(lesson.id) + 1}. {lesson.title}</a>
					{:else}
						<span class="title">{flatIndex(lesson.id) + 1}. {lesson.title}</span>
					{/if}
					<div class="meta">
						{lesson.chapter} · {lesson.items.length} items
						{#if lp}
							· best {Math.round(lp.bestAccuracy * 100)}% · {lp.attempts}
							{lp.attempts === 1 ? 'attempt' : 'attempts'}
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ol>
{/each}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}
	h2 {
		font-size: 1rem;
		color: #9aa1b5;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 1.5rem 0 0.5rem;
	}
	.sub {
		color: #9aa1b5;
		margin-top: 0;
	}
	.lessons {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		background: #1e212b;
		border: 1px solid #2c303d;
		border-radius: 0.6rem;
		padding: 0.75rem 1rem;
	}
	li.locked {
		opacity: 0.55;
	}
	li.completed {
		border-color: #2e5f3a;
	}
	.status {
		font-size: 1.1rem;
	}
	.title {
		font-weight: 600;
		color: #eef1f8;
		text-decoration: none;
	}
	a.title:hover {
		text-decoration: underline;
	}
	.meta {
		font-size: 0.8rem;
		color: #8b92a7;
	}
</style>
