<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';

	import { processHTMLBlock, processAnswer, isAnswerCorrect, formatName } from '$lib';
	import type { SequenceQuestion, SubQuestion } from '$lib/types';
	import { CheckCircle, XCircle } from 'lucide-svelte';
	import ContentEditable from './content-editable.svelte';
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		question: SequenceQuestion;
		onSubmit: (answers: undefined) => void;
		contest: string;
		legend: { [key: string]: string };
		shouldShowSolution: boolean;
		answer: string[];
		solutionFeedback: { mark: number; explanation: string }[];
				children?:Snippet<[]>

	}

	let {
		question,
		contest,
		shouldShowSolution,
		answer = $bindable([]),
		solutionFeedback,
		children
	}: Props = $props();

	onMount(() => {
		// Ensure answer has an entry for each subQuestion.
		answer = Array(question.subQuestions.length).fill('');
	});
</script>

<div class="space-y-4">
	<div class="text-xl font-medium p-4 rounded-lg" id="question">
		{@html processHTMLBlock(question.base)}
	</div>
	<div class="space-y-6">
		{#each question.subQuestions as subQuestion, index}
			<Card class="p-4">
				<div class="space-y-4 cont">
					<div class="font-medium subquestion">{@html processHTMLBlock(subQuestion.html)}</div>

					<div class="flex items-center gap-3">
						<ContentEditable
							placeholder={subQuestion.type == 'short'
								? 'Short answer (part marks are awarded if relevant work is shown)'
								: 'Full solution (a correct solution poorly presented will not earn full marks)'}
							bind:value={answer[index]}
							className={subQuestion.type == 'full' ? 'h-40' : ''}
						></ContentEditable>

						{#if shouldShowSolution}
							{#if solutionFeedback[index].mark / subQuestion.points > 0.5}
								<CheckCircle class="h-5 w-5 text-green-500" />
							{:else}
								<XCircle class="h-5 w-5 text-red-500" />
							{/if}
							<span class="text-sm font-medium"
								>Mark: {solutionFeedback[index].mark}/{subQuestion.points}</span
							>
						{/if}
					</div>

					{#if shouldShowSolution}
						<div class="p-3 bg-muted rounded-lg mt-2">
							<p class="text-sm font-medium">
								{solutionFeedback[index].mark / subQuestion.points > 0.5
									? 'Correct!'
									: `Incorrect.`}
							</p>
							<p class="text-sm text-muted-foreground mt-1">
								{@html processHTMLBlock(
									solutionFeedback[index].explanation + '<br><br>' + subQuestion.solution
								)}
							</p>
						</div>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
	{@render children?.()}
	<div class="text-xs text-muted-foreground px-4">
		Source: {`${formatName(contest)} ${question.source.year} #${question.source.number + 1}`}
	</div>
</div>
<style>
	div :global(p) {
		margin: 1em 0;
	}
	div :global(.center) {
		text-align: center;
	}
  div :global(.tml-display){
    		margin: 1em 0;
  }
	

	:global(.subquestion > :first-child) {
		margin: 1em 0;
		margin-top:0;
	}

	div#question :global(img) {
		max-width: 100%;
		min-width: 250px;
	}
	div.subquestion :global(img) {
		max-width: 100%;
		min-width: 250px;
	}
	
</style>