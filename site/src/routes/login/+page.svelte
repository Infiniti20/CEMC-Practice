<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		CardFooter
	} from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { formatName } from '$lib';
	import { authStore } from '$lib/stores/authStore.svelte';

	let selectedGrade = '';
	let selectedTopic = '';
	let loading = false;
	let email = '';

	const gradeOptions = ['7th Grade', '8th Grade', '9th Grade', '10th Grade'];

	const topicOptions = {
		'9th Grade': ['pascal', 'fryer'],
		'7th Grade': ['gauss7'],
		'8th Grade': ['Linear Equations', 'Functions', 'Pythagorean Theorem']
	};

	onMount(() => {
		// Check if user came back via an email link
		if (authStore.isLoggedIn() && selectedGrade && selectedTopic) {
			handleStartPractice();
		}
	});

	function handleStartPractice() {
		if (selectedGrade && selectedTopic) {
			document.cookie = `contest=${selectedTopic}`;
			console.log(selectedTopic);
			if (selectedTopic == 'fryer') {
				goto('/fgh');
			} else {
				goto(`/`);
			}
		}
	}

	async function handleEmailLogin() {
		if (!email) return;

		loading = true;
		// Generate the current URL as the redirect URL
		const redirectUrl = window.location.href;
		const result = await authStore.sendLoginLink(email, redirectUrl);
		loading = false;
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
						{selectedGrade || 'Choose a grade'}
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
							{formatName(selectedTopic) || 'Choose a contest'}
						</SelectTrigger>
						<SelectContent>
							{#each topicOptions[selectedGrade as keyof typeof topicOptions] as topic}
								<SelectItem value={topic}>{formatName(topic)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}

			<Button
				class="w-full"
				onclick={handleStartPractice}
				disabled={!selectedGrade || !selectedTopic || loading}
			>
				{loading ? 'Loading...' : 'Start Practice'}
			</Button>

			<div class="flex items-center my-4">
				<Separator class="flex-1" />
				<div class="mx-2 text-sm text-muted-foreground">or</div>
				<Separator class="flex-1" />
			</div>

			{#if authStore.getEmailSentStatus()}
				<Alert>
					<AlertTitle>Email Sent!</AlertTitle>
					<AlertDescription>
						Check your email for a sign-in link. Follow it on the device you want to sign in with.
					</AlertDescription>
				</Alert>
			{:else if !authStore.isLoggedIn()}
				<div class="space-y-2">
					<label for="email-input" class="text-sm font-medium">Sign in with email:</label>
					<div class="flex gap-2">
						<Input
							id="email-input"
							type="email"
							placeholder="Enter your email"
							bind:value={email}
							class="flex-1"
							disabled={loading}
						/>
						<Button onclick={handleEmailLogin} disabled={!email || loading} variant="outline">
							{loading ? 'Sending...' : 'Send Link'}
						</Button>
					</div>
				</div>
			{/if}

			{#if authStore.isLoggedIn()}
				<CardFooter class="p-0 mt-4 flex justify-center">
					<Button
						variant="ghost"
						class="text-xs text-muted-foreground hover:text-foreground"
						onclick={() => authStore.signOut()}
					>
						Sign out
					</Button>
				</CardFooter>
			{/if}
		</CardContent>
	</Card>
</div>
