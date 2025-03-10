<script lang="ts">
	import { formatName, processHTMLBlock } from "$lib";
	import type { SequenceQuestion } from "$lib/types";
	import TextInputQuestion from "./text-input-question.svelte";

	interface Props {
		question: SequenceQuestion;
		isSubmitted: boolean;
		onSequenceSubmit?: (answers: string[], marks:number[]) => void
		contest: string;
	}

	let { question, isSubmitted, onSequenceSubmit, contest }: Props = $props();
</script>

<div class="space-y-4">
	<div class="text-xl font-medium p-4 bg-muted rounded-lg">{@html processHTMLBlock(question.base)}</div>

	<TextInputQuestion
		subQuestions={question.subQuestions}
		onAnswersSubmit={(answers:string[], marks: number[]) =>
			onSequenceSubmit && onSequenceSubmit(answers, marks)}
		{isSubmitted}
	/>
    	<div class="text-xs text-muted-foreground px-4 pl-0">
		Source: {`${formatName(contest)} ${question.source.year} #${question.source.number + 1}`}
	</div>
</div>
