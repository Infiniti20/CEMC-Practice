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
	import { Loader2 } from 'lucide-svelte';

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
	let answer = $state({ multipleChoice: '' as string, sequence: Array(10).fill('') as string[] });
	let solutionFeedback: { mark: number; explanation: string }[] = $state([]);

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

	async function handleSubmission(value: string | string[]) {
		if (isSequenceContest(contest)) {
			isLoadingNextQuestion = true;
			await mark(value as string[]);
			isLoadingNextQuestion = false;
			showSolution = true;
		} else {
			console.log(isAnswerCorrect(currentQuestion as Question, value as string));
			//TODO Update multiple choice stats

			if (isMultipleChoice((currentQuestion as Question).solutions.ans)) {
				showSolution = true;
			} else {
				showSolution = true;
			}
		}
		// Update topicStats for each topic in the question
	}

	async function handleNextQuestion() {}

	async function mark(answers: string[]) {
		let q = currentQuestion as SequenceQuestion;
		try {
			const response = await fetch('/api/mark', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contest,
					answers,
					subQuestions: q.subQuestions.map((e) => ({ ...e, html: q.base + e.html }))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to check answers');
			}

			const result: { explanation: string; mark: number }[] = await response.json();

			solutionFeedback = result;
		} catch (error) {
			console.error('Error checking answers:', error);
			// Fallback to random marks if API fails
			const generatedResult: { explanation: string; mark: number }[] = q.subQuestions.map((e) => {
				return { mark: e.points, explanation: 'Solution not available' };
			});

			solutionFeedback = generatedResult;
		}
		//TODO Update stats
	}
	// $inspect(answer)
</script>

{#if isSequenceContest(contest)}
	<Sequence
		onSubmit={() => {}}
		question={currentQuestion as SequenceQuestion}
		{contest}
		{legend}
		bind:answer={answer.sequence}
		shouldShowSolution={showSolution}
		{solutionFeedback}
		>{#if !showSolution}<Button
				class="w-full"
				disabled={answer.sequence.some((e) => !e) || isLoadingNextQuestion}
				onclick={() => {
					handleSubmission(answer.sequence);
				}}
				>{#if isLoadingNextQuestion && !showSolution}
					<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					Checking Answers...
				{:else}
					Submit Answers
				{/if}</Button
			>
		{/if}</Sequence
	>
{:else}
	<MultipleChoice
		onSubmit={handleSubmission}
		question={currentQuestion as Question}
		{contest}
		{legend}
		bind:answer={answer.multipleChoice}
		shouldShowSolution={showSolution}
	>
		{#if !isMultipleChoice((currentQuestion as Question).solutions.ans)}
			<Button
				class="w-full"
				disabled={showSolution}
				onclick={() => {
					handleSubmission(answer.multipleChoice);
				}}>Submit Answer</Button
			>
		{/if}</MultipleChoice
	>
{/if}
{#if showSolution}
	<Button type="submit" class="w-full" onclick={handleNextQuestion}>Next Question</Button>
{/if}
