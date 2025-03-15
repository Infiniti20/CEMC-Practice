import { redirect } from '@sveltejs/kit';
import type { Question } from '$lib/types';
import { isSequenceContest } from '$lib';


// const ssr = false;
export async function load({ fetch, params ,cookies }) {
    	const contest = cookies.get('contest');
        if(!contest) redirect(307, '/login');
        if(isSequenceContest(contest)) redirect(307, '/fgh');


    const response = await fetch(`/api/getQuestion?contest=${contest}`, {
        method: "POST",
        body: JSON.stringify({})
    });
    const question: Question = await response.json();
    return {question:question, contest:contest}
}
