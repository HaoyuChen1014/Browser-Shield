from flask import Flask, jsonify, request, abort
from urllib.parse import urlparse
import re
import requests
import sqlite3
from joblib import load
import numpy as np
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
# Load the model from the file
model_random_forest = load('./model_random_forest.joblib')

app = Flask(__name__)

# Initialize Flask-Limiter with in-memory storage
limiter = Limiter(app=app, key_func=get_remote_address)

# Configure basic logging
logging.basicConfig(filename='app.log', level=logging.INFO)

DATABASE = 'phishing_sites.db'
WHOIS_API_KEY = 'at_c4NP0WsdiHmO0KM2I9NTD8TF17btw' 
WHOIS_API_ENDPOINT = "https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_c4NP0WsdiHmO0KM2I9NTD8TF17btw&domainName=google.com"

# Define a simple URL validation function
def is_valid_url(url):
    regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
        r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return re.match(regex, url) is not None

def query_db(query, args=(), one=False):
    with sqlite3.connect(DATABASE) as con:
        cur = con.cursor()
        cur.execute(query, args)
        rows = cur.fetchall()
        if one:
            return rows[0]
        return rows

def add_to_db(query, args=()):
    with sqlite3.connect(DATABASE) as con:
        cur = con.cursor()
        cur.execute(query, args)
        con.commit()

@app.route('/getblacklist.json', methods=['GET'])
def get_blacklist():
    rows = query_db("SELECT url FROM phishing_sites")
    urls = [row[0] for row in rows]
    return jsonify(urls)

@app.route('/add_to_blacklist', methods=['POST'])
def add_to_blacklist():
    new_url = request.form.get('url')
    if new_url:
        add_to_db("INSERT INTO phishing_sites (url) VALUES (?)", (new_url,))
        # Ideally, you should also update the version in the metadata table here.
        return jsonify({"message": "URL added successfully!"}), 200
    return jsonify({"error": "No URL provided!"}), 400

@app.route('/getDomainAge', methods=['POST'])
def get_domain_age():
    domain = request.form.get('domain')
    if not domain:
        return jsonify({"error": "No domain provided!"}), 400

    params = {
        "apiKey": WHOIS_API_KEY,
        "domainName": domain,
        "outputFormat": "JSON"
    }

    try:
        response = requests.get(WHOIS_API_ENDPOINT, params=params)
        response.raise_for_status()  # This will raise an exception for HTTP errors

        data = response.json()
        
        if data and data.get("WhoisRecord") and data["WhoisRecord"].get("createdDate"):
            createdDate = data["WhoisRecord"]["createdDate"]
            age = (int(createdDate.split('-')[0]) - 1970)  # Simplistic calculation, you can enhance this
            return jsonify({"domainAge": age}), 200

        return jsonify({"error": "Unable to retrieve domain age."}), 500

    except requests.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')  # This will print the detailed HTTP error
        return jsonify({"error": str(http_err)}), 500
    except Exception as e:
        print(f'Error occurred: {e}')  # This will print the generic error
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)  # Get JSON data sent to the endpoint
    
    # The data should contain the features in the same order as your model expects
    features = np.array(data['features']).reshape(1, -1)

    # Use the model to make a prediction
    prediction = model_random_forest.predict(features)
    
    # Convert the prediction to a readable format
    prediction_label = 'phishing' if prediction[0] == 1 else 'legitimate'
    
    # Return the prediction as a JSON
    return jsonify({'prediction': prediction_label})


@app.route('/extract_features', methods=['POST'])
def extract_features():
    content = request.json
    url = content['url']
    features = {}

    # Parse the URL
    parsed_url = urlparse(url)

    # feature extractions
    

    

    # Send the features back as JSON
    return jsonify(features)

@app.route('/submit_suspicious_url', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limiting
def submit_suspicious_url():
    url_data = request.get_json()
    suspicious_url = url_data.get('url')
    
    if suspicious_url and is_valid_url(suspicious_url):
        with open('suspicious_urls.txt', 'a') as file:
            file.write(suspicious_url + '\n')
        logging.info(f'Suspicious URL submitted: {suspicious_url}')
        return jsonify({"message": "Suspicious URL submitted successfully."}), 200
    else:
        logging.warning('Invalid URL submission attempt')
        return jsonify({"error": "Invalid or no URL provided."}), 400


@app.route('/')
def index():
    return "This is only for testing the Flask server is Activated."

if __name__ == '__main__':
    app.run(debug=True)
