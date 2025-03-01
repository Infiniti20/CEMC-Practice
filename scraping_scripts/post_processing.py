import json

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

process_json("contest_data/pascal/pascal.json","contest_data/pascal/pascal_id.json")