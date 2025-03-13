import { redirect } from '@sveltejs/kit';
import type { SequenceQuestion } from '$lib/types';

// const ssr = false;
export async function load({ fetch, params, cookies }) {
	const contest = cookies.get('contest');
	if (!contest) redirect(307, '/login');

	let question: SequenceQuestion = await (
		await fetch(`/api/getSequence?contest=${contest}`, { method: 'POST', body: JSON.stringify({}) })
	).json();
	return { question: question, contest: contest };
}
