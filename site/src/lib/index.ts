import { math, display } from 'mathlifier';
import type { Question } from './types';


function remove(str: string, pattern: string | RegExp): string {
	return str.replaceAll(pattern, '');
}

// TODO: Implement isAnswerCorrect globally
function isAnswerCorrect(question: Question, option:string) {

	if(Number.isNaN(parseInt(question.solutions.ans))){
		let correctIndex = question.solutions.ans.charCodeAt(0)-65
		let index = question.answers.indexOf(option)

		if(index <0){return false}

		return correctIndex == index

		
	} else {
		    const normalizedUserAnswer = option.trim().toLowerCase().replace(/\s+/g, '');
				const normalizedCorrectAnswer = question.solutions.ans.trim().toLowerCase().replace(/\s+/g, '');
				return normalizedUserAnswer === normalizedCorrectAnswer;

	}
}

function generateQuestionTopic(accuracy: { [key: string]: number }) {}

function addMathInline(html: string) {
	html = remove(html,/\\mbox/g)
	let newHtml = html.replaceAll(
		/<span class="math inline">(.*?)<\/span>/gs,
		(match, p1: string) => {
			// Remove the escape sequences for inline math
			return math(remove(remove(decode(p1), '\\('), '\\)'));
		}
	);
	newHtml = newHtml.replaceAll(
		/<span class="math display">(.*?)<\/span>/gs,
		(match, p1: string) => {
			// Decode HTML and remove the escape sequences for display math
			return display(remove(remove(decode(p1), '\\['), '\\]'));
		}
	);
	return newHtml;
}

function processHTMLBlock(html: string) {
	html = remove(html, /<\/?li>/g);
	return addMathInline(html);
}

function processAnswer(html: string) {
	html = html.replaceAll(/\\mbox/g,"\\text");
	if(html.includes("img")){
		return html
	}
	return math(remove(remove(html, '\\('), '\\)'));
}

function getQuestionTopics(topics?:{primaryTopics: number[],secondaryTopics: number[]} ){
return [
	...(topics?.primaryTopics ?? []),
	...(topics?.secondaryTopics ?? [])
];
}

function isMultipleChoice(ans:string){
	return Number.isNaN(parseInt(ans));
}
function decode(encodedString:string) {
	var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
	var translate = {
		nbsp: ' ',
		amp: '&',
		quot: '"',
		lt: '<',
		gt: '>'
	};
	return encodedString
		.replace(translate_re, function (match, entity: keyof typeof translate) {
			return translate[entity];
		})
		.replace(/&#(\d+);/gi, function (match, numStr) {
			var num = parseInt(numStr, 10);
			return String.fromCharCode(num);
		});
}
function formatName(s: string) {
	const legend: { [key: string]: string } = {
		"pascal": "Pascal",
		"gauss7": "Gauss (Gr. 7)",
		"fryer":"Fryer",
		"gauss8": "Gauss (Gr. 8)"
	}
	return legend[s]
}
function isSequenceContest(s:string){
	return ["fryer"].includes(s)
}
export { processAnswer, processHTMLBlock, isAnswerCorrect,getQuestionTopics,isMultipleChoice, formatName, isSequenceContest};
