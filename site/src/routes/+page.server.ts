
const ssr = false;
export async function load({ fetch, params, getClientAddress }) {
    let question: Question = (await (await fetch(`/api/getQuestion?contest=pascal`,{method:"POST",body:JSON.stringify({})})).json());
    return question
}
