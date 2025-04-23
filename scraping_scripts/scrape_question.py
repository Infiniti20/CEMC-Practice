import requests
from bs4 import BeautifulSoup, NavigableString, Tag
import json
import re
import base64
import os
import brotli

# Fetch the metadata from the URL with the specified headers
year = 2024;
url = f"https://cemc.uwaterloo.ca/sites/default/files/documents/{year}/{year}Gauss8Contest.html"
headers = {"Accept": "application/vnd.citationstyles.csl+json"}
response = requests.get(url, headers=headers)
response.encoding = "utf-8"


metadata = response.text



# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(metadata, "lxml")


# Read json id file
with open('contest_data/gauss8/gauss8_id.json', 'r') as file:
    topic_data = json.load(file)

# Find all <ol> elements that are direct children of <body> and skip the first one
questions = []
body = soup.body
if body:
    # Find direct <ol> children of the body tag
    ol_elements = [child for child in body.find_all("ol", attrs={'class': None},recursive=True)]

    # Check for hide/show drawing button beside ordered list of description
    button = soup.find('button')
    if button:
        div = button.find_next_sibling('div')
        target_ol = div.find('ol') if div else None
    else:
        target_ol = None

    # Skip the first <ol> element and iterate over the rest
    print(len(ol_elements))
    for ol in ol_elements[1:]:
        # On 2020 contest answers had type=a
        if(ol.attrs.get("type")=="a"):
            continue
        if(ol == target_ol):
            continue
        # For each <ol>, add its direct <li> children to the questions list
        lis = ol.find_all("li", recursive=False)
        # print(str(ol.attrs))
        questions.extend(lis)

def get_solutions():
    url = f"https://cemc.uwaterloo.ca/sites/default/files/documents/{year}/{year}GaussSolution.html"
    response = requests.get(url, headers=headers)
    response.encoding = "utf-8"

    metadata = response.text


    # Optionally, write the metadata to a file (similar to writeFileSync)
    # with open("main.html", "w", encoding="utf8") as f:
    #     f.write(metadata)

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(metadata, "lxml")


    # Find all <ol> elements that are direct children of <body> and skip the first one
    solutions = []
    body = soup.body
    if body:
        # Find direct <ol> children of the body tag
        ol = body.findAll("ol",{type:None},recursive=False)
        button = body.find("button")
        index = 1;
        # if(len(ol) == 2 and button is None):
        #     index = 1

        lis = ol[index].find_all("li", recursive=False)
        solutions.extend(lis)

    # Process the first 25 questions
    solution_data = []
    for i in range(min(25, len(solutions))):
        solution = solutions[i]
        # Try to find an <ol> within the question (representing answers)
        ans = None
        answer = solution.find_all("p")
        # If answers exist, remove them from the question
        if answer:
            if(i!=24):
                answer = answer[-1]
            else:
                if "Answer" not in str(answer[-1]):
                    answer = answer[-2]
                else:
                    answer = answer[-1]
            ans = str(answer);
            answer.decompose()  # removes the element from the tree
    
        # Get the outer HTML of the modified question element
        solution_html = str(solution)
        if(solution_html == ''):
            raise ValueError('Empty solution at '+i)

        match = re.search(r"(?:<[^>]+>)*Answer(?::)?(?:</[^>]+>)*(?::\s*)?(?:<[^>]+>)*\s*(?:\((?P<letter>[A-Za-z]+)\)|(?:\\\()*(?P<digits>\d+)(?:\\\))*)",ans)
        ans = match.group('letter') or match.group('digits')


        # Compress the HTML using lzma with a compression preset of 9
        solution_compressed = brotli.compress(solution_html.encode("utf-8"), quality=11)
        solution_base64 =base64.b64encode(solution_compressed).decode("utf-8")
        solution_data.append({"solution":solution_base64, "ans":ans})
    return solution_data

output_file = f"contest_data/gauss8/gauss8_questions.json"
if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf8") as json_file:
            question_data = json.load(json_file)["data"]
else:
    question_data = []

# Process the first 25 questions
solutions = get_solutions()
for i in range(min(25, len(questions))):
    isWeird = False;
    index = 0


    question = questions[i]
    # Try to find an <ol> within the question (representing answers)
    ans = None
    
    button = question.find("button")
 
    answers = question.findAll("ol")
    if(len(answers)<1 and year <2022):
        isWeird = True
        result_html = str(question)
        next_sibling = question.next_sibling
        while next_sibling:
            # If we encounter a tag that is <li>, stop.
            if isinstance(next_sibling, Tag) or isinstance(next_sibling, NavigableString):
                if next_sibling.name == "li":
                    break
            # Append the string representation (whether a Tag, comment, or NavigableString)
                result_html += str(next_sibling)
            next_sibling = next_sibling.next_sibling
        question = BeautifulSoup(result_html,"lxml").body
        answers = question.findAll("ol")
    if button:
        if(len(answers)> 1):
            index += 1
    if(len(answers) > 0):
        answers = answers[index]
    else:
        answers = None


    # If answers exist, remove them from the question
    if answers:
        ans = BeautifulSoup(str(answers),"lxml")
        answers.decompose()  # removes the element from the tree
        answers = []
        t = ans.find_all("li") # temprary element to hold list of answers
        for answer in t:
            if answer.text.strip() != "":
                answers.append(answer.text)
            else:
                answers.append(answer.decode_contents())
    if isWeird:
        question = question.decode_contents()


    # Get the outer HTML of the modified question element
    # print(i)
    question_html = str(question)
    if(question_html == ''):
        raise ValueError('Empty question at '+i)
    # if(answers == None):
    #     print("Skipping question "+str(i+1))
    #     continue
    # if(len(answers)<1):
    #     raise ValueError('Empty answer at '+str(i))
    topics = topic_data['data'].get(str(year), {})
    topics = topics.get(str(i+1), None)

    # Compress the HTML using lzma with a compression preset of 9
    question_compressed = brotli.compress(question_html.encode("utf-8"), quality=11)
    question_base64 =base64.b64encode(question_compressed).decode("utf-8")
    # if('\'' in question_html):
    #     print("Look at question "+str(i+1))
    #     print(question_base64)


    question_data.append({
        "question": question_base64,  # Store as hex to keep JSON readable
        "answers": answers,
        "solutions": solutions[i],
        "topics": topics,
        "source":{
            "year":year,
            "number":i
        }
    })


output_file = f"contest_data/gauss8/gauss8_questions.json"
with open(output_file, "w", encoding="utf8") as json_file:
    json.dump({"data":question_data,"legend":topic_data["legend"]}, json_file, indent=4)

print(f"Saved {len(question_data)} questions to {output_file}")

    # For demonstration, print the length of the compressed data


