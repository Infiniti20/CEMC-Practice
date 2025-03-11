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
	percentage_correct:number;
	type: "Question";
};
type SequenceQuestion = {
	base: string;
	subQuestions: SubQuestion[];
	source: {
		year: number;
		number: number;
	};
	type: "SequenceQuestion";
};
type SubQuestion = {
	solution: string;
	type: "full" | "short";
	html:string;
	points: number;
}
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
	history: { question: string; correct: boolean; }[];
	topicStats: { [key: string]: TopicStats };
	time:number;
}
interface SequenceStats {
	total: number;
	correct: number;
	incorrect: number;
	streak: number;
	history: { question: string;correct:number,total:number }[];
	time: number;
}

export type {Question, SubQuestion, SequenceQuestion,Stats,TopicStats,SequenceStats, ContestDirectory}