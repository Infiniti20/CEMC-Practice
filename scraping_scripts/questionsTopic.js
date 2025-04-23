const { JSDOM } = require("jsdom");
const fs = require("fs");

// Constants
const PRIMARY_TOPICS = [
  "Algebra and Equations",
  "Counting and Probability",
  "Data Analysis",
  "Geometry and Measurement",
  "Number Sense",
  "Other",
];

const API_BASE_URL = "https://cemc2.math.uwaterloo.ca/contest/PSG";
const REFERRER_URL = `${API_BASE_URL}/school/topicGen.php`;
const DEFAULT_GRADE = "08";

/**
 * Creates a properly encoded request body for API calls
 * @param {Object} data - Data to encode
 * @param {string} [prefix=""] - Optional prefix for the encoded string
 * @returns {string} Properly encoded request body
 */
function createRequestBody(data, prefix = "") {
  const encoded = `${prefix}=${encodeURIComponent(JSON.stringify(data))}`;
  return encoded.replace("%20", "+");
}

/**
 * Parses HTML content and extracts text from labels
 * @param {string} html - HTML content to parse
 * @returns {string[]} Array of extracted label texts
 */
function parseHtmlLabels(html) {
  const dom = new JSDOM(html);
  const labels = dom.window.document.querySelectorAll("label");
  return Array.from(labels).map((label) => label.textContent.trim());
}

/**
 * Extracts question information from source text
 * @param {string} text - Source text containing question information
 * @returns {Object} Structured question information
 */
function parseQuestionInfo(text) {
  const info = {
    contestDate: null,
    questionNumber: null,
    primaryTopics: [],
    secondaryTopics: [],
  };

  // Extract contest date, name and question number
  const sourceMatch = text.match(/Source:\s*(\d{4})\s*([^,]*),\s*#(\d+)/);
  if (sourceMatch) {
    info.contestDate = sourceMatch[1];
    info.questionNumber = sourceMatch[3];
  }

  // Extract primary topics
  const primaryMatch = text.match(
    /Primary Topics:\s*(.*?)(?=\s+Secondary Topics:)/
  );
  if (primaryMatch && primaryMatch[1]) {
    info.primaryTopics = primaryMatch[1]
      .split("|")
      .map((topic) => topic.trim());
  }

  // Extract secondary topics
  const secondaryMatch = text.match(/Secondary Topics:\s*([^|]*(?:\|[^|]*)*)/);
  if (secondaryMatch && secondaryMatch[1]) {
    info.secondaryTopics = secondaryMatch[1]
      .split("|")
      .map((topic) => topic.trim());
  }

  return info;
}

/**
 * Fetches sub-topics for a given primary topic
 * @param {string} topic - Primary topic to fetch sub-topics for
 * @returns {Promise<string[]>} Array of sub-topics
 */
async function fetchSubTopics(topic) {
  const requestData = { grades: DEFAULT_GRADE, pTopics: topic };
  const body = createRequestBody(requestData, "l7");

  const response = await fetch(`${API_BASE_URL}/lib/functions_a.php`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: REFERRER_URL,
    },
    body: body,
  });

  const htmlContent = await response.text();
  return parseHtmlLabels(htmlContent);
}

/**
 * Fetches questions based on topics and subtopics
 * @param {string[]} primaryTopics - Array of primary topics
 * @param {string[]} subTopics - Array of sub-topics
 * @returns {Promise<Object[]>} Array of question information objects
 */
async function fetchQuestions(primaryTopics, subTopics) {
  const params = {
    grades: DEFAULT_GRADE,
    pTopics: primaryTopics.join(","),
    sTopics: subTopics.join(","),
    aNum: "10",
    bNum: "10",
    cNum: "10",
  };

  const response = await fetch(`${API_BASE_URL}/school/topicGen_a.php`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: REFERRER_URL,
    },
    body: createRequestBody(params, "q1"),
  });

  const responseData = await response.json();
  const content = JSON.parse(responseData.message).table;

  const dom = new JSDOM(content);
  const questions = dom.window.document.querySelectorAll(".problemsource");

  return Array.from(questions).map((q) => parseQuestionInfo(q.textContent));
}

/**
 * Organizes question data by year and question number
 * @param {Object[]} questions - Array of question information objects
 * @returns {Object} Data organized by year and question number
 */
function organizeByYearAndQuestion(questions) {
  const organized = {};

  for (const question of questions) {
    const { contestDate: year, questionNumber, ...data } = question;

    if (!year || !questionNumber) continue;

    if (!organized[year]) {
      organized[year] = {};
    }

    organized[year][questionNumber] = data;
  }

  return organized;
}

/**
 * Loads existing data from file
 * @param {string} filePath - Path to the data file
 * @returns {Object} Loaded data or empty object if file doesn't exist
 */
function loadExistingData(filePath) {
  try {
    const data = fs.readFileSync(filePath, { encoding: "utf8" });
    console.log(`Loaded existing data from ${filePath}`);
    return JSON.parse(data);
  } catch (error) {
    console.log(`No existing data file found at ${filePath}, creating new one`);
    return {};
  }
}

/**
 * Merges new data with existing data
 * @param {Object} existing - Existing data
 * @param {Object} newData - New data to merge
 * @returns {Object} Merged data
 */
function mergeData(existing, newData) {
  const merged = { ...existing };

  for (const year in newData) {
    if (!merged[year]) {
      merged[year] = {};
    }

    for (const questionNum in newData[year]) {
      merged[year][questionNum] = newData[year][questionNum];
    }
  }

  return merged;
}

/**
 * Saves data to file
 * @param {Object} data - Data to save
 * @param {string} filePath - Path to save the data to
 */
function saveData(data, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
}

/**
 * Main function to run the scraper for all topics
 * @param {string} outputFile - Path to save the data to
 * @returns {Promise<void>}
 */
async function runFullScrape(outputFile = "pascal.json") {
  try {
    const existingData = loadExistingData(outputFile);
    let updatedData = { ...existingData };

    for (let i = 0; i < PRIMARY_TOPICS.length; i++) {
      const primaryTopic = PRIMARY_TOPICS[i];
      const subTopics = await fetchSubTopics(primaryTopic);
      // console.log(`${primaryTopic}: Found ${subTopics.length} sub-topics`);

      for (let j = 0; j < subTopics.length; j++) {
        const subTopic = subTopics[j];
        // console.log(
        //   `Processing: ${primaryTopic} > ${subTopic} (${j + 1}/${
        //     subTopics.length
        //   })`
        // );

        const questions = await fetchQuestions([primaryTopic], [subTopic]);
        // console.log(`Found ${questions.length} questions`);

        const organizedQuestions = organizeByYearAndQuestion(questions);
        updatedData = mergeData(updatedData, organizedQuestions);
      }
    }

    saveData(updatedData, outputFile);
  } catch (error) {
    console.error("Error during execution:", error);
  }
}

runFullScrape("./contest_data/gauss8/gauss8.json")
