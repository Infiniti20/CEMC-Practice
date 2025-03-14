import { auth } from '$lib/firebase/firebase';
import {
	sendSignInLinkToEmail,
	isSignInWithEmailLink,
	signInWithEmailLink,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

export class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	emailSent = $state(false);

	constructor() {
		if (browser) {
			onAuthStateChanged(auth, (user) => {
				this.user = user;
				this.loading = false;
			});

			// Check if the URL contains an email signin link
			this.checkEmailLink();
		}
	}

	async checkEmailLink() {
		if (browser && isSignInWithEmailLink(auth, window.location.href)) {
			let email = window.localStorage.getItem('emailForSignIn');

			if (!email) {
				// If we can't find the email, prompt the user for it
				email = window.prompt('Please provide your email for confirmation');
			}

			if (email) {
				this.loading = true;
				try {
					await signInWithEmailLink(auth, email, window.location.href);
					window.localStorage.removeItem('emailForSignIn');
					// Remove the email link parameters from the URL
					window.history.replaceState(null, '', window.location.pathname);
				} catch (error) {
					console.error('Error signing in with email link:', error);
				} finally {
					this.loading = false;
				}
			}
		}
	}

	async sendLoginLink(email: string, redirectUrl: string) {
		try {
			await sendSignInLinkToEmail(auth, email, {
				url: redirectUrl,
				handleCodeInApp: true
			});

			// Save the email locally to remember the user when they come back
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
			await firebaseSignOut(auth);
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
		return this.user?.uid;
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
