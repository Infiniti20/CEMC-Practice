import type {
	ContestDirectory,
	SequenceQuestion,
} from '$lib/types';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
const jsonFiles: ContestDirectory = import.meta.glob('/static/contest_files/fryer_questions.json', {
	eager: true
});
import { decompress } from 'brotli';

export const POST: RequestHandler = async ({ request, params, url }: RequestEvent) => {
	let questionData: SequenceQuestion;
	let topic = parseInt(url.searchParams.get('topic') ?? '0');
	let contest = url.searchParams.get('contest')?.toLowerCase();

	let data = jsonFiles[`/static/contest_files/${contest}_questions.json`]['data'];
	let question = data[Math.floor(Math.random() * data.length)];
	questionData = JSON.parse(JSON.stringify(question)) as SequenceQuestion;
    if(questionData.base) questionData.base = decodeBase64Compression(questionData.base);
	for (let i = 0; i < questionData.subQuestions.length; i++) {
		questionData.subQuestions[i].html = decodeBase64Compression(questionData.subQuestions[i].html);
		questionData.subQuestions[i].solution = decodeBase64Compression(
			questionData.subQuestions[i].solution
		);
	}
	// questionData.solutions.solution = decodeBase64Compression(questionData.solutions.solution);

	return new Response(JSON.stringify(questionData));
};

function decodeBase64Compression(base64: string): string {
	const compressedBuffer = Buffer.from(base64, 'base64');
	const decompressedBuffer = decompress(compressedBuffer);
	return Buffer.from(decompressedBuffer.buffer).toString();
}
