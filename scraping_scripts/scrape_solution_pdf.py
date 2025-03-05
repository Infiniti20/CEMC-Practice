import re
import pandas as pd
import PyPDF2
import os

def extract_text_from_pdf(pdf_path):
    """
    Extract text content from each page of a PDF file
    Returns a list of text content from each page
    """
    page_texts = []
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            page_texts.append(page.extract_text())
    return page_texts

def find_pascal_results_page(page_texts):
    """
    Find the page that contains Pascal Contest results
    Returns the text content of the first matching page
    """
    for page_text in page_texts:
        if "Pascal Contest Concours Pascal" in page_text:
            return page_text
    return None

def parse_pascal_results(text_content):
    """
    Parse Pascal Contest results from text content extracted from a PDF
    Returns a DataFrame with question numbers and percentage of correct answers
    Handles both old format (all multiple choice) and new format (with open-ended questions)
    """
    if text_content is None:
        return pd.DataFrame()
        
    # Create a dictionary to store results
    results = {'Question': [], 'Correct Answer': [], 'Percentage Correct': []}
    
    # Split the content into lines
    lines = text_content.strip().split('\n')
    
    # Process all questions, looking for both multiple choice and open-ended formats
    for line in lines:
        # Pattern for multiple choice questions
        # Format: question_num correct_answer percentage_A percentage_B percentage_C percentage_D percentage_E
        mc_match = re.match(r'^\s*(\d+)\s+([A-E])\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s+([\d.]+))?', line)
        if mc_match:
            question_num = int(mc_match.group(1))
            correct_answer = mc_match.group(2)
            
            # Calculate column index for correct answer percentage
            col_indices = {'A': 3, 'B': 4, 'C': 5, 'D': 6, 'E': 7}
            percentage_correct = float(mc_match.group(col_indices[correct_answer]))
            
            results['Question'].append(question_num)
            results['Correct Answer'].append(correct_answer)
            results['Percentage Correct'].append(percentage_correct)
            continue  # Go to next line after processing
        
        # Pattern for open-ended questions (newer format)
        # Format: question_num answer_value answer_value (percentage)
        open_match = re.match(r'^\s*(\d+)\s+(\d+)(?:\s+\d+\s+\([\d.]+\))*\s+\2\s+\(([\d.]+)\)', line)
        if open_match:
            question_num = int(open_match.group(1))
            correct_answer = open_match.group(2)
            percentage_correct = float(open_match.group(3))
            
            results['Question'].append(question_num)
            results['Correct Answer'].append(correct_answer)
            results['Percentage Correct'].append(percentage_correct)
    
    # Create and return a DataFrame
    df = pd.DataFrame(results)
    if not df.empty:
        df = df.sort_values('Question')
    return df

def extract_contest_info(text_content, filename):
    """
    Extract general contest information like number of contestants and average mark
    Also tries to determine year from filename or content
    """
    if text_content is None:
        return {}
    
    info = {}
    
    # Look for number of contestants
    contestants_match = re.search(r'Number of Contestants [^\d]*: (\d+)', text_content)
    if contestants_match:
        info['Number of Contestants'] = int(contestants_match.group(1))
    
    # Look for average mark
    avg_mark_match = re.search(r'Average mark [^\d]*: ([\d.]+)', text_content)
    if avg_mark_match:
        info['Average Mark'] = float(avg_mark_match.group(1))
    
    # Try to extract year from filename or content
    # First try filename format like "2024PascalResults-15.pdf"
    year_match = re.search(r'(\d{4})Pascal', filename)
    if year_match:
        info['Year'] = year_match.group(1)
    else:
        # Try to extract from content
        year_match = re.search(r'(\d{4})\s+Pascal Contest', text_content)
        if year_match:
            info['Year'] = year_match.group(1)
    
    # Determine contest format based on detecting the format markers
    if "Correct Answer % not" in text_content and "1st/1er" in text_content:
        info['Format'] = 'New (with open-ended questions)'
    else:
        info['Format'] = 'Old (all multiple choice)'
    
    return info

def process_pascal_pdfs(directory='.'):
    """
    Process all PDF files in a directory, looking for Pascal Contest results
    Returns a dictionary of DataFrames with parsed results
    """
    results = {}
    
    # Find all PDF files
    for filename in os.listdir(directory):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(directory, filename)
            try:
                # Extract text from each page of the PDF
                page_texts = extract_text_from_pdf(pdf_path)
                
                # Find the page with Pascal Contest results
                pascal_page = find_pascal_results_page(page_texts)
                
                if pascal_page:
                    # Extract contest information
                    contest_info = extract_contest_info(pascal_page, filename)
                    
                    # Parse the results
                    parsed_df = parse_pascal_results(pascal_page)
                    
                    # Only add to results if we found some data
                    if not parsed_df.empty:
                        # Add contest info as metadata
                        for key, value in contest_info.items():
                            parsed_df[key] = value
                        
                        # Add filename for reference
                        parsed_df['Source'] = filename
                        
                        results[filename] = parsed_df
                        
                        # Save individual result to CSV
                        csv_filename = os.path.splitext(filename)[0] + '_parsed.csv'
                        parsed_df.to_csv(os.path.join(directory, csv_filename), index=False)
                        
                        year = contest_info.get('Year', 'Unknown')
                        format_type = contest_info.get('Format', 'Unknown')
                        print(f"Processed {filename} ({year} Pascal Contest, {format_type}) and saved results to {csv_filename}")
                        
                        # Print completion report
                        num_questions = len(parsed_df)
                        print(f"  Found data for {num_questions} questions")
                    else:
                        print(f"Found Pascal Contest header in {filename} but couldn't parse results")
                else:
                    print(f"No Pascal Contest results found in {filename}")
                    
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    return results

def analyze_results(results):
    """
    Generate additional analysis from the parsed results
    """
    if not results:
        return
    
    # Combine all results
    combined_df = pd.concat(results.values())
    
    # Group by year and analyze
    if 'Year' in combined_df.columns:
        yearly_stats = combined_df.groupby('Year').agg({
            'Percentage Correct': ['mean', 'min', 'max'],
            'Question': 'count',
            'Number of Contestants': 'first'
        })
        
        print("\nYearly Statistics:")
        print(yearly_stats)
    
    # Find hardest and easiest questions
    if not combined_df.empty:
        hardest = combined_df.loc[combined_df['Percentage Correct'].idxmin()]
        easiest = combined_df.loc[combined_df['Percentage Correct'].idxmax()]
        
        print("\nHardest Question:")
        print(f"Year: {hardest.get('Year', 'Unknown')}, Question {hardest['Question']}: {hardest['Percentage Correct']}% correct")
        
        print("\nEasiest Question:")
        print(f"Year: {easiest.get('Year', 'Unknown')}, Question {easiest['Question']}: {easiest['Percentage Correct']}% correct")
    
    return combined_df

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = '.'
    
    print(f"Processing PDFs in directory: {directory}")
    results = process_pascal_pdfs(directory)
    
    if results:
        print(f"\nSuccessfully processed {len(results)} Pascal Contest PDF files.")
        
        # Generate analysis
        combined_df = analyze_results(results)
        
        # Save combined results
        if combined_df is not None and len(results) > 1:
            combined_csv = os.path.join(directory, 'all_pascal_results.csv')
            combined_df.to_csv(combined_csv, index=False)
            print(f"\nCombined results saved to {combined_csv}")
    else:
        print("No valid Pascal Contest PDF files found.")