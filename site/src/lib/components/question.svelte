<script lang="ts">
	import { onMount } from 'svelte';
	import { isAnswerCorrect, formatName, getQuestionTopics, isSequenceContest } from '$lib';
	import type { Question, SequenceQuestion, SequenceStats, Stats } from '$lib/types';
	import { getMultipleChoiceStats, getSequenceStats, updateMultipleChoiceStats } from '$lib/stores/statsStore.svelte';

	let showSolution = $state(false);
	let startTime: number = Date.now();
    let isLoadingNextQuestion = $state(false);

	interface Props {
		contest: string;
        initialQuestion: Question|SequenceQuestion
		legend: { [key: string]: string };
	}
	let { contest, initialQuestion, legend }: Props = $props();
    let currentQuestion = $state(initialQuestion)
	// Get contest-specific stats using the new function
	let stats: Stats|SequenceStats = $state(isSequenceContest(contest) ? getSequenceStats(contest) : getMultipleChoiceStats(contest));

	onMount(() => {
		startTime = Date.now();
		stats = isSequenceContest(contest) ? getSequenceStats(contest) : getMultipleChoiceStats(contest);
	});

	function handleSubmission(answer: any) {
		
		// Update topicStats for each topic in the question
	}

	async function handleNextQuestion() {

	}
</script>
