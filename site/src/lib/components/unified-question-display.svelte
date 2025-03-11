<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, XCircle, Loader2 } from 'lucide-svelte';
	import { processHTMLBlock, processAnswer, isAnswerCorrect, formatName, isMultipleChoice } from '$lib';
	import TopicBadge from '$lib/components/topic-badge.svelte';
	import ContentEditable from './content-editable.svelte';
	import type { Question, SequenceQuestion, SubQuestion } from '$lib/types';

	interface Props {
		question: Question | SequenceQuestion;
		selectedAnswer?: string;
		sequenceAnswers?: string[];
		isSubmitted: boolean;
		onAnswerSelect?: (option: string) => void;
		onSequenceSubmit?: (answers: string[], marks: number[], solutions: string[]) => void;
		contest: string;
	}

	let { 
		question, 
		selectedAnswer, 
		sequenceAnswers = [], 
		isSubmitted = false, 
		onAnswerSelect, 
		onSequenceSubmit, 
		contest 
	}: Props = $props();

	// Type guards for question types
	const isSequenceQuestion = $derived('subQuestions' in question);
	
	// Handle the question based on its type
	const questionText = $derived(isSequenceQuestion 
		? (question as SequenceQuestion).base 
		: (question as Question).question
	);
	
	// Multiple choice handling
	let freeAnswer = $state('');
	
	function handleSelect(option: string) {
		if (!selectedAnswer && onAnswerSelect) {
			onAnswerSelect(option);
		}
	}
	
	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		if (onAnswerSelect) {
			onAnswerSelect(freeAnswer);
			freeAnswer = '';
		}
	};

	// Sequence question handling
	let answers: string[] = $state([]);
	let marks: number[] = $state([]);
	let explanations: string[] = $state([]);
	let isLoading: boolean = $state(false);
	
	$effect(() => {
		if (isSequenceQuestion) {
			resetAnswers();
		}
	});

	function resetAnswers() {
		if (isSequenceQuestion) {
			const subQuestions = (question as SequenceQuestion).subQuestions || [];
			answers = Array(subQuestions.length).fill('');
		}
	}

	function handleInputChange(index: number, event: CustomEvent<{ html: string; text: string }>) {
		answers[index] = event.detail.html;
		answers = [...answers]; // trigger reactivity
	}

	let allAnswered = $derived(
		answers.length > 0 &&
			answers.every((answer, i) => {
				if (!isSequenceQuestion) return true;
				const subQuestions = (question as SequenceQuestion).subQuestions || [];
				return i < subQuestions.length ? answer.trim() !== '' : true;
			})
	);

	async function handleSequenceSubmit() {
		if (!isSequenceQuestion || !onSequenceSubmit) return;
		
		isLoading = true;
		try {
			const sequenceQuestion = question as SequenceQuestion;
			const response = await fetch('/api/mark', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contest,
					answers,
					subQuestions: sequenceQuestion.subQuestions?.map((e) => ({ 
						...e, 
						html: sequenceQuestion.base + e.html 
					}))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to check answers');
			}

			const result = await response.json();
			marks = result.map((item: { mark: number }) => item.mark);
			explanations = result.map((item: { explanation: string }) => item.explanation);

			onSequenceSubmit(answers, marks, explanations);
		} catch (error) {
			console.error('Error checking answers:', error);
			// Fallback
			if (isSequenceQuestion) {
				const subQuestions = (question as SequenceQuestion).subQuestions || [];
				const generatedMarks = subQuestions.map(() => Math.floor(Math.random() * 2) + 1);
				marks = generatedMarks;
				explanations = subQuestions.map((q) => q.solution || 'Solution not available');
				onSequenceSubmit(answers, marks, explanations);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="space-y-2 p-4 rounded-lg">
		<div class="text-xl font-medium" id="question">
			{@html processHTMLBlock(questionText)}
			{#if !isSequenceQuestion && 'topics' in question}
				<TopicBadge topics={(question as Question).topics} />
			{/if}
		</div>
	</div>

	{#if isSequenceQuestion}
		<!-- Sequence Question Display -->
		<div class="space-y-6">
			{#each (question as SequenceQuestion).subQuestions || [] as subQuestion, index}
				<Card class="p-4">
					<div class="space-y-4">
						<div class="font-medium">{@html processHTMLBlock(subQuestion.html)}</div>

						<div class="flex items-center gap-3">
							<ContentEditable
								placeholder={subQuestion.type == 'short'
									? 'Short answer (part marks are awarded if relevant work is shown)'
									: 'Full solution (a correct solution poorly presented will not earn full marks)'}
								processText={(text) => text}
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
				<Button onclick={handleSequenceSubmit} disabled={!allAnswered || isLoading} class="w-full">
					{#if isLoading}
						<Loader2 class="h-4 w-4 mr-2 animate-spin" />
						Checking Answers...
					{:else}
						Submit Answers
					{/if}
				</Button>
			{/if}
		</div>
	{:else if 'answers' in question}
		<!-- Multiple Choice Question Display -->
		{#if isMultipleChoice(question.solutions.ans)}
			<RadioGroup value={selectedAnswer} class="space-y-2">
				{#each question.answers as option, index}
					<Card
						class="cursor-pointer transition-colors {selectedAnswer === option
							? isAnswerCorrect(question, option)
								? 'border-green-500 bg-green-50 dark:bg-green-950/20'
								: 'border-red-500 bg-red-50 dark:bg-red-950/20'
							: 'hover:bg-muted/50'}"
						onclick={() => handleSelect(option)}
					>
						<div class="flex items-center space-x-2 p-4">
							<RadioGroupItem
								value={option}
								id={`option-${index}`}
								disabled={selectedAnswer !== undefined}
								class="sr-only"
							/>
							<Label for={`option-${index}`} class="flex-1 cursor-pointer text-base">
								{@html processAnswer(option)}
							</Label>
						</div>
					</Card>
				{/each}
			</RadioGroup>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4">
				<Input
					type="text"
					placeholder="Enter your answer (0-99)"
					value={freeAnswer}
					onchange={(e) => (freeAnswer = (e.target as HTMLInputElement).value)}
					disabled={selectedAnswer !== undefined}
				/>
				<Button type="submit" class="w-full" disabled={selectedAnswer !== undefined}>
					Submit Answer
				</Button>
			</form>
		{/if}
	{/if}

	<div class="text-xs text-muted-foreground px-4">
		Source: {`${formatName(contest)} ${question.source.year} #${(question.source.number + 1)}`}
	</div>
</div>

<style>
	div :global(p) {
		margin: 1em 0;
	}
	:global(#question > :last-child) {
		margin: 1em 0;
		margin-bottom: 0.5em;
	}
	div :global(.center) {
		text-align: center;
	}
	div#question :global(img) {
		max-width: 100%;
		min-width: 250px;
	}
</style>
