import { redirect } from '@sveltejs/kit';
import type { Question, SequenceQuestion } from '$lib/types';
import { isSequenceContest } from '$lib';


// const ssr = false;
export async function load({ fetch, params ,cookies }) {
    	const contest = cookies.get('contest');
        if(!contest) redirect(307, '/login');
        let verb = "Question"
        if(isSequenceContest(contest)) verb = "Sequence";


    const response = await fetch(`/api/get${verb}?contest=${contest}`, {
        method: "POST",
        body: JSON.stringify({})
    });
    const {question, legend}:{question:Question|SequenceQuestion, legend:{[key:string]:string}} = await response.json();
    return {question:question, contest:contest,legend:legend}
}
