<script lang="ts">
	import { formatName, processHTMLBlock } from '$lib';
	import type { SequenceQuestion } from '$lib/types';
	import TextInputQuestion from './text-input-question.svelte';

	interface Props {
		question: SequenceQuestion;
		isSubmitted: boolean;
		onSequenceSubmit?: (answers: string[], marks: number[], solutions: string[]) => void;
		contest: string;
	}

	let { question, isSubmitted, onSequenceSubmit, contest }: Props = $props();
</script>

<div class="space-y-4">
	<div class="text-xl font-medium p-4 bg-muted rounded-lg">
		{@html processHTMLBlock(question.base)}
	</div>

	<TextInputQuestion
		subQuestions={question.subQuestions}
		base={question.base}
		onAnswersSubmit={(
			answers: string[],
			marks: number[],
			totalMarks: number,
			solutions: string[]
		) => onSequenceSubmit && onSequenceSubmit(answers, marks, solutions)}
		{isSubmitted}
		{contest}
	/>
	<div class="text-xs text-muted-foreground px-4 pl-0">
		Source: {`${formatName(contest)} ${question.source.year} #${question.source.number + 1}`}
	</div>
</div>
