import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
const jsonFiles: ContestDirectory = import.meta.glob('/static/contest_files/*.json', {
	eager: true
});
import { decompress } from 'brotli';

export const GET: RequestHandler = async ({ request, params, url }: RequestEvent) => {
	let topic = parseInt(url.searchParams.get('topic') ?? '0');
	let contest = url.searchParams.get('contest');
	let data = jsonFiles[`/static/contest_files/${contest}_questions.json`]['data'].filter((e) => {
		if (topic == 0) {
			return true;
		}
		if (e.topics) {
			if (e.topics.primaryTopics.includes(topic) || e.topics.secondaryTopics.includes(topic)) {
				return true;
			} else {
				return false;
			}
		}
		return Math.random() > 0.5 ? true : false;
	});
	const question = data[Math.floor(Math.random() * data.length)];
	const questionData = question;
	questionData.question = decodeBase64Compression(questionData.question);
	questionData.solutions.solution = decodeBase64Compression(questionData.solutions.solution);

	return new Response(JSON.stringify(questionData));
};

function decodeBase64Compression(base64: string): string {
	const compressedBuffer = Buffer.from(base64, 'base64');
	const decompressedBuffer = decompress(compressedBuffer);
	return Buffer.from(decompressedBuffer.buffer).toString();
}
