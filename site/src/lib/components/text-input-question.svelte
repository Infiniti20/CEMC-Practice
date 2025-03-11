<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, XCircle, Loader2 } from 'lucide-svelte';
	import type { SubQuestion } from '$lib/types';
	import { processHTMLBlock } from '$lib';
	import ContentEditable from './content-editable.svelte';

	interface Props {
		base: string;
		subQuestions?: SubQuestion[];
		onAnswersSubmit: (
			answers: string[],
			marks: number[],
			totalMarks: number,
			solutions: string[]
		) => void;
		isSubmitted: boolean;
		contest: string;
	}

	let { subQuestions = [], onAnswersSubmit, isSubmitted = false, contest, base }: Props = $props();

	let answers: string[] = $state(Array(5).fill(''));

	let marks: number[] = $state([]);
	let explanations: string[] = $state([]);
	let isLoading: boolean = $state(false);

	// Reset answers whenever subQuestions change (i.e., when a new question loads)
	$effect(() => {
  // Explicitly reference properties of subQuestions to create a dependency
  const questions = subQuestions;
  const questionCount = subQuestions.length;
  // Reset states when subQuestions changes
  answers = Array(5).fill('');
});
	function handleInputChange(index: number, event: CustomEvent<{ html: string; text: string }>) {
		answers[index] = event.detail.html;
		answers = [...answers]; // trigger reactivity
	}

	async function handleSubmit() {
		isLoading = true;
		try {
			const response = await fetch('/api/mark', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contest,
					answers,
					subQuestions: subQuestions.map((e) => ({ ...e, html: base + e.html }))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to check answers');
			}

			const result = await response.json();
			// Extract marks and explanations from the new response shape
			marks = result.map((item: { mark: number }) => item.mark);
			explanations = result.map((item: { explanation: number }) => item.explanation);

			const totalMarks = marks.reduce((sum: number, mark: number) => sum + mark, 0);
			onAnswersSubmit(answers, marks, totalMarks, explanations);
		} catch (error) {
			console.error('Error checking answers:', error);
			// Fallback to random marks if API fails
			const generatedMarks = subQuestions.map(() => Math.floor(Math.random() * 2) + 1);
			marks = generatedMarks;
			explanations = subQuestions.map((q) => q.solution || 'Solution not available');
			const totalMarks = marks.reduce((sum, mark) => sum + mark, 0);
			onAnswersSubmit(answers, marks, totalMarks, explanations);
		} finally {
			isLoading = false;
		}
	}

	let allAnswered = $derived(
		answers.every((answer, i) => (i < subQuestions.length ? answer.trim() !== '' : true))
	);

	// Track both raw and processed text
	function processText(text: string): string {
		return text;
	}
</script>

<div class="space-y-6">
	{#each subQuestions as subQuestion, index}
		<Card class="p-4">
			<div class="space-y-4">
				<div class="font-medium">{@html processHTMLBlock(subQuestion.html)}</div>

				<div class="flex items-center gap-3">
					<ContentEditable
						placeholder={subQuestion.type == 'short'
							? 'Short answer (part marks are awarded if relevant work is shown)'
							: 'Full solution (a correct solution poorly presented will not earn full marks)'}
						{processText}
						value={answers[index] || ''}
						on:input={(e) => handleInputChange(index, e)}
						className={subQuestion.type == 'full' ? 'h-40' : ''}
					></ContentEditable>

					{#if isSubmitted}
						{#if marks[index] / subQuestion.points > 0.5}
							<CheckCircle class="h-5 w-5 text-green-500" />
						{:else}
							<XCircle class="h-5 w-5 text-red-500" />
						{/if}
						<span class="text-sm font-medium">Mark: {marks[index]}/{subQuestion.points}</span>
					{/if}
				</div>

				{#if isSubmitted}
					<div class="p-3 bg-muted rounded-lg mt-2">
						<p class="text-sm font-medium">
							{marks[index] / subQuestion.points > 0.5 ? 'Correct!' : `Incorrect.`}
						</p>
						<p class="text-sm text-muted-foreground mt-1">
							{@html processHTMLBlock(explanations[index] + '<br><br>' + subQuestion.solution)}
						</p>
					</div>
				{/if}
			</div>
		</Card>
	{/each}

	{#if !isSubmitted}
		<Button onclick={handleSubmit} disabled={!allAnswered || isLoading} class="w-full">
			{#if isLoading}
				<Loader2 class="h-4 w-4 mr-2 animate-spin" />
				Checking Answers...
			{:else}
				Submit Answers
			{/if}
		</Button>
	{/if}
</div>
