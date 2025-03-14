<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { CheckCircle, ChartBar, SwitchCamera } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { formatName } from '$lib';
	import StatsDisplay from './stats-display.svelte';
	import type { Stats, SequenceStats } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	interface Props {
		contest: string;
		stats: Stats | SequenceStats;
		activeTab?: 'practice' | 'stats';
		children: Snippet;
		statsContent?: Snippet;
	}
	let { contest, stats, activeTab = 'practice', children, statsContent }: Props = $props();
</script>

<main class="min-h-screen p-4 md:p-8 flex items-center justify-center">
	<Card class="w-full max-w-3xl">
		<CardHeader>
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<CardTitle class="text-2xl">{formatName(contest)} Contest Practice</CardTitle>
					<CardDescription
						>Solve math problems and track your progress. 
						{#if authStore.isLoggedIn()}
						<br />
						({authStore.getUserEmail()})
						{/if}
					</CardDescription>
				</div>
				<Button variant="outline" onclick={() => goto('/login')}>
					<SwitchCamera class="mr-2 h-4 w-4" />
					Switch Contests
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<Tabs value={activeTab}>
				<TabsList class="mb-4">
					<TabsTrigger value="practice" data-value="practice">Practice</TabsTrigger>
					<TabsTrigger value="stats">
						<ChartBar class="h-4 w-4 mr-2" />
						Stats
					</TabsTrigger>
				</TabsList>

				<TabsContent value="practice" class="mt-0">
					<div class="space-y-6">
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<span class="font-medium">Streak:</span>
								<span class="flex items-center gap-1">
									{stats.streak}
									<CheckCircle class="h-4 w-4 text-green-500" />
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-medium">Accuracy:</span>
								<Progress
									value={stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}
									class="w-24 h-2"
								/>
								<span>{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</span
								>
							</div>
						</div>
						{@render children()}
					</div>
				</TabsContent>

				<TabsContent value="stats" class="mt-0">
					<StatsDisplay {stats} />
					{@render statsContent?.()}
				</TabsContent>
			</Tabs>
		</CardContent>
	</Card>
</main>
