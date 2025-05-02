import { browser } from '$app/environment';
import type { Stats, SequenceStats } from '$lib/types';
import { supabase } from '$lib/firebase/firebase';
import { authStore } from '$lib/stores/authStore.svelte';
import type { Database } from '$lib/firebase/supabase';

// Default values for stats
const DEFAULT_STATS = {
	total: 0,
	correct: 0,
	incorrect: 0,
	streak: 0,
	history: [],
	topicStats: {},
	time: 0
};

// Store registries to track created stores by contest, now storing $state runes
const multipleChoiceStoresRegistry = new Map<string, Stats>(); // Using Stats type hint, but will hold $state<Stats>
const sequenceStoresRegistry = new Map<string, SequenceStats>(); // Using SequenceStats type hint, but will hold $state<SequenceStats>

// Helper function to generate store keys
function getStoreKey(type: 'mc' | 'seq', contest: string): string {
	return `stats_${type}_${contest}`;
}

// Functions to load from localStorage
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
	if (!browser) return defaultValue;

	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : defaultValue;
	} catch (e) {
		console.error(`Failed to load stats from localStorage for ${key}:`, e);
		return defaultValue;
	}
}

// Functions to save to localStorage
function saveToLocalStorage<T>(key: string, value: T): void {
	if (!browser) return;

	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(`Failed to save stats to localStorage for ${key}:`, e);
	}
}

// Function to load stats from Supabase
async function loadFromSupabase<T extends Stats | SequenceStats>(
	key: string,
	currentStatsRune: T
): Promise<void> {
	if (!browser || !authStore.isLoggedIn()) return;

	try {
		const userId = authStore.getUserId();
		if (!userId) {
			throw new Error('No user ID found');
		}

		const { data, error } = await supabase
			.from('user_stats')
			.select('stats_data')
			.eq('user_id', userId)
			.eq('key', key)
			.single();

		let statsToUse: T;

		if (error) {
			if (error.code === 'PGRST116') {
				// No data found
				// If local data has progress, push it to Supabase
				if (currentStatsRune.total > 0) {
					await saveToSupabase(key, currentStatsRune);
				}
				return; // Keep local/default data
			}
			throw error;
		}

		if (data) {
			const supabaseData = data.stats_data as unknown as T;
			const localTotal = currentStatsRune.total || 0;
			const supabaseTotal = supabaseData.total || 0;

			// Prioritize data with more progress
			if (supabaseTotal >= localTotal) {
				statsToUse = supabaseData;
			} else {
				statsToUse = currentStatsRune;
				// Push local data to Supabase as it's more up-to-date
				await saveToSupabase(key, currentStatsRune);
			}
		} else {
			// No data in Supabase, use local and push if necessary
			statsToUse = currentStatsRune;
			if (currentStatsRune.total > 0) {
				await saveToSupabase(key, currentStatsRune);
			}
		}

		// Update the properties of the existing rune
		Object.assign(currentStatsRune, statsToUse);
	} catch (e) {
		console.error(`Failed to load/sync stats from Supabase for ${key}:`, e);
	}
}

// Function to save stats to Supabase
async function saveToSupabase<T>(key: string, value: T): Promise<void> {
	if (!browser || !authStore.isLoggedIn()) return;

	try {
		const userId = authStore.getUserId();
		if (!userId) {
			throw new Error('No user ID found');
		}

		const dataToSave: Database['public']['Tables']['user_stats']['Insert'] = {
			user_id: userId,
			key: key,
			stats_data:
				value as unknown as Database['public']['Tables']['user_stats']['Insert']['stats_data'],
			last_updated: new Date().toISOString()
		};

		// Upsert operation - insert if not exists, update if exists
		const { error } = await supabase
			.from('user_stats')
			.upsert(dataToSave, { onConflict: 'user_id,key' });

		if (error) throw error;
	} catch (e) {
		console.error(`Failed to save stats to Supabase for ${key}:`, e);
	}
}

// Function to sync all existing stores with Supabase
async function syncStoresWithSupabase() {
	if (!browser || !authStore.isLoggedIn()) return;

	console.log('Syncing stores with Supabase...');

	// Sync all existing multiple choice stores
	for (const [key, statsRune] of multipleChoiceStoresRegistry.entries()) {
		await loadFromSupabase(key, statsRune); // Pass the rune itself
	}

	// Sync all existing sequence stores
	for (const [key, statsRune] of sequenceStoresRegistry.entries()) {
		await loadFromSupabase(key, statsRune); // Pass the rune itself
	}
	console.log('Sync complete.');
}

