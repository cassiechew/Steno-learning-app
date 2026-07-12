<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { progress } from '$lib/progress/progress.svelte';

	let { children } = $props();

	onMount(() => {
		progress.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Lapwing Trainer</title>
</svelte:head>

<div class="app">
	<header>
		<a href="/" class="brand">🪶 Lapwing Trainer</a>
		<nav>
			<a href="/">Lessons</a>
			<a href="/settings">Settings</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
	<footer>
		Based on the <a href="https://lapwing.aerick.ca" target="_blank" rel="noreferrer">Lapwing for Beginners</a> guide ·
		works standalone (qwerty-as-steno), with a Gemini PR writer over USB, or with
		<a href="https://www.openstenoproject.org/plover/" target="_blank" rel="noreferrer">Plover</a>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #16181f;
		color: #d8dce8;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.5;
	}
	:global(a) {
		color: #7fb0f5;
	}
	.app {
		max-width: 56rem;
		margin: 0 auto;
		padding: 1rem 1.25rem 3rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0 1.25rem;
	}
	.brand {
		font-size: 1.2rem;
		font-weight: 700;
		text-decoration: none;
		color: #eef1f8;
	}
	nav {
		display: flex;
		gap: 1rem;
	}
	nav a {
		text-decoration: none;
		color: #9aa1b5;
	}
	nav a:hover {
		color: #eef1f8;
	}
	main {
		flex: 1;
	}
	footer {
		margin-top: 3rem;
		font-size: 0.8rem;
		color: #6b7183;
	}
</style>
