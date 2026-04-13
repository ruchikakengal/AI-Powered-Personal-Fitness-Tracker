# AI-Powered Personal Fitness Tracker

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

---

## 🚀 Project Overview

**AI-Powered Personal Fitness Tracker** is a modern fitness web application designed to help users build consistent health habits with data-driven insights and AI assistance.

The platform combines workout tracking, calorie monitoring, goal progress, and planning tools with intelligent features powered by Gemini, including workout generation, diet planning, and a fitness chatbot.  
It is built with a clean, responsive interface for both desktop and mobile users.

---

## ✨ Features

- 🧠 **AI Workout Generator** based on user goals (weight loss, muscle gain, fitness)
- 🥗 **AI Diet Planner** personalized by BMI, age, weight, and goal
- 💬 **AI Chatbot** for fitness-related questions with conversation history
- 📊 **Progress Tracking** with charts (weight, calories, workouts)
- 🎯 **Goal-Based Tracking System** with progress percentage and deadlines
- 🏆 **Gamification** including streaks, points, badges, and levels
- ✅ **Daily Workout Planner** with checklist and completion tracking
- 🔐 **User Authentication** (login/signup flow support)
- 📱 **Responsive Design** with mobile-friendly UI and touch-ready navigation
- 🛡️ **Admin Dashboard** with Firebase-powered user analytics

---

## 🛠️ Tech Stack

- **Frontend:** React.js
- **Backend:** Firebase (Authentication + Firestore)
- **AI Integration:** Google Gemini API
- **Charts:** Chart.js
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion

---

## 📂 Folder Structure

```bash
PersonalFitnessTracker/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route-level pages (Dashboard, Planner, Admin, etc.)
│   ├── lib/                 # Business logic, API integrations, Firebase utilities
│   ├── hooks/               # Custom React hooks
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1) Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2) Install dependencies

```bash
npm install
```

### 3) Start the project

```bash
npm start
```

> If `npm start` is not configured in your scripts, use:
>
> ```bash
> npm run dev
> ```

---

## 🔑 Environment Variables

Create a `.env` file in the project root and add the following:

### Gemini API

- `VITE_GEMINI_API_KEY=your_gemini_api_key`

### Firebase Configuration

- `VITE_FIREBASE_API_KEY=your_firebase_api_key`
- `VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID=your_project_id`
- `VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id`
- `VITE_FIREBASE_APP_ID=your_app_id`

### Optional Fitness API

- `VITE_API_NINJAS_KEY=your_api_key`

You can use `.env.example` as a template.

---

## 📸 Screenshots / Demo

Add your visuals here:

- **Dashboard Screenshot:** `![Dashboard](./screenshots/dashboard.png)`
- **AI Features Screenshot:** `![AI Features](./screenshots/ai-features.png)`
- **Admin Dashboard Screenshot:** `![Admin](./screenshots/admin.png)`
- **Demo Video:** `[Watch Demo](https://your-demo-link.com)`

---

## 🌐 Live Demo

Add your deployed app link here:

- 🔗 **Live URL:** `https://your-live-demo-link.com`

---

## 🎯 Future Enhancements

- ⌚ Wearable integration (Fitbit, Apple Health, Google Fit)
- 📈 Advanced analytics and predictive health trends
- 🤖 Deeper AI personalization based on long-term history
- 👥 Community challenges and social leaderboard
- 📬 Smart reminders and push notifications
- 🩺 Optional professional coach/doctor integration layer

---

## 🤝 Contributing

Contributions are welcome and appreciated.

To contribute:

- Fork the repository
- Create a feature branch
- Commit your changes
- Open a pull request with a clear description

Please follow clean coding practices and include meaningful commit messages.

---

## 📄 License

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this software with proper attribution.