// Function to get multiple choice stats for a specific contest
export function getMultipleChoiceStats(contest: string): Stats {
	const storeKey = getStoreKey('mc', contest);

	// Check if we already have this store rune in memory
	if (!multipleChoiceStoresRegistry.has(storeKey)) {
		// Load from localStorage first
		const initialValue = loadFromLocalStorage<Stats>(storeKey, { ...DEFAULT_STATS } as Stats);

		// Create a $state rune with the initial value
		const statsRune = $state(initialValue);

		// Store the rune in the registry
		multipleChoiceStoresRegistry.set(storeKey, statsRune);

		// Async load/sync from Supabase if available
		if (browser && authStore.isLoggedIn()) {
			loadFromSupabase<Stats>(storeKey, statsRune); // Pass the rune
		}
	}
	// Return the rune from the registry
	return multipleChoiceStoresRegistry.get(storeKey)!;
}

// Function to get sequence stats for a specific contest
export function getSequenceStats(contest: string): SequenceStats {
	const storeKey = getStoreKey('seq', contest);

	// Check if we already have this store rune in memory
	if (!sequenceStoresRegistry.has(storeKey)) {
		// Load from localStorage first
		const initialValue = loadFromLocalStorage<SequenceStats>(storeKey, {
			...DEFAULT_STATS
		} as SequenceStats);

		// Create a $state rune
		const statsRune = $state(initialValue);

		// Store the rune in the registry
		sequenceStoresRegistry.set(storeKey, statsRune);

		// Async load/sync from Supabase if available
		if (browser && authStore.isLoggedIn()) {
			loadFromSupabase<SequenceStats>(storeKey, statsRune); // Pass the rune
		}
	}
	// Return the rune from the registry
	return sequenceStoresRegistry.get(storeKey)!;
}

// Function to update multiple choice stats
export function updateMultipleChoiceStats(contest: string, newStats: Stats): void {
	const storeKey = getStoreKey('mc', contest);
	// Get the reactive rune (this ensures it exists)
	const statsRune = getMultipleChoiceStats(contest);

	// Update the properties of the rune directly
	Object.assign(statsRune, newStats);

	// Save to localStorage
	saveToLocalStorage(storeKey, newStats);

	// Save to Supabase if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToSupabase(storeKey, newStats);
	}
}

// Function to update sequence stats
export function updateSequenceStats(contest: string, newStats: SequenceStats): void {
	const storeKey = getStoreKey('seq', contest);
	// Get the reactive rune
	const statsRune = getSequenceStats(contest);

	// Update the properties of the rune directly
	Object.assign(statsRune, newStats);

	// Save to localStorage
	saveToLocalStorage(storeKey, newStats);

	// Save to Supabase if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToSupabase(storeKey, newStats);
	}
}

// Function to reset multiple choice stats
export function resetMultipleChoiceStats(contest: string): void {
	const storeKey = getStoreKey('mc', contest);
	const resetStats = { ...DEFAULT_STATS } as Stats;
	// Get the reactive rune
	const statsRune = getMultipleChoiceStats(contest);

	// Update the properties of the rune directly
	Object.assign(statsRune, resetStats);

	// Remove from localStorage
	if (browser) {
		localStorage.removeItem(storeKey);
	}

	// Reset in Supabase if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToSupabase(storeKey, resetStats); // Save the default state
	}
}

// Function to reset sequence stats
export function resetSequenceStats(contest: string): void {
	const storeKey = getStoreKey('seq', contest);
	const resetStats = { ...DEFAULT_STATS } as SequenceStats;
	// Get the reactive rune
	const statsRune = getSequenceStats(contest);

	// Update the properties of the rune directly
	Object.assign(statsRune, resetStats);

	// Remove from localStorage
	if (browser) {
		localStorage.removeItem(storeKey);
	}

	// Reset in Supabase if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToSupabase(storeKey, resetStats); // Save the default state
	}
}

// Initialize sync with Supabase - to be called from components
export function setupAuthSync() {
	let lastAuthState = false;

	if (browser) {
		$effect(() => {
			const isLoggedIn = authStore.isLoggedIn();
			const loadingChanged = authStore.loading === false;

			// Only trigger when auth state changes from not logged in to logged in
			if (isLoggedIn && !lastAuthState && loadingChanged) {
				syncStoresWithSupabase();
			}

			lastAuthState = isLoggedIn;
		});
	}
}
