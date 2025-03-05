import { getQuestionTopics } from '$lib';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
const jsonFiles: ContestDirectory = import.meta.glob('/static/contest_files/*.json', {
	eager: true
});
import { decompress } from 'brotli';

export const POST: RequestHandler = async ({ request, params, url }: RequestEvent) => {
	let questionData;
	let topic = parseInt(url.searchParams.get('topic') ?? '0');
	let contest = url.searchParams.get('contest');

	let data = jsonFiles[`/static/contest_files/${contest}_questions.json`]['data'];
	if (topic == 0) {
		let question = data[Math.floor(Math.random() * data.length)];
		questionData = JSON.parse(JSON.stringify(question));
	} else {
		const body = await request.json();
		let question = selectNextQuestion(data, body as Stats);
		questionData = JSON.parse(JSON.stringify(question));
	}
	questionData.question = decodeBase64Compression(questionData.question);
	questionData.solutions.solution = decodeBase64Compression(questionData.solutions.solution);

	return new Response(JSON.stringify(questionData));
};

function decodeBase64Compression(base64: string): string {
	const compressedBuffer = Buffer.from(base64, 'base64');
	const decompressedBuffer = decompress(compressedBuffer);
	return Buffer.from(decompressedBuffer.buffer).toString();
}

function selectNextQuestion(questions: Question[], userStats: Stats) {
	let totalWeight = 0;
	let weights: number[] = [];

	// Calculate weights for each question
	for (let i = 0; i < questions.length; i++) {
		let question = questions[i];
		let topic = question.topics;
		let difficulty = 100 - question.percentage_correct;

		// Get user statistics
		let topicWeight = 0.85;
		let timeFactorWeight = 1;
		if (topic) {
			let s = getStatsPerQuestionTopics(topic, userStats.topicStats);
			let topicAccuracy = s.accuracy;
			let avgTimeForTopic = s.time;
			let overallAvgTime = userStats.time / userStats.total;
			topicWeight = 1 - topicAccuracy; // Lower accuracy → higher weight
			timeFactorWeight = Math.min(1.5, avgTimeForTopic / overallAvgTime);
		}

		// Calculate component weights

		// Adjust by difficulty (harder questions get higher weights if struggling)
		let difficultyWeight = Math.log(difficulty / 2) + 1;

		// Time factor (spend more time on topics taking longer)

		// Calculate final question weight
		let weight = topicWeight * difficultyWeight * timeFactorWeight;
	

		// Apply decay to recently answered questions

		weights.push(weight);
		totalWeight += weight;
	}

	// Normalize weights to probability distribution
	for (let i = 0; i < weights.length; i++) {
		weights[i] = weights[i] / totalWeight;
	}

	// Select a question based on weights (weighted random selection)
	return weightedRandomSelection(questions, weights);
}
function weightedRandomSelection(questions: Question[], weights: number[]) {
	let r = Math.random();
	let cumulativeWeight = 0;

	for (let i = 0; i < weights.length; i++) {
		cumulativeWeight += weights[i];
		if (r <= cumulativeWeight) return questions[i];
	}
}

function getStatsPerQuestionTopics(
	topics: {
		primaryTopics: number[];
		secondaryTopics: number[];
	},
	stats: { [key: string]: TopicStats }
) {
	let topicList = getQuestionTopics(topics);
	let avgAccuracy = 0;
	let avgTime = 1;
	for (let i = 0; i < topicList.length; i++) {
		let t = topicList[i].toString();
		if (stats[t]) {
			avgAccuracy += stats[t].correct / stats[t].total;
			avgTime += stats[t].time / stats[t].total;
		}
	}
	avgTime = avgTime / topicList.length;
	avgAccuracy = avgAccuracy / topicList.length;
	return { time: avgTime, accuracy: avgAccuracy };
}
