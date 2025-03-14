import { browser } from '$app/environment';
import type { Stats, SequenceStats } from '$lib/types';
import { db } from '$lib/firebase/firebase';
import { authStore } from '$lib/stores/authStore.svelte';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

// Store registries to track created stores by contest
const multipleChoiceStoresRegistry = new Map<string, Stats>();
const sequenceStoresRegistry = new Map<string, SequenceStats>();

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

// Function to load stats from Firestore
async function loadFromFirestore<T>(key: string, value: T): Promise<T> {
	if (!browser || !authStore.isLoggedIn()) return value;

	try {
		const userId = authStore.getUserId();
		if (!userId) {
			throw new Error('No user ID found');
		}

		const docRef = doc(db, 'userStats', userId, 'stats', key);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const firestoreData = docSnap.data() as T;
			// Merge with local data, prioritizing the one with more total questions
			const localTotal = (value as any).total || 0;
			const firestoreTotal = (firestoreData as any).total || 0;

			if (firestoreTotal >= localTotal) {
				return firestoreData;
			}
		}

		// If Firestore data doesn't exist or local data is more recent
		if ((value as any).total > 0) {
			// Push local data to Firestore
			await saveToFirestore(key, value);
		}

		return value;
	} catch (e) {
		console.error(`Failed to load stats from Firestore for ${key}:`, e);
		return value;
	}
}

// Function to save stats to Firestore
async function saveToFirestore<T>(key: string, value: T): Promise<void> {
	if (!browser || !authStore.isLoggedIn()) return;

	try {
		const userId = authStore.getUserId();
		if (!userId) {
			throw new Error('No user ID found');
		}

		const docRef = doc(db, 'userStats', userId, 'stats', key);
		const docSnap = await getDoc(docRef);

		const dataToSave = {
			...value,
			lastUpdated: serverTimestamp()
		};

		if (docSnap.exists()) {
			await updateDoc(docRef, dataToSave);
		} else {
			await setDoc(docRef, dataToSave);
		}
	} catch (e) {
		console.error(`Failed to save stats to Firestore for ${key}:`, e);
	}
}

// Function to sync all existing stores with Firestore
async function syncStoresWithFirestore() {
	if (!browser || !authStore.isLoggedIn()) return;

	// Sync all existing multiple choice stores
	for (const [key, stats] of multipleChoiceStoresRegistry.entries()) {
		const updatedStats = await loadFromFirestore(key, stats);
		multipleChoiceStoresRegistry.set(key, updatedStats);
	}

	// Sync all existing sequence stores
	for (const [key, stats] of sequenceStoresRegistry.entries()) {
		const updatedStats = await loadFromFirestore(key, stats);
		sequenceStoresRegistry.set(key, updatedStats);
	}
}

// Function to get multiple choice stats for a specific contest
export function getMultipleChoiceStats(contest: string): Stats {
	const storeKey = getStoreKey('mc', contest);

	// Check if we already have this store in memory
	if (!multipleChoiceStoresRegistry.has(storeKey)) {
		// Load from localStorage first
		const initialValue = loadFromLocalStorage<Stats>(storeKey, { ...DEFAULT_STATS } as Stats);

		// Store in registry
		multipleChoiceStoresRegistry.set(storeKey, initialValue);

		// Async load from Firestore if available
		if (browser && authStore.isLoggedIn()) {
			loadFromFirestore<Stats>(storeKey, initialValue).then((updatedStats) => {
				multipleChoiceStoresRegistry.set(storeKey, updatedStats);
			});
		}
	}

	return multipleChoiceStoresRegistry.get(storeKey) || ({ ...DEFAULT_STATS } as Stats);
}

// Function to get sequence stats for a specific contest
export function getSequenceStats(contest: string): SequenceStats {
	const storeKey = getStoreKey('seq', contest);

	// Check if we already have this store in memory
	if (!sequenceStoresRegistry.has(storeKey)) {
		// Load from localStorage first
		const initialValue = loadFromLocalStorage<SequenceStats>(storeKey, {
			...DEFAULT_STATS
		} as SequenceStats);

		// Store in registry
		sequenceStoresRegistry.set(storeKey, initialValue);

		// Async load from Firestore if available
		if (browser && authStore.isLoggedIn()) {
			loadFromFirestore<SequenceStats>(storeKey, initialValue).then((updatedStats) => {
				sequenceStoresRegistry.set(storeKey, updatedStats);
			});
		}
	}

	return sequenceStoresRegistry.get(storeKey) || ({ ...DEFAULT_STATS } as SequenceStats);
}

// Function to update multiple choice stats
export function updateMultipleChoiceStats(contest: string, newStats: Partial<Stats>): void {
	const storeKey = getStoreKey('mc', contest);
	const currentStats = getMultipleChoiceStats(contest);
	const updatedStats = { ...currentStats, ...newStats };

	// Update in memory
	multipleChoiceStoresRegistry.set(storeKey, updatedStats);

	// Save to localStorage
	saveToLocalStorage(storeKey, updatedStats);

	// Save to Firestore if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToFirestore(storeKey, updatedStats);
	}
}

// Function to update sequence stats
export function updateSequenceStats(contest: string, newStats: Partial<SequenceStats>): void {
	const storeKey = getStoreKey('seq', contest);
	const currentStats = getSequenceStats(contest);
	const updatedStats = { ...currentStats, ...newStats };

	// Update in memory
	sequenceStoresRegistry.set(storeKey, updatedStats);

	// Save to localStorage
	saveToLocalStorage(storeKey, updatedStats);

	// Save to Firestore if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToFirestore(storeKey, updatedStats);
	}
}

// Function to reset multiple choice stats
export function resetMultipleChoiceStats(contest: string): void {
	const storeKey = getStoreKey('mc', contest);
	const resetStats = { ...DEFAULT_STATS } as Stats;

	// Update in memory
	multipleChoiceStoresRegistry.set(storeKey, resetStats);

	// Remove from localStorage
	if (browser) {
		localStorage.removeItem(storeKey);
	}

	// Reset in Firestore if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToFirestore(storeKey, resetStats);
	}
}

// Function to reset sequence stats
export function resetSequenceStats(contest: string): void {
	const storeKey = getStoreKey('seq', contest);
	const resetStats = { ...DEFAULT_STATS } as SequenceStats;

	// Update in memory
	sequenceStoresRegistry.set(storeKey, resetStats);

	// Remove from localStorage
	if (browser) {
		localStorage.removeItem(storeKey);
	}

	// Reset in Firestore if user is logged in
	if (browser && authStore.isLoggedIn()) {
		saveToFirestore(storeKey, resetStats);
	}
}

// Initialize sync with Firebase - to be called from components
export function setupAuthSync() {
	let lastAuthState = false;

	if (browser) {
		$effect(() => {
			const isLoggedIn = authStore.isLoggedIn();
			const loadingChanged = authStore.loading === false;

			// Only trigger when auth state changes from not logged in to logged in
			if (isLoggedIn && !lastAuthState && loadingChanged) {
				syncStoresWithFirestore();
			}

			lastAuthState = isLoggedIn;
		});
	}
}
