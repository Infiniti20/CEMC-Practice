<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { CheckCircle, XCircle, Trophy, Activity } from "lucide-svelte";

  interface StatsData {
    total: number;
    correct: number;
    incorrect: number;
    streak: number;
    history: { question: string; correct: boolean }[];
  }

  interface Props {
    stats: StatsData;
  }

  let { stats }: Props = $props();

  let accuracy = $derived(stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);
</script>

<div class="space-y-6">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm text-muted-foreground">Total</CardTitle>
      </CardHeader>
      <CardContent class="p-4 pt-0">
        <div class="text-2xl font-bold">{stats.total}</div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm text-muted-foreground">Correct</CardTitle>
      </CardHeader>
      <CardContent class="p-4 pt-0 flex items-center gap-2">
        <div class="text-2xl font-bold">{stats.correct}</div>
        <CheckCircle class="h-5 w-5 text-green-500" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm text-muted-foreground">Incorrect</CardTitle>
      </CardHeader>
      <CardContent class="p-4 pt-0 flex items-center gap-2">
        <div class="text-2xl font-bold">{stats.incorrect}</div>
        <XCircle class="h-5 w-5 text-red-500" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle class="text-sm text-muted-foreground">Accuracy</CardTitle>
      </CardHeader>
      <CardContent class="p-4 pt-0 flex items-center gap-2">
        <div class="text-2xl font-bold">{accuracy}%</div>
        <Activity class="h-5 w-5 text-blue-500" />
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader class="p-4 pb-2">
      <CardTitle class="flex items-center gap-2">
        <Trophy class="h-5 w-5 text-amber-500" />
        Current Streak: {stats.streak}
      </CardTitle>
    </CardHeader>
  </Card>

  {#if stats.history.length > 0}
    <Card>
      <CardHeader class="p-4 pb-2">
        <CardTitle>Recent Questions</CardTitle>
      </CardHeader>
      <CardContent class="p-4 pt-0">
        <div class="space-y-2 max-h-60 overflow-y-auto">
          {#each [...stats.history].reverse() as item, index}
            <div class="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              {#if item.correct}
                <CheckCircle class="h-4 w-4 shrink-0 text-green-500" />
              {:else}
                <XCircle class="h-4 w-4 shrink-0 text-red-500" />
              {/if}
              <span class="text-sm truncate">{item.question}</span>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>