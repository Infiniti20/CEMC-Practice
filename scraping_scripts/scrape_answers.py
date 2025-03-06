import requests
from bs4 import BeautifulSoup
import lzma
import re

# Fetch the metadata from the URL with the specified headers
year = 2013;
contest = "Pascal"
url = f"https://cemc.uwaterloo.ca/sites/default/files/documents/{year}/{year}{contest}Solution.html"
headers = {"Accept": "application/vnd.citationstyles.csl+json"}
response = requests.get(url, headers=headers)
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
    ol = body.findAll("ol")
    button = body.find("button")
    index = 0;
    # if(len(ol)>1 and button is None):
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
    match = re.search(r"(?:<[^>]+>)*Answer(?::)?(?:</[^>]+>)*(?::\s*)?(?:<[^>]+>)*\s*(?:\((?P<letter>[A-Za-z]+)\)|(?:\\\()*(?P<digits>\d+)(?:\\\))*)",ans)
    ans = match.group('letter') or match.group('digits')





    # For demonstration, print the length of the compressed data
