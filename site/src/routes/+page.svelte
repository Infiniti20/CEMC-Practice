<script lang="ts">
	import { onMount } from 'svelte';
	import { isAnswerCorrect, formatName, getQuestionTopics } from '$lib';
	import type { Question, Stats } from '$lib/types';
	import type { PageProps } from './$types';
	import QuestionDisplay from '$lib/components/question-display.svelte';
	import SolutionDisplay from '$lib/components/solution-display.svelte';
	import ContestLayout from '$lib/components/contest-layout.svelte';
	import { getMultipleChoiceStats, updateMultipleChoiceStats } from '$lib/stores/statsStore.svelte';

	let { data }: PageProps = $props();
	let currentQuestion: Question = $state(data.question);
	let selectedAnswer: string | undefined = $state(undefined);
	let showSolution = $state(false);
	let contest: string = data.contest;
	let isLoadingNextQuestion = $state(false);
	let startTime: number = Date.now();

	// Get contest-specific stats using the new function
	let stats: Stats = $state(getMultipleChoiceStats(contest));

	onMount(() => {
		startTime = Date.now();
		stats = getMultipleChoiceStats(contest);
	});

	function handleAnswerSelect(answer: any) {
		if (selectedAnswer) return; // Prevent changing answer after selection

		selectedAnswer = answer;
		const isCorrect = isAnswerCorrect(currentQuestion, answer);
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes

		// Update topicStats for each topic in the question
		const newTopicStats = { ...stats.topicStats };

		getQuestionTopics(currentQuestion.topics).forEach((topic) => {
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
				...stats.history,
				{
					question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number}`,
					correct: isCorrect
				}
			]
		if(history.length > 20){
			history.shift()
		}
		const updatedStats: Stats = {
			total: stats.total + 1,
			correct: isCorrect ? stats.correct + 1 : stats.correct,
			incorrect: isCorrect ? stats.incorrect : stats.incorrect + 1,
			streak: isCorrect ? stats.streak + 1 : 0,
			history: history ,
			topicStats: newTopicStats,
			time: stats.time + timeSpent
		};

		stats = updatedStats;
		// Update the contest-specific stats
		updateMultipleChoiceStats(contest, updatedStats);
		showSolution = true;
	}

	async function handleNextQuestion() {
		isLoadingNextQuestion = true;
		try {
			const response = await fetch(`/api/getQuestion?contest=${contest}&topic=1`, {
				method: 'POST',
				body: JSON.stringify(stats)
			});

			if (!response.ok) {
				throw new Error('Failed to fetch next question');
			}

			currentQuestion = await response.json();
			selectedAnswer = undefined;
			showSolution = false;
			startTime = Date.now();
		} catch (error) {
			console.error('Error fetching next question:', error);
		} finally {
			isLoadingNextQuestion = false;
		}
	}
</script>

<ContestLayout {contest} {stats}>
	<QuestionDisplay
		question={currentQuestion}
		{selectedAnswer}
		onAnswerSelect={handleAnswerSelect}
		{contest}
	/>

	{#if showSolution}
		<SolutionDisplay
			question={currentQuestion}
			{selectedAnswer}
			onNextQuestion={handleNextQuestion}
		/>
	{/if}
</ContestLayout>
