<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { processHTMLBlock, processAnswer, isAnswerCorrect } from '$lib';
    import TopicBadge from '$lib/components/topic-badge.svelte';

	interface Props {
		question: Question;
		selectedAnswer: string | undefined;
		onAnswerSelect: (option: string) => void;
	}

	let { question, selectedAnswer, onAnswerSelect }: Props = $props();
	function handleSelect(option: string) {
		if (!selectedAnswer) {
			onAnswerSelect(option);
		}
	}

</script>

<div class="space-y-4">
	<div class="space-y-2 p-4 rounded-lg">
        <div class="text-xl font-medium" id="question">{@html processHTMLBlock(question.question)}</div>
        <TopicBadge topics={question.topics} />
      </div>

	<RadioGroup value={selectedAnswer} class="space-y-2">
		{#each question.answers as option, index}
			<Card
				class="cursor-pointer transition-colors {selectedAnswer === option
                ? isAnswerCorrect(question, option)
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-red-500 bg-red-50 dark:bg-red-950/20"
                : "hover:bg-muted/50"}"
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
	<div class="text-xs text-muted-foreground px-4">
		Source: {`Pascal ${question.source.year} #${question.source.number + 1}`}
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
