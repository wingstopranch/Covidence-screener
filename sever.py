from flask import Flask, request, jsonify
import openai
import os

app = Flask(__name__)

# Load API Key
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    keywords = data.get('keywords')
    content = data.get('fileContent')

    # Generate prompt
    prompt = f"Analyze this document for relevance to these keywords: {keywords}. Content: {content}"

    # Call OpenAI API
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=2000
        )
        return jsonify(response=response.choices[0].text.strip())
    except Exception as e:
        return jsonify(error=str(e)), 500
