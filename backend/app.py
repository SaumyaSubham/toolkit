from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk import tokenize
from bs4 import BeautifulSoup
import requests
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import io
import docx2txt
from PyPDF2 import PdfReader
import time
from requests.exceptions import RequestException
import concurrent.futures
import re
from difflib import SequenceMatcher
import json
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()  # This loads the variables from .env

app = Flask(__name__)
CORS(app)

TEXTRAZOR_API_KEY = os.getenv('TEXTRAZOR_API_KEY')

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
except Exception as e:
    print(f"Error downloading NLTK data: {e}")

def get_sentences(text):
    try:
        sentences = tokenize.sent_tokenize(text)
        return sentences
    except LookupError:
        print("NLTK punkt tokenizer not found. Using a simple split method.")
        return text.split('.')

def get_url(sentence):
    base_url = 'https://www.google.com/search?q='
    query = sentence.replace(' ', '+')
    url = base_url + query
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'}
    try:
        res = requests.get(url, headers=headers, timeout=5)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        divs = soup.find_all('div', class_='yuRUbf')
        urls = [div.find('a')['href'] for div in divs]
        return urls[0] if urls and "youtube" not in urls[0] else None
    except RequestException as e:
        print(f"Error fetching URL for sentence: {e}")
        return None

def get_text(url, max_retries=2):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            text = ' '.join(map(lambda p: p.text, soup.find_all('p')))
            return text
        except RequestException as e:
            print(f"Error fetching text from URL (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(0.5)
            else:
                print(f"Max retries reached for URL: {url}")
                return ""

def get_similarity(text1, text2):
    text_list = [text1, text2]
    cv = CountVectorizer()
    count_matrix = cv.fit_transform(text_list)
    similarity = cosine_similarity(count_matrix)[0][1]
    return similarity

def process_url(args):
    sentence, url = args
    if url:
        text2 = get_text(url)
        if text2:
            similarity = get_similarity(sentence, text2)
            return {"sentence": sentence, "url": url, "similarity": similarity}
    return None

def get_similarity_list2(sentences, urls):
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(process_url, zip(sentences, urls)))
    return [result for result in results if result]

def read_file_content(file):
    try:
        if file.filename.endswith('.txt'):
            return file.read().decode('utf-8')
        elif file.filename.endswith('.pdf'):
            pdf_reader = PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                logger.debug(f"Extracted text from page: {page_text[:100]}...")  # Log first 100 chars
                text += page_text
            if not text:
                raise ValueError("Unable to extract text from PDF. The file might be empty or corrupted.")
            logger.info(f"Total extracted text length: {len(text)}")
            return text
        elif file.filename.endswith('.docx'):
            return docx2txt.process(file)
        else:
            raise ValueError(f"Unsupported file type: {file.filename}")
    except Exception as e:
        logger.error(f"Error reading file {file.filename}: {str(e)}")
        raise

def preprocess_text(text):
    # Remove punctuation and extra whitespace
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@app.route('/check_plagiarism', methods=['POST'])
def check_plagiarism():
    try:
        text = request.form.get('text', '')
        file = request.files.get('file')
        
        if file:
            try:
                text = read_file_content(file)
                logger.info(f"Successfully read file: {file.filename}")
                logger.debug(f"Extracted text (first 200 chars): {text[:200]}...")
            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                return jsonify({"error": f"Error reading file: {str(e)}"}), 400
        
        if not text:
            logger.warning("No text provided for plagiarism check")
            return jsonify({"error": "No text provided for plagiarism check"}), 400

        text = preprocess_text(text)
        sentences = get_sentences(text)
        
        logger.info(f"Number of sentences to process: {len(sentences)}")
        logger.debug(f"First sentence: {sentences[0][:100]}...")  # Log first 100 chars of first sentence
        
        max_sentences = 20
        if len(sentences) > max_sentences:
            sentences = sentences[:max_sentences]
            logger.info(f"Limiting to {max_sentences} sentences")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            urls = list(executor.map(get_url, sentences))
        
        logger.info(f"URLs found: {len([url for url in urls if url is not None])}")
        
        if all(url is None for url in urls):
            logger.info("No plagiarism detected")
            return jsonify({"message": "No plagiarism detected!", "overall_similarity": 0, "total_sentences": len(sentences), "matched_sentences": 0})

        results = get_similarity_list2(sentences, urls)
        
        overall_similarity = sum(item['similarity'] for item in results) / len(results) if results else 0
        
        response_data = {
            "results": results,
            "overall_similarity": overall_similarity,
            "total_sentences": len(sentences),
            "matched_sentences": len(results)
        }
        
        logger.info(f"Plagiarism check completed. Overall similarity: {overall_similarity}")
        
        return jsonify(response_data)
    except Exception as e:
        logger.exception(f"Error in check_plagiarism: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500
    
@app.route('/compare_files', methods=['POST'])
def compare_files():
    try:
        file1 = request.files.get('file1')
        file2 = request.files.get('file2')

        if not file1 or not file2:
            return jsonify({"error": "Two files are required"}), 400

        content1 = read_file_content(file1)
        content2 = read_file_content(file2)

        similarity = SequenceMatcher(None, content1, content2).ratio()

        return jsonify({
            "similarity": similarity,
            "file1_name": file1.filename,
            "file2_name": file2.filename
        })
    except Exception as e:
        print(f"Error in compare_files: {e}")
        return jsonify({"error": "An error occurred while comparing files"}), 500

@app.route('/extract_seo_keywords', methods=['POST'])
def extract_seo_keywords():
    try:
        data = request.json
        text = data.get('text')

        if not text:
            return jsonify({"error": "Text is required"}), 400

        # TextRazor API request
        url = "https://api.textrazor.com/"
        headers = {
            "x-textrazor-key": TEXTRAZOR_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        payload = {
            "text": text,
            "extractors": "topics,entities",
            "classifiers": "textrazor_newscodes"
        }

        response = requests.post(url, headers=headers, data=payload)
        response.raise_for_status()

        result = response.json()

        # Extract topics and entities
        topics = [topic['label'] for topic in result.get('response', {}).get('topics', [])[:10]]
        entities = [entity['entityId'] for entity in result.get('response', {}).get('entities', [])
                    if entity.get('relevanceScore', 0) > 0.8][:10]

        # Combine and remove duplicates
        seo_keywords = list(set(topics + entities))

        return jsonify({
            "seo_keywords": seo_keywords
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"An error occurred while connecting to the TextRazor API: {str(e)}"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error in extract_seo_keywords: {str(e)}")
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)