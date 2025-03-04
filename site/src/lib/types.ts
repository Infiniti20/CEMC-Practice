type Question = {
	question: string;
	answers: string[];
	solutions: {
		solution: string;
		ans: string;
	};
	topics?: {
		primaryTopics: number[];
		secondaryTopics: number[];
	};
	source: {
		year: number;
		number: number;
	};
	percentage_correct:number
};
type ContestFile = {
	data: Question[];
	legend: {
		[key: string]: number;
	};
};

type ContestDirectory = {
	[key: string]: ContestFile;
};
interface TopicStats {
	total: number;
	correct: number;
	incorrect: number;
	time: number;
}

interface Stats {
	total: number;
	correct: number;
	incorrect: number;
	streak: number;
	history: { question: string; correct: boolean; topics: number[] }[];
	topicStats: { [key: number]: TopicStats };
}