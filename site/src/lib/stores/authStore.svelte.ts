import { supabase } from '$lib/firebase/firebase';
import { browser } from '$app/environment';
import type { User } from '@supabase/supabase-js';
import type { Database } from '$lib/firebase/supabase';

export class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	emailSent = $state(false);

	constructor() {
		if (browser) {
			// Set initial session
			supabase.auth.getUser().then(({ data }) => {
				this.user = data.user;
			});

			// Listen for auth changes
			supabase.auth.onAuthStateChange((event, session) => {
				this.user = session?.user || null;
				this.loading = false;
			});
		}
	}

	async sendLoginLink(email: string, redirectUrl: string) {
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: redirectUrl
				}
			});

			if (error) throw error;

			// Save the email locally to remember the user
			window.localStorage.setItem('emailForSignIn', email);
			this.emailSent = true;
			return { success: true };
		} catch (error) {
			console.error('Error sending sign-in link to email:', error);
			return { success: false, error };
		}
	}

	async signOut() {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			this.emailSent = false;
			return { success: true };
		} catch (error) {
			console.error('Error signing out:', error);
			return { success: false, error };
		}
	}

	isLoggedIn() {
		return !!this.user;
	}

	getUserId() {
		return this.user?.id;
	}

	getUserEmail() {
		return this.user?.email;
	}

	getEmailSentStatus() {
		return this.emailSent;
	}

	resetEmailSentStatus() {
		this.emailSent = false;
	}
}

export const authStore = new AuthStore();
