# 🏢 SocietyFix

A full-stack **Apartment Society Management System** built with React, Node.js, Express, and MongoDB.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-purple?logo=render)](https://render.com)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🚨 Complaint Management | Raise, track and resolve maintenance complaints |
| 📢 Announcements | Society notice board with category filters |
| 🗳️ Community Polls | Voting system with live results |
| 🛂 Visitor Pass | Pre-approve visitors with QR-style gate passes |
| 🏊 Amenity Booking | Book clubhouse, gym, pool and more |
| 💳 Maintenance Fees | Track and pay society dues |
| 🛋️ Marketplace | Buy and sell furniture within the society |
| 🧹 Domestic Help | Find verified maids, cooks, and maintenance staff |
| 💬 Community Forum | Discussion threads with reactions |
| 📁 Resident Directory | Browse and search all residents |
| 📊 Analytics | Complaint trends and staff performance |
| 🌙 Dark Mode | Full dark/light/system theme support |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/neetijoshi2006-dotcom/societyfix.git
cd societyfix

# Install all dependencies
npm run install-all

# Start backend
cd backend && npm start

# In a new terminal, start frontend
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🌐 Deployment

### Frontend → Vercel
1. Import this repo into Vercel
2. Set **Root Directory** to `frontend`
3. Set env variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`
4. Deploy!

### Backend → Render
1. Create a new **Web Service** on Render
2. Connect this repo, set **Root Directory** to `backend`
3. Set env variables:
   - `MONGO_URI` → Your MongoDB Atlas connection string
   - `JWT_SECRET` → Any long random string
   - `FRONTEND_URL` → Your Vercel frontend URL
   - `NODE_ENV` → `production`
4. Deploy!

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Resident | resident@test.com | password |
| Manager | manager@test.com | password |
| Admin | admin@test.com | password |

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Socket.IO Client

**Backend:** Node.js, Express, Socket.IO, JWT Auth, Mongoose (MongoDB)

**Database:** MongoDB Atlas (cloud) / JSON file fallback (local dev)
