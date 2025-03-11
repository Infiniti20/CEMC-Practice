<script lang="ts">
	import { onMount } from 'svelte';
	import { isAnswerCorrect, formatName, getQuestionTopics } from '$lib';
	import type { Question, SequenceQuestion, Stats, SequenceStats } from '$lib/types';
	import type { PageProps } from './$types';
	import SolutionDisplay from '$lib/components/solution-display.svelte';
	import ContestLayout from '$lib/components/contest-layout.svelte';
	import { multipleChoiceStats, sequenceStats } from '$lib/stores/statsStore.svelte';
	import UnifiedQuestionDisplay from '$lib/components/unified-question-display.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';

	let { data }: PageProps = $props();
	let currentQuestion: Question | SequenceQuestion = $state(data.question);
	let selectedAnswer: string | undefined = $state(undefined);
	let sequenceAnswers: string[] | undefined = $state(undefined);
	let showSolution = $state(false);
	let isSubmitted = $state(false);
	let contest: string = data.contest;
	let isLoadingNextQuestion = $state(false);
	let startTime: number = Date.now();
	let solutions: string[] = $state([]);

	// Determine if the current question is a sequence question
	let isSequenceQuestion = $derived('subQuestions' in currentQuestion);

	// Create local stats objects to track changes
	let mcStats: Stats = $state({ ...multipleChoiceStats.get() });
	let seqStats: SequenceStats = $state({ ...sequenceStats.get() });

	onMount(() => {
		startTime = Date.now();
		multipleChoiceStats.setupEffect();
		sequenceStats.setupEffect();
		mcStats = { ...multipleChoiceStats.get() };
		seqStats = { ...sequenceStats.get() };
	});

	function handleAnswerSelect(answer: any) {
		if (selectedAnswer) return; // Prevent changing answer after selection

		selectedAnswer = answer;
		const isCorrect = isAnswerCorrect(currentQuestion as Question, answer);
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes

		// Update topicStats for each topic in the question
		const newTopicStats = { ...mcStats.topicStats };

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

		const updatedStats: Stats = {
			total: mcStats.total + 1,
			correct: isCorrect ? mcStats.correct + 1 : mcStats.correct,
			incorrect: isCorrect ? mcStats.incorrect : mcStats.incorrect + 1,
			streak: isCorrect ? mcStats.streak + 1 : 0,
			history: [
				...mcStats.history,
				{
					question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number}`,
					correct: isCorrect
				}
			],
			topicStats: newTopicStats,
			time: mcStats.time + timeSpent
		};

		mcStats = updatedStats;
		multipleChoiceStats.update(updatedStats);
		showSolution = true;
	}

	function handleSequenceSubmit(answers: string[], marks: number[], customSolutions: string[]) {
		sequenceAnswers = answers;
		isSubmitted = true;
		solutions = customSolutions;

		const question = currentQuestion as SequenceQuestion;
		const totalSubQuestions = question.subQuestions?.length || 0;
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes
		const correctCount = marks.filter((mark) => mark > 2).length;

		// Update stats
		const updatedStats: SequenceStats = {
			...seqStats,
			total: seqStats.total + totalSubQuestions,
			correct: seqStats.correct + correctCount,
			incorrect: seqStats.incorrect + (totalSubQuestions - correctCount),
			streak: correctCount === totalSubQuestions ? seqStats.streak + 1 : 0,
			history: [
				...seqStats.history,
				{
					question: `${formatName(contest)} ${question.source.year} #${question.source.number + 1}`,
					correct: correctCount,
					total: totalSubQuestions
				}
			],
			time: seqStats.time + timeSpent
		};

		seqStats = updatedStats;
		sequenceStats.update(updatedStats);
	}

	async function handleNextQuestion() {
		isLoadingNextQuestion = true;
		try {
			const endpoint = isSequenceQuestion
				? `/api/getSequence?contest=${contest}&topic=1`
				: `/api/getQuestion?contest=${contest}&topic=1`;

			const stats = isSequenceQuestion ? seqStats : mcStats;

			const response = await fetch(endpoint, {
				method: 'POST',
				body: JSON.stringify(stats)
			});

			if (!response.ok) {
				throw new Error('Failed to fetch next question');
			}

			currentQuestion = await response.json();
			selectedAnswer = undefined;
			sequenceAnswers = [];
			solutions = [];
			showSolution = false;
			isSubmitted = false;
			startTime = Date.now();
		} catch (error) {
			console.error('Error fetching next question:', error);
		} finally {
			isLoadingNextQuestion = false;
		}
	}
</script>

<ContestLayout {contest} stats={isSequenceQuestion ? seqStats : mcStats}>
	<UnifiedQuestionDisplay
		question={currentQuestion}
		{selectedAnswer}
		{sequenceAnswers}
		isSubmitted={isSubmitted || showSolution}
		onAnswerSelect={handleAnswerSelect}
		onSequenceSubmit={handleSequenceSubmit}
		{contest}
	/>

	{#if showSolution && !isSequenceQuestion}
		<SolutionDisplay
			question={currentQuestion as Question}
			{selectedAnswer}
			onNextQuestion={handleNextQuestion}
		/>
	{:else if isSubmitted}
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
