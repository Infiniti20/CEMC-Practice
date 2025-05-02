<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isAnswerCorrect,
		formatName,
		getQuestionTopics,
		isSequenceContest,
		isMultipleChoice
	} from '$lib';
	import type { Question, SequenceQuestion, SequenceStats, Stats } from '$lib/types';
	import {
		getMultipleChoiceStats,
		getSequenceStats,
		updateMultipleChoiceStats
	} from '$lib/stores/statsStore.svelte';
	import MultipleChoice from './multiple-choice.svelte';
	import Sequence from './sequence.svelte';
	import { Button } from './ui/button';

	let showSolution = $state(false);
	let startTime: number = Date.now();
	let isLoadingNextQuestion = $state(false);

	interface Props {
		contest: string;
		initialQuestion: Question | SequenceQuestion;
		legend: { [key: string]: string };
	}
	let { contest, initialQuestion, legend }: Props = $props();
	let currentQuestion = $state(initialQuestion);

	// Removed multipleChoiceAnswer and sequenceAnswer in favor of one answer object
	let answer = $state({ multipleChoice: '' as string, sequence: [] as string[] });
	let solutionFeedback: { mark: number; explanation: string }[] = [];

	// Get contest-specific stats using the new function
	let stats: Stats | SequenceStats = $state(
		isSequenceContest(contest) ? getSequenceStats(contest) : getMultipleChoiceStats(contest)
	);

	onMount(() => {
		startTime = Date.now();
		stats = isSequenceContest(contest)
			? getSequenceStats(contest)
			: getMultipleChoiceStats(contest);
	});

	function handleSubmission(value: string | string[]) {
		if (isSequenceContest(contest)) {
		} else {
			
			console.log(isAnswerCorrect(currentQuestion as Question, value as string))
			//TODO Update multiple choice stats

			if (isMultipleChoice((currentQuestion as Question).solutions.ans)) {
				showSolution = true;
			} else {
				showSolution = true;
			};
		}
		// Update topicStats for each topic in the question
	}

	async function handleNextQuestion() {}
</script>

{#if isSequenceContest(contest)}
	<Sequence
		onSubmit={() => {}}
		question={currentQuestion as SequenceQuestion}
		{contest}
		{legend}
		bind:answer={answer.sequence}
		shouldShowSolution={showSolution}
		isLoading={isLoadingNextQuestion}
		{solutionFeedback}
	></Sequence>
{:else}
	<MultipleChoice
		onSubmit={handleSubmission}
		question={currentQuestion as Question}
		{contest}
		{legend}
		bind:answer={answer.multipleChoice}
		shouldShowSolution={showSolution}
		isLoading={isLoadingNextQuestion}
	>
{#if !(isMultipleChoice((currentQuestion as Question).solutions.ans))}
	<Button class="w-full" disabled={showSolution} onclick={()=>{handleSubmission(answer.multipleChoice)}}>Submit Answer</Button>
	{/if}</MultipleChoice>
	

{/if}
{#if showSolution}
	<Button type="submit" class="w-full" onclick={handleNextQuestion}>Next Question</Button>
{/if}
