import json
import csv

def generate_topic_ids(data):
    topic_set = set()
    
    # Collect all unique topics
    for year_data in data.values():
        for problem in year_data.values():
            topic_set.update(problem["primaryTopics"])
            topic_set.update(problem["secondaryTopics"])
    
    # Assign unique IDs to topics
    topic_list = sorted(topic_set)
    topic_legend = {topic: i+1 for i, topic in enumerate(topic_list)}
    
    # Replace topic names with IDs in the original data
    for year_data in data.values():
        for problem in year_data.values():
            problem["primaryTopics"] = [topic_legend[t] for t in problem["primaryTopics"]]
            problem["secondaryTopics"] = [topic_legend[t] for t in problem["secondaryTopics"]]
    
    return data, topic_legend

def process_json(input_file, output_file):
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    updated_data, legend = generate_topic_ids(data)
    
    result = {
        "data": updated_data,
        "legend": legend
    }
    
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
def add_percentage_correct(questions, csv_filepath):
    """
    Adds the percentage correct from a CSV file to a list of question dicts.
    
    The CSV is expected to have the columns:
      - Question: the question number for that contest
      - Percentage Correct: the percentage of contestants who answered correctly
      - Year: the contest year
    
    The JSON questions should have a "source" key with:
      - "year": the contest year
      - "number": the question number within that contest
    
    Parameters:
        questions (list): List of question dictionaries.
        csv_filepath (str): Path to the CSV file containing question statistics.
        
    Returns:
        list: Updated list of question dictionaries with an added "percentage_correct" key.
    """
    # Build a mapping from (year, question number) to percentage correct
    question_stats = {}
    with open(csv_filepath, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                year = int(row["Year"])
                q_num = int(row["Question"])
                percentage = float(row["Percentage Correct"])
                # Create a key based on year and question number
                question_stats[(year, q_num)] = percentage
            except (KeyError, ValueError):
                # Skip rows that don't have the expected format
                continue

    # Update each question in the JSON array with the corresponding percentage correct
    for question in questions["data"]:
        # Ensure the question has the source details needed for matching
        if "source" in question and "year" in question["source"] and "number" in question["source"]:
            try:
                q_year = int(question["source"]["year"])
                q_number = int(question["source"]["number"])+1
            except ValueError:
                q_year = q_number = None
            # Look up the percentage correct using the (year, question number) key
            question["percentage_correct"] = question_stats.get((q_year, q_number))
        else:
            question["percentage_correct"] = None

    return questions


def add_solution_data(questions, csv_filepath,output):
    with open(questions, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    # Update questions by adding percentage correct from the CSV
    updated_questions = add_percentage_correct(questions, csv_filepath)
    
    # Optionally, write the updated questions back to a new JSON file
    with open(output, "w", encoding="utf-8") as f:
        json.dump(updated_questions, f, indent=2)
# process_json("contest_data/pascal/pascal.json","contest_data/pascal/pascal_id.json")
add_solution_data("contest_data/pascal/pascal_questions.json","test/all_pascal_results.csv","contest_data/pascal/pascal_questions.json")