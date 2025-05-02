<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	import { processHTMLBlock, processAnswer, isAnswerCorrect, formatName } from '$lib';
	import TopicBadge from '$lib/components/topic-badge.svelte';

	import { isMultipleChoice } from '$lib/index';
	import type { Question } from '$lib/types';
	import {  CheckCircle, XCircle } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		question: Question;
		onSubmit: (option: string) => void;
		contest: string;
		legend: { [key: string]: string };
		shouldShowSolution: boolean;
		isLoading: boolean;
		answer:string;
		children?:Snippet<[]>
	}

	let { question, onSubmit, contest, legend, shouldShowSolution,answer=$bindable(),children }: Props = $props();
  	
	let isCorrect = $derived(isAnswerCorrect(question, answer || ""));

	function handleSelect(option: string) {
		if (!shouldShowSolution) {
			answer = option
			onSubmit(option);
		}
	}

</script>

<div class="space-y-4">
	<div class="space-y-2 p-4 rounded-lg">
		<div class="text-xl font-medium" id="question">{@html processHTMLBlock(question.question)}</div>
		<TopicBadge topics={question.topics} {legend} />
	</div>
	{#if isMultipleChoice(question.solutions.ans)}
		<RadioGroup class="space-y-2">
			{#each question.answers as option, index}
				<Card
					class="cursor-pointer transition-colors {shouldShowSolution && answer == option
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
							disabled={shouldShowSolution}
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
		<form class="space-y-4">
			<Input
				type="text"
				placeholder="Enter your answer (0-99)"
				bind:value={answer}
				disabled={shouldShowSolution}
			/>
		</form>
	{/if}
	{@render children?.()}

	<div class="text-xs text-muted-foreground px-4">
		Source: {`${formatName(contest)} ${question.source.year} #${question.source.number + 1}`}
	</div>
</div>
{#if shouldShowSolution}
<div class="space-y-4">
  <Card class="border-2 {isCorrect ? 'border-green-500' : 'border-red-500'}">
    <CardContent class="pt-6">
      <div class="flex items-center gap-2 mb-4">
        {#if isCorrect}
          <CheckCircle class="h-6 w-6 text-green-500" />
          <span class="font-medium text-green-700 dark:text-green-400">Correct!</span>
        {:else}
          <XCircle class="h-6 w-6 text-red-500" />
          <span class="font-medium text-red-700 dark:text-red-400">
            Incorrect. The correct answer is {question.solutions.ans}
          </span>
        {/if}
      </div>

      <div class="p-4  rounded-lg">
        <h3 class="font-medium mb-2">Solution:</h3>
        <p class="text-muted-foreground">{@html processHTMLBlock(question.solutions.solution)}</p>
      </div>
    </CardContent>
  </Card>
</div>
{/if}