<script lang="ts">
  import {Badge} from "$lib/components/ui/badge";

  interface Props{
    topics?:{
    primaryTopics: number[]
    secondaryTopics: number[]
    }
  }
	let { topics }: Props = $props();
    let fullTopicsArray;
    if(topics){
        fullTopicsArray =    = [...topics.primaryTopics,...topics.secondaryTopics]
    }
  const topicColors = {
    Addition: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    Subtraction: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Multiplication: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    Division: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    Exponents: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    Percentages: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    "Order of Operations": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  };
</script>

<div class="flex flex-wrap gap-2">
  {#each fullTopicsArray as topic}
    <Badge class={`${topicColors[topic] || 'bg-gray-800 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} font-medium`}>
      {topic}
    </Badge>
  {/each}
</div>
