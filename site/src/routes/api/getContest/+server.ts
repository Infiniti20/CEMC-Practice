import { getQuestionTopics } from '$lib';
import type { ContestDirectory, Question, Stats, TopicStats } from '$lib/types';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
const jsonFiles: ContestDirectory = import.meta.glob('/static/contest_files/*.json', {
	eager: true
});
import { decompress } from 'brotli';

export const POST: RequestHandler = async ({ request, params, url }: RequestEvent) => {
	let contest = url.searchParams.get('contest')?.toLowerCase();
	let year = url.searchParams.get('year');
	let isSequence = url.searchParams.get('sequence') === 'true';

	const c = jsonFiles[`/static/contest_files/${contest}_questions.json`];
	let data = c['data'];

	// Filter by year if provided
	if (year) {
		data = data.filter((question) => question.source.year === parseInt(year));
	}

	// Group questions by number range
	const group1 = data.filter(
		(question) => question.source.number >= 0 && question.source.number <= 9
	);
	const group2 = data.filter(
		(question) => question.source.number >= 10 && question.source.number <= 19
	);
	const group3 = data.filter(
		(question) => question.source.number >= 20 && question.source.number <= 24
	);

	// Function to randomly select items from array
	const selectRandom = (arr: any[], count: number) => {
		const shuffled = [...arr].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, Math.min(count, shuffled.length));
	};

	// Select required number of questions from each group
	const selectedQuestions = [
		...selectRandom(group1, 10),
		...selectRandom(group2, 10),
		...selectRandom(group3, 5)
	];

	// Process each selected question
	selectedQuestions.forEach((question) => {
		if (isSequence && question.subQuestions) {
			// Process sequence question
			if (question.base) question.base = decodeBase64Compression(question.base);
			for (let i = 0; i < question.subQuestions.length; i++) {
				question.subQuestions[i].html = decodeBase64Compression(question.subQuestions[i].html);
				question.subQuestions[i].solution = decodeBase64Compression(
					question.subQuestions[i].solution
				);
			}
		} else {
			// Process regular question
			question.question = decodeBase64Compression(question.question);
			question.solutions.solution = decodeBase64Compression(question.solutions.solution);
		}
	});

	return new Response(
		JSON.stringify({
			questions: selectedQuestions,
			legend: c.legend
		})
	);
};

function decodeBase64Compression(base64: string): string {
	const compressedBuffer = Buffer.from(base64, 'base64');
	const decompressedBuffer = decompress(compressedBuffer);
	return Buffer.from(decompressedBuffer.buffer).toString();
}
