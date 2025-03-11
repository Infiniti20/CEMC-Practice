<script lang="ts">
  import { Card } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { CheckCircle, XCircle } from "lucide-svelte";
	import type { SubQuestion } from "$lib/types";
	import { processHTMLBlock } from "$lib";
  import { math, display } from 'mathlifier';
	import ContentEditable from "./content-editable.svelte";

  
  interface Props {
    subQuestions?: SubQuestion[];
    onAnswersSubmit: (answers: string[], marks: number[], totalMarks: number) => void;
    isSubmitted: boolean;
  }

  let { subQuestions = [], onAnswersSubmit, isSubmitted = false }: Props = $props();
  
  let answers: string[] = $state(Array(5).fill(""));
  let showSolutions: boolean = $state(false);
  let marks: number[] = $state([]);
  let generatedMarks: number[] = $state([])
  
  function handleInputChange(index: number, value: string) {
    answers[index] = value;
    answers = [...answers]; // trigger reactivity
  }
  
  function handleSubmit() {
    generatedMarks = subQuestions.map((_, index) => {
      return Math.floor(Math.random() * 2) + 1; // 2-3 if correct, 1-2 if incorrect
    });
  
    const totalMarks = generatedMarks.reduce((sum, mark) => sum + mark, 0);
    marks = generatedMarks;
    answers = Array(5).fill("")
    onAnswersSubmit(answers, generatedMarks, totalMarks);
  }
  
  let allAnswered = $derived(answers.every((answer,i) => i<subQuestions.length ? answer.trim() !== "" : true));
  
  // Track both raw and processed text
  function processText(
  text: string,
): string {
  // Regular expression to match text between dollar signs
  // Uses a non-greedy match to handle multiple occurrences
  return text
}
</script>

<div class="space-y-6">
  {#each subQuestions as subQuestion, index}
    <Card class="p-4">
      <div class="space-y-4">
        <div class="font-medium">{@html processHTMLBlock(subQuestion.html)}</div>

        <div class="flex items-center gap-3">
          <ContentEditable placeholder="Enter your solution (show your work!)" 
      {processText} ></ContentEditable>

          {#if isSubmitted}
            {#if generatedMarks[index]>2}
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
              { generatedMarks[index]>2
                ? "Correct!"
                : `Incorrect.`}
            </p>
            <p class="text-sm text-muted-foreground mt-1">{@html processHTMLBlock(subQuestion.solution)}</p>
          </div>
        {/if}
      </div>
    </Card>
  {/each}

  {#if !isSubmitted}
    <Button onclick={handleSubmit} disabled={!allAnswered} class="w-full">
      Submit Answers
    </Button>
  {/if}
</div>