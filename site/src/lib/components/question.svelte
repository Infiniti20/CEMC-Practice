<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isAnswerCorrect,
		isSequenceContest,
		isMultipleChoice,
		getQuestionTopics,
		formatName
	} from '$lib';
	import type { Question, SequenceQuestion, SequenceStats, Stats } from '$lib/types';
	import {
		getMultipleChoiceStats,
		getSequenceStats,
		updateMultipleChoiceStats,
		updateSequenceStats
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

	// Get contest-specific stats using the new function - this now returns a reactive rune
	let stats: Stats | SequenceStats = $state(
		isSequenceContest(contest) ? getSequenceStats(contest) : getMultipleChoiceStats(contest)
	);

	onMount(() => {
		startTime = Date.now();
		// Re-assign on mount in case the rune was created/updated by another component first
		// or if sync happened between initial load and mount.
		stats = isSequenceContest(contest)
			? getSequenceStats(contest)
			: getMultipleChoiceStats(contest);
	});

	async function handleSubmission(value: string | string[]) {
		if (isSequenceContest(contest)) {
			isLoadingNextQuestion = true;
			let res = await mark(value as string[]);
			isLoadingNextQuestion = false;
			showSolution = true;
			updateSeqStats(res);
		} else {
			updateMCStats(isAnswerCorrect(currentQuestion as Question, value as string));

			if (isMultipleChoice((currentQuestion as Question).solutions.ans)) {
				showSolution = true;
			} else {
				showSolution = true;
			}
		}
		// Update topicStats for each topic in the question
	}

	async function handleNextQuestion() {
		isLoadingNextQuestion = true;
		try {
			const response = await fetch(
				`/api/get${isSequenceContest(contest) ? 'Sequence' : 'Question'}?contest=${contest}&topic=1`,
				{
					method: 'POST',
					body: JSON.stringify(stats)
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch next question');
			}

			showSolution = false;
			answer = { multipleChoice: '', sequence: Array(10).fill('') };
			solutionFeedback = [];

			currentQuestion = (await response.json()).question;
			startTime = Date.now();
		} catch (error) {
			console.error('Error fetching next question:', error);
		} finally {
			isLoadingNextQuestion = false;
		}
	}

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
			return result;
		} catch (error) {
			console.error('Error checking answers:', error);
			// Fallback to random marks if API fails
			const generatedResult: { explanation: string; mark: number }[] = q.subQuestions.map((e) => {
				return { mark: e.points, explanation: 'Solution not available' };
			});

			solutionFeedback = generatedResult;
			return generatedResult;
		}
	}

	function updateMCStats(isCorrect: boolean) {
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes

		// Update topicStats for each topic in the question
		const newTopicStats = JSON.parse(JSON.stringify({ ...(stats as Stats).topicStats }));

		getQuestionTopics((currentQuestion as Question).topics).forEach((topic) => {
			let topicRef = topic;
			if (!newTopicStats[topicRef]) {
				newTopicStats[topicRef] = { total: 0, correct: 0, incorrect: 0, time: 0 };
			}
			newTopicStats[topicRef].total += 1;
			newTopicStats[topicRef].time += timeSpent;
			if (isCorrect) {
				newTopicStats[topicRef].correct += 1;
			} else {
				newTopicStats[topicRef].incorrect += 1;
			}
		});
		let history = [
			...(stats as Stats).history,
			{
				question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number + 1}`,
				correct: isCorrect
			}
		];
		if (history.length > 20) {
			history.shift();
		}
		const updatedStats: Stats = {
			total: stats.total + 1,
			correct: isCorrect ? stats.correct + 1 : stats.correct,
			incorrect: isCorrect ? stats.incorrect : stats.incorrect + 1,
			streak: isCorrect ? stats.streak + 1 : 0,
			history: history,
			topicStats: newTopicStats,
			time: stats.time + timeSpent
		};

		// Update the contest-specific stats via the store function
		updateMultipleChoiceStats(contest, updatedStats);
	}

	function updateSeqStats(results: { explanation: string; mark: number }[]) {
		let subQuestions = (currentQuestion as SequenceQuestion).subQuestions;

		const totalMarks = results.reduce((sum: number, q) => sum + q.mark, 0);

		const totalSubQuestions = subQuestions?.length || 0;
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes
		const correctCount = results.filter((r, i) => r.mark / subQuestions[i].points > 0.5).length;

		let history = [
			...(stats as SequenceStats).history,
			{
				question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number + 1}`,
				correct: correctCount,
				total: totalSubQuestions
			}
		];
		if (history.length > 20) {
			history.shift();
		}
		// Update stats
		const updatedStats: SequenceStats = {
			...stats,
			total: stats.total + totalSubQuestions,
			correct: stats.correct + correctCount,
			incorrect: stats.incorrect + (totalSubQuestions - correctCount),
			streak: correctCount === totalSubQuestions ? stats.streak + 1 : 0,
			history: history,
			time: stats.time + timeSpent
		};

		// Update contest-specific stats via the store function
		updateSequenceStats(contest, updatedStats);
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
