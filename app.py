from flask import Flask, request, jsonify
from nltk.tokenize import RegexpTokenizer
from nltk.stem.snowball import SnowballStemmer
import pickle
import sqlite3
from urllib.parse import urlparse
from flask_cors import CORS
import csv
from datetime import datetime
import validators

app = Flask(__name__)
CORS(app)

with open('phishing.pkl', 'rb') as f:
    model = pickle.load(f)

tokenizer = RegexpTokenizer(r'[A-Za-z]+')
stemmer = SnowballStemmer("english")

def check_whitelist(url):
    print("Checking whitelist...")
    with sqlite3.connect('whitelist.db') as conn:
        c = conn.cursor()
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}/"
        c.execute("SELECT url FROM whitelist WHERE url = ?", (base_url,))
        return c.fetchone() is not None

def check_blacklist(url):
    print("Checking blacklist...")
    with sqlite3.connect('blacklist.db') as conn:
        c = conn.cursor()
        c.execute("SELECT url FROM blacklist WHERE url LIKE ?", ('%' + url + '%',))
        return c.fetchone() is not None

def preprocess_url(url):
    """ Remove URL scheme and return the cleaned URL """
    parsed_url = urlparse(url)
    # Strip scheme (e.g., 'http') and return the rest of the URL
    scheme_free_url = parsed_url.netloc + parsed_url.path
    return scheme_free_url
def predict_url(url):
    print("Original URL:", url)

    # Preprocess the URL to remove the protocol
    cleaned_url = preprocess_url(url)
    print("Cleaned URL:", cleaned_url)

    tokens = tokenizer.tokenize(cleaned_url)
    print("Tokens:", tokens)

    stemmed = [stemmer.stem(word) for word in tokens]
    print("Stemmed Tokens:", stemmed)

    processed_url = ' '.join(stemmed)
    print("Processed URL for Prediction:", processed_url)

    prediction = model.predict([processed_url])

    return prediction[0]

@app.route('/check_url', methods=['POST'])
def check_url():
    data = request.get_json()
    if not data:
        print("No data received")
        return jsonify(status='error', message='No data received'), 400

    url = data.get('url')
    if not url:
        print("URL not provided")
        return jsonify(status='error', message='URL not provided'), 400

    print(f"Received URL for checking: {url}")

    if check_whitelist(url):
        print("URL is whitelisted.")
        return jsonify(status='safe')
    
    if check_blacklist(url):
        print("URL is blacklisted.")
        return jsonify(status='not_safe')

    prediction = predict_url(url)
    print("Prediction: ", prediction)
    if prediction == 'good':
        return jsonify(status='safe')
    else:
        return jsonify(status='not_safe')
    
@app.route('/report_suspicious_url', methods=['POST'])
def report_suspicious_url():
    data = request.get_json()
    suspicious_url = data.get('url')
    
    # Check if URL is provided
    if not suspicious_url:
        return jsonify({'error': 'No URL provided'}), 400

    # Validate the URL
    if not validators.url(suspicious_url):
        return jsonify({'error': 'Invalid URL'}), 400
    
    # Get the current time
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Path to the CSV file where URLs will be saved
    csv_file_path = 'reported_urls.csv'
    log_file_path = 'submission_log.txt'  # Path for the log file
    
    try:
        # Open the CSV file in append mode, create if does not exist
        with open(csv_file_path, mode='a', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            # Append the current time and suspicious URL to the CSV
            csv_writer.writerow([suspicious_url])
        
        # Append to the log file
        with open(log_file_path, mode='a', encoding='utf-8') as logfile:
            logfile.write(f"{current_time} - URL Reported: {suspicious_url}\n")
            
        return jsonify({'message': 'URL reported successfully'}), 200
    except Exception as e:
        # If any error occurs during file writing, log it and return an error response
        print(f"An error occurred: {e}")
        return jsonify({'error': 'An error occurred while saving the URL'}), 500

@app.route('/')
def hello_world():
    return 'Hello, World! Flask server is running...'

if __name__ == '__main__':
    app.run(debug=True)