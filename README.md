# EasyApply: AI-Powered Job Delegation and Recommendation Platform

## 🧭 Project Overview
EasyApply is a full-stack job application assistant that allows users to delegate job applications using a Chrome extension, receive AI-driven job recommendations, and track progress in an interactive dashboard. It is composed of four main components:

- **Backend:** Node.js + Express API
- **Frontend:** React.js web application
- **Chrome Extension:** Job delegation interface on LinkedIn
- **ML Service:** FastAPI-based job recommendation engine

---

## 🏗 Project Structure
```
easyapply/
├── backend/               # Node.js + Express server
├── frontend/              # React frontend
├── ml_service/            # FastAPI-based ML recommendation engine
├── chrome-extension/      # Chrome extension for LinkedIn job delegation
└── .env                   # Environment variables
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/easyapply.git](https://github.com/Avinash-Amudala/easyapply.git
cd easyapply
```

---

### 2. Environment Variables
Create `.env` files in each relevant directory as follows:

#### 🔹 backend/.env
```env
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
PORT=3002
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
RAPIDAPI_KEY=your_rapidapi_key
```

#### 🔹 frontend/.env
```env
REACT_APP_API_URL=http://localhost:3002/api
```

#### 🔹 ml_service/.env
```env
MONGO_URI=your_mongo_connection_string
ADZUNA_APP_ID=your_adzuna_id
ADZUNA_APP_KEY=your_adzuna_key
RAPIDAPI_KEY=your_rapidapi_key
```

---

## 🚀 Running the Application

### ✅ Start the ML Service
```bash
cd ml_service
uvicorn app.main:app --host 0.0.0.0 --port 5001
```

### ✅ Start the Backend
```bash
cd ../backend
npm install
npm start
```
Runs on: `http://localhost:3002`

### ✅ Start the Frontend
```bash
cd ../frontend
npm install
npm start
```
Runs on: `http://localhost:3000`

---

## 🧩 Chrome Extension Setup

1. Go to `chrome://extensions` in your browser.
2. Enable **Developer Mode**.
3. Click **Load unpacked** and select the `chrome-extension/` directory.
4. Navigate to a LinkedIn job page and click the extension icon.

> Ensure the backend and frontend are running locally and the user is logged in.

---

## 🔍 Features
- **User Roles:** Subscriber, Assistant, Admin
- **Chrome Extension:** Auto-fill and delegate LinkedIn jobs
- **AI Model:** Sentence-BERT + TF-IDF for job matching
- **Dashboard Tabs:** Saved, Delegated, Applied
- **Admin Panel:** Assistant assignment and progress monitoring

---

## 📈 Metrics & Monitoring (Planned/Future Work)
- **Delegation Rate:** % of recommended jobs that were delegated
- **Implicit Feedback Tuning:** Use delegated jobs as positive feedback
- **User Engagement Tracking:** Views, clicks, delegation logs

---

## 📫 Contact
**Avinash Amudala**  
Rochester Institute of Technology  
📧 [aa9429@rit.edu]  
🔗 [https://www.linkedin.com/in/avinash-amudala/]

---

> This is an academic capstone project combining AI, automation, and intuitive UX for a smarter job application experience.
