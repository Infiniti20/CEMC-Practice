import { redirect } from '@sveltejs/kit';
import type { SequenceQuestion } from '$lib/types';
import { isSequenceContest } from '$lib';

// const ssr = false;
export async function load({ fetch, params, cookies }) {
	const contest = cookies.get('contest');
	if (!contest) redirect(307, '/login');
	if(!isSequenceContest(contest)) redirect(307,"/")

	    const response = await fetch(`/api/getSequence?contest=${contest}`, {
				method: 'POST',
				body: JSON.stringify({})
			});
			    const { question, legend }: { question: SequenceQuestion; legend: { [key: string]: string } } =
						await response.json();

	return { question: question, contest: contest,legend };
}
