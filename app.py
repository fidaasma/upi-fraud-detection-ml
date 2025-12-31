from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np

app = Flask(__name__)

# Load model and scaler
model = joblib.load("fraud_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route('/')
def home():
    return "UPI Fraud Detection API is running!"

@app.route('/pay')
def pay():
    return render_template('payment.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array(data['features'])

    # Extract Time and Amount
    time = features[0]
    amount = features[-1]

    # Scale only Time and Amount
    scaled_time_amount = scaler.transform([[time, amount]])

    # Rebuild full feature vector
    final_features = np.array([
        scaled_time_amount[0][0],
        *features[1:-1],
        scaled_time_amount[0][1]
    ]).reshape(1, -1)

    prediction = model.predict(final_features)[0]
    result = "Fraud" if prediction == 1 else "Not Fraud"

    return jsonify({"prediction": result})

if __name__ == '__main__':
    app.run(debug=True)
