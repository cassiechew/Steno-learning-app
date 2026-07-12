<script lang="ts">
	import { lessons } from '$lib/lessons/lessons';
	import { progress } from '$lib/progress/progress.svelte';
</script>

<h1>Learn stenography, one chord at a time</h1>
<p class="sub">
	A progression through <strong>Lapwing theory</strong>. Each lesson unlocks the next once you pass
	with 90% first-try accuracy — speed comes later, accuracy comes first.
</p>

<ol class="lessons">
	{#each lessons as lesson, i (lesson.id)}
		{@const lp = progress.data.lessons[lesson.id]}
		{@const unlocked = progress.isUnlocked(lesson.id)}
		<li class:locked={!unlocked} class:completed={lp?.completed}>
			<div class="status">
				{#if lp?.completed}✅{:else if unlocked}▶️{:else}🔒{/if}
			</div>
			<div class="info">
				{#if unlocked}
					<a href="/lesson/{lesson.id}" class="title">{i + 1}. {lesson.title}</a>
				{:else}
					<span class="title">{i + 1}. {lesson.title}</span>
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

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}
	.sub {
		color: #9aa1b5;
		margin-top: 0;
	}
	.lessons {
		list-style: none;
		padding: 0;
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
