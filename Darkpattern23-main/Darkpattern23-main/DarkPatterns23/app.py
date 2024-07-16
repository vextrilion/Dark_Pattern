import json
from flask import Flask, request
from flask_cors import CORS, cross_origin  # Import the CORS module
import subprocess
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['POST'])
@cross_origin()
def process_data():
    data = request.get_data(as_text=True)
    
    # Save the received data to a temporary file
    temp_file_path = 'scraped.txt'
    with open(temp_file_path, 'w', encoding='utf-8') as temp_file:
        temp_file.write(data)
    
    try:
        # Change working directory to the one containing 'tri_model.py'
        os.chdir(r'E:\DarkPatterns23')

        # Run tri_model.py as a subprocess
        command = ['python', 'tri_model.py']
        subprocess.run(command, check=True)
        
        # Read the result from the JSON file
        with open('result.json', 'r') as json_file:
            result = json.load(json_file)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running tri_model.py: {e}")
        return 'Error processing data', 500

if __name__ == '__main__':
    app.run(port=5000)

