# NestConnect

A hyperlocal networking platform for people in the same organization — apartment complex, college, or workplace. Find peers with similar skills, connect with mentors, and chat in real time. No noise, no global feed — just your community.

---

## What it does

- Register your organization and invite members with an org code
- Pick your domains and skills — the app ranks relevant peers and mentors by skill overlap
- Send connection requests, accept or reject them
- Chat in real time with accepted connections

---

## Tech Stack

**Frontend** — React, React Router, Axios, Socket.IO client  
**Backend** — Node.js, Express, MongoDB, Mongoose  
**Auth** — JWT (access token in memory, refresh token in localStorage)  
**Media** — Cloudinary + Multer  
**Real-time** — Socket.IO  

---

## Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas account
- Cloudinary account

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=8000
MONGO_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=http://localhost:5173
```

```bash
mkdir -p public/temp
npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/discover` | Find peers/mentors |
| POST | `/api/v1/connections` | Send connection request |
| PATCH | `/api/v1/connections/:userId/accept` | Accept request |
| GET | `/api/v1/messages/:connectionId` | Chat history |

21 REST endpoints total + real-time messaging via Socket.IO.

---

## Project Structure

```
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── sockets/
└── utils/

frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── context/
│   ├── api/
│   └── socket/
```

---

## Features in detail

- **Skill-based discovery** — users are scored and ranked by how many skills overlap with yours in a given domain
- **Dual token auth** — short-lived access token kept in memory, refresh token rotated on every session
- **Real-time chat** — Socket.IO rooms scoped to accepted connections, with typing indicators
- **Org-scoped access** — users only see and connect with people in their own organization
- **Profile image upload** — handled via Multer → Cloudinary pipeline