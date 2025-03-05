import { redirect } from '@sveltejs/kit';

const ssr = false;
export async function load({ fetch, params ,cookies }) {
    	const contest = cookies.get('contest');
        if(!contest) redirect(307, '/login');


    let question: Question = (await (await fetch(`/api/getQuestion?contest=${contest}`,{method:"POST",body:JSON.stringify({})})).json());
    return {question:question, contest:contest}
}
