<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { CheckCircle, ChartBar } from 'lucide-svelte';
	import QuestionDisplay from '$lib/components/question-display.svelte';
	import SolutionDisplay from '$lib/components/solution-display.svelte';
	import StatsDisplay from '$lib/components/stats-display.svelte';
	import type { PageProps } from './$types';
	import { getQuestionTopics, isAnswerCorrect } from '$lib';

	let { data }: PageProps = $props();
	let currentQuestion: Question = $state(data);
	let selectedAnswer: string | undefined = $state(undefined);
	let showSolution = $state(false);

	let startTime: number = Date.now();

	let stats: Stats = $state({
		total: 0,
		correct: 0,
		incorrect: 0,
		streak: 0,
		history: [],
		topicStats: {},
		time: 0
	});

	// Function to save stats to localStorage
	function saveStatsToLocalStorage() {
		try {
			localStorage.setItem('mathPracticeStats', JSON.stringify(stats));
		} catch (e) {
			console.error('Failed to save stats to localStorage:', e);
		}
	}

	onMount(() => {
		startTime = Date.now();

		// Load stats from localStorage if they exist
		try {
			const savedStats = localStorage.getItem('mathPracticeStats');
			if (savedStats) {
				stats = JSON.parse(savedStats);
			}
		} catch (e) {
			console.error('Failed to load stats from localStorage:', e);
			// Continue with default stats
		}
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
		stats = {
			total: stats.total + 1,
			correct: isCorrect ? stats.correct + 1 : stats.correct,
			incorrect: isCorrect ? stats.incorrect : stats.incorrect + 1,
			streak: isCorrect ? stats.streak + 1 : 0,
			history: [
				...stats.history,
				{
					question: `${currentQuestion.source.year} + ${currentQuestion.source.number}`,
					correct:isCorrect
				}
			],
			topicStats: newTopicStats,
			time: (stats.time += timeSpent)
		};

		// Save stats to localStorage after updating
		saveStatsToLocalStorage();

		showSolution = true;
	}

	async function handleNextQuestion() {
		currentQuestion = await (
			await fetch(`/api/getQuestion?contest=pascal&topic=1`, {
				method: 'POST',
				body: JSON.stringify(stats)
			})
		).json();
		selectedAnswer = undefined;
		showSolution = false;
		startTime = Date.now();
	}
</script>

<main class="min-h-screen p-4 md:p-8 flex items-center justify-center">
	<Card class="w-full max-w-3xl">
		<CardHeader>
			<CardTitle class="text-2xl">Math Practice</CardTitle>
			<CardDescription>Solve math problems and track your progress</CardDescription>
		</CardHeader>
		<CardContent>
			<Tabs value="practice">
				<TabsList class="mb-4">
					<TabsTrigger value="practice" data-value="practice">Practice</TabsTrigger>
					<TabsTrigger value="stats">
						<ChartBar class="h-4 w-4 mr-2" />
						Stats
					</TabsTrigger>
				</TabsList>

				<TabsContent value="practice" class="mt-0">
					<div class="space-y-6">
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<span class="font-medium">Streak:</span>
								<span class="flex items-center gap-1">
									{stats.streak}
									<CheckCircle class="h-4 w-4 text-green-500" />
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-medium">Accuracy:</span>
								<Progress
									value={stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}
									class="w-24 h-2"
								/>
								<span>{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</span
								>
							</div>
						</div>

						<QuestionDisplay
							question={currentQuestion}
							{selectedAnswer}
							onAnswerSelect={handleAnswerSelect}
						/>

						{#if showSolution}
							<SolutionDisplay
								question={currentQuestion}
								{selectedAnswer}
								onNextQuestion={handleNextQuestion}
							/>
						{/if}
					</div>
				</TabsContent>

				<TabsContent value="stats" class="mt-0">
					<StatsDisplay {stats} />
					<!-- <Button variant="outline" class="mt-4 w-full" onclick={switchToPracticeTab}>
						Back to Practice
					</Button> -->
				</TabsContent>
			</Tabs>
		</CardContent>
	</Card>
</main>
