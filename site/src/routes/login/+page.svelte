<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
	import { formatName } from '$lib';

  let selectedGrade = '';
  let selectedTopic = '';

  const gradeOptions = [
    "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  ];

  const topicOptions = {
    "9th Grade": ["pascal","fryer"],
    "7th Grade": ["gauss7"],
    "8th Grade": ["Linear Equations", "Functions", "Pythagorean Theorem"],
  };

  function handleStartPractice() {
    if (selectedGrade && selectedTopic) {
      document.cookie = `contest=${selectedTopic}`
      console.log(selectedTopic)
      if(selectedTopic == "fryer"){
        goto("/fgh")
      } else{
      goto(`/`);
      }
    }
  }
</script>

<div class="min-h-screen p-4 md:p-8 flex items-center justify-center">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl">Math Practice Setup</CardTitle>
      <CardDescription>Select your grade and topic to start practicing</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <label for="grade-select" class="text-sm font-medium">Select your grade:</label>
        <Select bind:value={selectedGrade} type="single">
          <SelectTrigger id="grade-select">
            {selectedGrade || "Choose a grade"}
          </SelectTrigger>
          <SelectContent>
            {#each gradeOptions as grade}
              <SelectItem value={grade}>{grade}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      {#if selectedGrade}
        <div class="space-y-2">
          <label for="topic-select" class="text-sm font-medium">Select a contest:</label>
          <Select bind:value={selectedTopic} type="single">
            <SelectTrigger id="topic-select">
                {formatName(selectedTopic) || "Choose a contest"}
            </SelectTrigger>
            <SelectContent>
              {#each topicOptions[selectedGrade as keyof typeof topicOptions] as topic}
                <SelectItem value={topic}>{formatName(topic)}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
      {/if}

      <Button class="w-full" onclick={handleStartPractice} disabled={!selectedGrade || !selectedTopic}>
        Start Practice
      </Button>
    </CardContent>
  </Card>
</div>
