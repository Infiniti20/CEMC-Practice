<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent } from "$lib/components/ui/card";
  import { CheckCircle, XCircle, ArrowRight } from "lucide-svelte";
  import {isAnswerCorrect, processHTMLBlock} from '$lib'
	import type { Question } from "$lib/types";


  interface Props {
    question: Question;
    selectedAnswer: string | undefined;
    onNextQuestion: () => void;
  }

  let { question, selectedAnswer, onNextQuestion }: Props = $props();

  let isCorrect = $derived(isAnswerCorrect(question, selectedAnswer ?? ""));
</script>

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

  <Button class="w-full" onclick={onNextQuestion}>
    Next Question <ArrowRight class="ml-2 h-4 w-4" />
  </Button>
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
</style>
