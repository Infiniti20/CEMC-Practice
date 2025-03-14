<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { setupAuthSync } from '$lib/stores/statsStore.svelte';

	let { children } = $props();

	// Setup auth sync during component initialization
	setupAuthSync();
</script>

{@render children()}
