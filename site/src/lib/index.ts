import { math, display } from 'mathlifier';
import { decode } from 'html-entities';


function remove(str: string, pattern: string | RegExp): string {
	return str.replaceAll(pattern, '');
}

// TODO: Implement isAnswerCorrect globally
function isAnswerCorrect(question: Question, option:string) {

	if(Number.isNaN(parseInt(question.solutions.ans))){
		let correctIndex = question.solutions.ans.charCodeAt(0)-65
		let index = question.answers.indexOf(option)

		if(index <0){return false}
						console.log(correctIndex + ' ' + index);
				console.log(correctIndex == index);

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

export { processAnswer, processHTMLBlock, isAnswerCorrect,getQuestionTopics,isMultipleChoice};
