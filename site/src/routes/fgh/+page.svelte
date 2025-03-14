<script lang="ts">
	import { onMount } from 'svelte';
	import { formatName } from '$lib';
	import type { PageProps } from './$types';
	import type { SequenceQuestion, SequenceStats } from '$lib/types';
	import SequenceDisplay from '$lib/components/sequence-display.svelte';
	import ContestLayout from '$lib/components/contest-layout.svelte';
	import { getSequenceStats, updateSequenceStats } from '$lib/stores/statsStore.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';

	let { data }: PageProps = $props();
	let currentQuestion: SequenceQuestion = $state(data.question);
	let sequenceAnswers: string[] | undefined = $state(undefined);
	let isSubmitted = $state(false);
	let contest: string = data.contest;
	let isLoadingNextQuestion = $state(false);
	let solutions: string[] = $state([]);
	let startTime: number = Date.now();

	// Get contest-specific stats
	let stats: SequenceStats = $state(getSequenceStats(contest));

	onMount(() => {
		startTime = Date.now();
		stats = getSequenceStats(contest);
	});

	function handleSequenceSubmit(answers: string[], marks: number[], customSolutions: string[]) {
		sequenceAnswers = answers;
		isSubmitted = true;
		solutions = customSolutions;

		const totalSubQuestions = currentQuestion.subQuestions?.length || 0;
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes
		const correctCount = marks.filter((mark) => mark > 2).length;

		// Update stats
		const updatedStats: SequenceStats = {
			...stats,
			total: stats.total + totalSubQuestions,
			correct: stats.correct + correctCount,
			incorrect: stats.incorrect + (totalSubQuestions - correctCount),
			streak: correctCount === totalSubQuestions ? stats.streak + 1 : 0,
			history: [
				...stats.history,
				{
					question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number + 1}`,
					correct: correctCount,
					total: totalSubQuestions
				}
			],
			time: stats.time + timeSpent
		};

		stats = updatedStats;
		// Update contest-specific stats
		updateSequenceStats(contest, updatedStats);
	}

	async function handleNextQuestion() {
		isLoadingNextQuestion = true;
		try {
			const response = await fetch(`/api/getSequence?contest=${contest}&topic=1`, {
				method: 'POST',
				body: JSON.stringify(stats)
			});

			if (!response.ok) {
				throw new Error('Failed to fetch next question');
			}

			currentQuestion = await response.json();
			sequenceAnswers = [];
			solutions = [];
			isSubmitted = false;
			startTime = Date.now();
		} catch (error) {
			console.error('Error fetching next question:', error);
		} finally {
			isLoadingNextQuestion = false;
		}
	}
</script>

<ContestLayout {contest} {stats}>
	<SequenceDisplay
		question={currentQuestion}
		onSequenceSubmit={handleSequenceSubmit}
		{isSubmitted}
		{contest}
	/>

	{#if isSubmitted}
		<Button class="w-full mt-4" onclick={handleNextQuestion} disabled={isLoadingNextQuestion}>
			{#if isLoadingNextQuestion}
				<Loader2 class="h-4 w-4 mr-2 animate-spin" />
				Loading Next Question...
			{:else}
				Next Question
			{/if}
		</Button>
	{/if}
</ContestLayout>
