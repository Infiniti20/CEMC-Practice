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
	import { CheckCircle, ChartBar, Loader2, SwitchCamera } from 'lucide-svelte';
	import type { PageProps } from './$types';
	import { formatName } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import type { SequenceQuestion, SequenceStats } from '$lib/types';
	import SequenceDisplay from '$lib/components/sequence-display.svelte';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	let currentQuestion: SequenceQuestion = $state(data.question);
	let sequenceAnswers: string[] | undefined = $state(undefined);
	let isSubmitted = $state(false);
	let contest: string = data.contest;
	let isLoadingNextQuestion = $state(false);
	let solutions: string[] = $state([]);

	let startTime: number = Date.now();

	let stats: SequenceStats = $state({
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
			localStorage.setItem('fghStats', JSON.stringify(stats));
		} catch (e) {
			console.error('Failed to save stats to localStorage:', e);
		}
	}

	onMount(() => {
		startTime = Date.now();

		// Load stats from localStorage if they exist
		try {
			const savedStats = localStorage.getItem('fghStats');
			if (savedStats) {
				stats = JSON.parse(savedStats);
			}
		} catch (e) {
			console.error('Failed to load stats from localStorage:', e);
			// Continue with default stats
		}
	});

	function handleSequenceSubmit(answers: string[], marks: number[], customSolutions: string[]) {
		sequenceAnswers = answers;
		isSubmitted = true;
		solutions = customSolutions;

		const totalSubQuestions = currentQuestion.subQuestions?.length || 0;
		const timeSpent = (Date.now() - startTime) / 60000; // time in minutes
		const correctCount = marks.filter((mark) => mark > 2).length;

		// Update stats
		stats = {
			...stats,
			total: stats.total + totalSubQuestions,
			correct: stats.correct + correctCount,
			incorrect: stats.incorrect + (totalSubQuestions - correctCount),
			streak: correctCount === totalSubQuestions ? stats.streak + 1 : 0,
			history: [
				...stats.history,
				{
					question: `${formatName(contest)} ${currentQuestion.source.year} #${currentQuestion.source.number}`,
					correct: correctCount,
					total: totalSubQuestions
				}
			],
			time: stats.time + timeSpent
		};

		// Save stats to localStorage after updating
		saveStatsToLocalStorage();
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

<main class="min-h-screen p-4 md:p-8 flex items-center justify-center">
	<Card class="w-full max-w-3xl">
		<CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-2xl">Math Practice</CardTitle>
          <CardDescription>Solve math problems and track your progress</CardDescription>
        </div>
          <Button variant="outline" onclick={()=>{goto("/login")}}>
            <SwitchCamera class="mr-2 h-4 w-4" />
            Switch Contests
          </Button>
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

						<SequenceDisplay
							question={currentQuestion}
							onSequenceSubmit={handleSequenceSubmit}
							{isSubmitted}
							{contest}
						/>

						{#if isSubmitted}
							<Button
								class="w-full mt-4"
								onclick={handleNextQuestion}
								disabled={isLoadingNextQuestion}
							>
								{#if isLoadingNextQuestion}
									<Loader2 class="h-4 w-4 mr-2 animate-spin" />
									Loading Next Question...
								{:else}
									Next Question
								{/if}
							</Button>
						{/if}
					</div>
				</TabsContent>

				<TabsContent value="stats" class="mt-0">
					<!-- <StatsDisplay {stats} /> -->
				</TabsContent>
			</Tabs>
		</CardContent>
	</Card>
</main>
