<script lang="ts">
	import { CheckCircle, XCircle, Trophy, Activity, Clock } from 'lucide-svelte';

	// Import your custom components
	// Note: You'll need to create these Svelte components separately
	import TopicBadge from '$lib/components/topic-badge.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input/';
	import type { Stats, TopicStats, SequenceStats } from '$lib/types';
	import { isSequenceContest } from '$lib';
	import { getMultipleChoiceStats, getSequenceStats,} from '$lib/stores/statsStore.svelte';
	import { onMount } from 'svelte';

	let { contest, legend }: Props = $props();

	let stats: Stats | SequenceStats = $state(
		isSequenceContest(contest) ? getSequenceStats(contest) : getMultipleChoiceStats(contest)
	);

	onMount(() => {
		stats = isSequenceContest(contest)
			? getSequenceStats(contest)
			: getMultipleChoiceStats(contest);
	});

	interface Props {
		legend: { [key: string]: string };
		contest:string
	}

	function flip(obj: { [key: string]: string }) {
		return Object.keys(obj).reduce(
			(ret, key) => {
				ret[obj[key]] = key;
				return ret;
			},
			{} as { [key: string]: string }
		);
	}

	function convertTopicIndex(topicInt: string) {
		return flip(legend)[topicInt as keyof typeof legend];
	}

	let topicFilter = $state('');
	let sortBy = $state('most_practiced'); // Default sort option

	function sortTopics(entries: [string, TopicStats][], criteria: string) {
		switch (criteria) {
			case 'accuracy':
				return [...entries].sort((a, b) => {
					const aAccuracy = a[1].total > 0 ? a[1].correct / a[1].total : 0;
					const bAccuracy = b[1].total > 0 ? b[1].correct / b[1].total : 0;
					return bAccuracy - aAccuracy;
				});
			case 'time':
				return [...entries].sort((a, b) => a[1].time - b[1].time);
			case 'most_practiced':
			default:
				return [...entries].sort((a, b) => b[1].total - a[1].total);
		}
	}

	function processFilterString(s: string) {
		switch (s) {
			case 'accuracy':
				return 'Accuracy';
			case 'time':
				return 'Time';
			case 'most_practiced':
				return 'Most Practiced';
			default:
				return null;
		}
	}

	function handleSortChange(string: string) {
		sortBy = string;
	}
	let accuracy = $derived(stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);

	let sortedTopics = $derived(
		'topicStats' in stats ? sortTopics(Object.entries(stats.topicStats), sortBy) : []
	);
	let filteredTopics = $derived(
		sortedTopics.filter(([topic]) => {
			return convertTopicIndex(topic).toLowerCase().includes(topicFilter.toLowerCase());
		})
	);
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

	<Card>
		<CardHeader class="p-4 pb-2">
			<CardTitle>Topic Stats</CardTitle>
		</CardHeader>
		<CardContent class="p-4 pt-0">
			<div class="mb-4 flex flex-col sm:flex-row gap-2">
				<Input
					placeholder="Filter topics..."
					value={topicFilter}
					oninput={(e) => {
						if (e.target) {
							topicFilter = (e.target as HTMLInputElement).value;
						}
					}}
					class="flex-grow"
				/>
				<Select onValueChange={handleSortChange} value={sortBy} type="single">
					<SelectTrigger class="w-full sm:w-[180px]">
						<span>{processFilterString(sortBy) ?? 'Sort by'}</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="most_practiced">Most practiced</SelectItem>
						<SelectItem value="accuracy">Highest accuracy</SelectItem>
						<SelectItem value="time">Fastest time</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Accordion type="single">
				{#each filteredTopics as [topic, topicStats]}
					<AccordionItem value={topic}>
						<AccordionTrigger class="hover:no-underline">
							<div class="flex items-center justify-between w-full">
								<TopicBadge topics={{ primaryTopics: [+topic], secondaryTopics: [] }} {legend} />
								<div class="text-sm text-muted-foreground">
									Accuracy: {topicStats.total > 0
										? Math.round((topicStats.correct / topicStats.total) * 100)
										: 0}%
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div class="grid grid-cols-2 gap-2 text-sm pt-2">
								<div>Total: {topicStats.total}</div>
								<div>Correct: {topicStats.correct}</div>
								<div>Incorrect: {topicStats.incorrect}</div>
								<div class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									{topicStats.time.toFixed(1)}m
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				{/each}
			</Accordion>
		</CardContent>
	</Card>

	{#if stats.history.length > 0}
		<Card>
			<CardHeader class="p-4 pb-2">
				<CardTitle>Recent Questions</CardTitle>
			</CardHeader>
			<CardContent class="p-4 pt-0">
				<div class="space-y-2 max-h-60 overflow-y-auto">
					{#each [...stats.history].reverse() as item, index (index)}
						<div class="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
							{#if (typeof item.correct === 'number' ? (item.correct / item.total > 0.5) : item.correct)}
								<CheckCircle class="h-4 w-4 shrink-0 text-green-500" />
							{:else}
								<XCircle class="h-4 w-4 shrink-0 text-red-500" />
							{/if}
							<span class="text-sm truncate flex-grow">{item.question}</span>
							{#if 'total' in item}
								<span class="text-sm truncate flex-grow">{item.correct} / {item.total}</span>
							{/if}
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
