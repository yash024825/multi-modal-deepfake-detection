# Multi-Modal Deepfake Detection

"Multi-Modal Deepfake Detection is a web application that analyzes images and videos using AI to detect deepfake content. It combines multiple modalities of data for accurate detection, with a React frontend, Node.js backend, Postman API, and MongoDB for data storage, providing users with a seamless interface to upload files and view results."

## Features

* Detect deepfake content in images and videos using AI.
* Multi-modal detection for higher accuracy.
* React frontend with a user-friendly interface.
* Node.js backend with RESTful API endpoints.
* MongoDB for storing user data and analysis results.
* Postman collection for testing API endpoints.

## Tech Stack

* **Frontend:** React
* **Backend:** Node.js, Express
* **Database:** MongoDB
* **AI Model:** Deep learning (PyTorch/TensorFlow)
* **API Testing:** Postman

## Installation

Follow these steps to run the project locally:

### 1. Clone the repository

git clone https://github.com/yourusername/multi-modal-deepfake-detection.git
cd multi-modal-deepfake-detection

### 2. Backend Setup

cd backend

* Install dependencies:
  
npm install

* Create a `.env` file in the `backend` folder with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/deepfakeDB
PYTHON_PATH=python   # or python3, depending on your system
UPLOAD_DIR=uploads
```

* Start the backend server:

npm run dev

### 3. Frontend Setup

cd ../frontend

* Install dependencies:

npm install

* Start the frontend server:

npm run dev

* The app will open at `http://localhost:5173` (or similar port).

## Usage

1. Open the frontend in your browser.
2. Sign up or log in.
3. Upload an image or video file.
4. View the AI-based deepfake detection results.
5. Results are stored in MongoDB for future reference.

## Folder Structure

multi-modal-deepfake-detection/
├── backend/          # Node.js backend
│   ├── app/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/         # React frontend
├── README.md


## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Make your changes and commit: `git commit -m "Add your feature"`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Create a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

* Deep learning models for deepfake detection.
* React, Node.js, Express, MongoDB documentation.
* Postman for API testing.
