import type { ContestDirectory, SequenceQuestion, SubQuestion } from '$lib/types';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { API_KEY } from '$env/static/private';

const genAI = new GoogleGenerativeAI(API_KEY);
const schema = {
	description: 'Graded solution',
	type: SchemaType.OBJECT,
	properties: {
		explanation: {
			type: SchemaType.STRING,
			description: 'Explanation of why this mark was given',
			nullable: false
		},
		mark: {
			type: SchemaType.NUMBER,
			description: 'Mark given to the solution',
			nullable: false
		}
	},
	required: ['mark', 'explanation'] as string[]
} as const;
const base =
	'Use the following criteria to judge the given answer based on the solution. Return an appropriate mark out of the given number of marks. Provide an explanation based on answer given by the user. The reasoning does not have to be the exact same as the solution. DO NOT AWARD PARTIAL CREDIT FOR ATTEMPTING';

const model = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash',
	systemInstruction:base,
	generationConfig: {
		responseMimeType: 'application/json',
		responseSchema: schema
	}
});

const shortAnswer = `
    Full marks are given for a correct answer.
    Part marks are awarded if relevant work is shown. 
	If the answer is correct but relevant work is not shown, it is still full marks.
`;

const fullAnswer = `
Marks awarded for completeness, clarity, and style of presentation.
A correct solution poorly presented will not earn full marks.
provide a well-organized solution. Use mathematical statements and words to explain all of the steps of your solution.`;

export const POST: RequestHandler = async ({ request, params, url }: RequestEvent) => {
	const body = await request.json();
	const questions: SubQuestion[] = body.subQuestions;
	let results = []
	for (let i = 0; i < body.answers.length; i++) {
		if (body.answers[i]) {
			const prompt =
				(questions[i].type == 'full' ? fullAnswer : shortAnswer) +
				`This question is worth ${questions[i].points} marks. The question is ${questions[i].html}. The correct solution is ${questions[i].solution}. The answer given by the user is ${body.answers[i]}. Do not award partial marks for just submitting  numerical answer.`;
			const result = await model.generateContent(prompt);
			results.push(JSON.parse(result.response.text()));
		}
	}

	return new Response(JSON.stringify(results));
};
