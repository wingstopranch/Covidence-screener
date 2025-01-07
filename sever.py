from flask import Flask, request, jsonify
import openai

app = Flask(__name__)

# Configure OpenAI API key
openai.api_key = 'your_openai_api_key'

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.json
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Call OpenAI GPT-4 API
    response = openai.Completion.create(
        model="gpt-4",
        prompt=f"Analyze the following text: {text}",
        max_tokens=200
    )

    return jsonify({'response': response.choices[0].text.strip()})

if __name__ == '__main__':
    app.run(debug=True)
