import { browser } from '$app/environment';
import type { Stats, SequenceStats } from '$lib/types';

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

// LocalStore class with generic type support
export class LocalStore<T> {
	value = $state<T>() as T;
	key = '';

	constructor(key: string, initialValue: T) {
		this.key = key;
		this.value = initialValue;

		if (browser) {
			try {
				const item = localStorage.getItem(key);
				if (item) this.value = JSON.parse(item);
			} catch (e) {
				console.error(`Failed to load stats from localStorage for ${key}:`, e);
			}
		}
	}

	// Setup the effect when the store is actually used in a component
	setupEffect() {
		if (browser) {
			$effect(() => {
				try {
					localStorage.setItem(this.key, JSON.stringify(this.value));
				} catch (e) {
					console.error(`Failed to save stats to localStorage for ${this.key}:`, e);
				}
			});
		}
	}

	update(newStats: Partial<T>) {
		this.value = { ...this.value, ...newStats };
	}

	get(): T {
		return this.value;
	}

	reset() {
		this.value = { ...DEFAULT_STATS } as unknown as T;
		if (browser) {
			localStorage.removeItem(this.key);
		}
	}

	load() {
		if (browser) {
			try {
				const savedStats = localStorage.getItem(this.key);
				if (savedStats) {
					this.value = JSON.parse(savedStats);
				}
			} catch (e) {
				console.error(`Failed to load stats from localStorage for ${this.key}:`, e);
			}
		}
	}
}

// Helper function to create stats stores
export function createStatsStore<T extends Stats | SequenceStats>(key: string) {
	return new LocalStore<T>(key, { ...DEFAULT_STATS } as unknown as T);
}

// Create and export the specific stores
export const multipleChoiceStats = createStatsStore<Stats>('mathPracticeStats');
export const sequenceStats = createStatsStore<SequenceStats>('fghStats');
