

-----

# Kerala Migrant Health Record System

A unified digital health record system designed to bridge the healthcare gap for migrant workers in Kerala. This platform ensures better healthcare access, improves public health surveillance, and provides equitable medical services through a centralized digital database.

##  Project Overview

This full-stack application connects three key stakeholders:

1.  **Government Officials**: Monitor public health data, broadcast alerts, and view analytics.
2.  **Hospitals/Health Centers**: Register migrant workers, manage staff, and update health records.
3.  **Migrant Workers**: Access their own digital health ID cards and view medical history.

##  Tech Stack

  * **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts, React Hot Toast.
  * **Backend**: Node.js, Express.js.
  * **Database**: MongoDB (Mongoose ODM).
  * **Authentication**: Custom Token-based Authentication.

## Key Features

###Hospital Portal

  * **Secure Login**: Dedicated portal for hospital administrators.
  * **Worker Registration**: Register new migrant workers with auto-generated IDs (e.g., `CGC_123`).
  * **Staff Management**: Add, edit, and delete hospital staff (Doctors, Nurses) with role-based ID generation.
  * **Dashboard**: View recent registrations and active health alerts.
  * **CSV Export**: Download worker registration data for offline use.

### Worker Portal

  * **Digital Health Card**: View and download a personal Health ID card (with QR code placeholder).
  * **Medical History**: Access past diagnoses and treatments.
  * **Nearby Centers**: Find registered health centers nearby.

### Government Portal

  * **Analytics**: Visualize registration trends and disease prevalence.
  * **Alert System**: Broadcast health alerts (e.g., "Dengue Outbreak") to hospitals.
  * **Directory**: Search and view worker profiles across the state.

##  Installation & Setup

Follow these steps to run the project locally.

### Prerequisites

  * Node.js (v18+)
  * MongoDB Atlas Account (or local MongoDB)

### 1\. Clone the Repository

```bash
git clone <your-repository-url>
cd kerala-migrant-health
```

### 2\. Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dhr_db
```

Start the backend server:

```bash
node server.js
# Output:  Backend running on port 5000
# Output:  MongoDB Connected
```

### 3\. Frontend Setup

Open a new terminal, navigate to the frontend folder, and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

## 🔌 API Endpoints

### Authentication

  * `POST /api/auth/signup` - Register a new user (Gov, Hospital, or Worker).
  * `POST /api/auth/login` - Authenticate user and receive a token.
  * `GET /api/auth/me` - Fetch current logged-in user profile.

### Hospital Operations

  * `GET /api/hospital/workers` - Get all workers registered by the logged-in hospital.
  * `POST /api/hospital/workers` - Register a new migrant worker.
  * `GET /api/hospital/staff` - Get list of hospital staff.
  * `POST /api/hospital/staff` - Add new staff member.
  * `PUT /api/hospital/staff/:id` - Update staff details.
  * `DELETE /api/hospital/staff/:id` - Remove a staff member.

### General

  * `GET /api/hospital/alerts` - Fetch active public health alerts.

## Project Structure

```
├── backend/
│   ├── server.js          # Main Express server & API routes
│   ├── .env               # Backend environment variables
│   └── package.json       # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable UI components (Navbar, Forms)
│   │   ├── context/       # Global State (AuthContext)
│   │   └── lib/           # Utilities (API client)
│   ├── .env.local         # Frontend environment variables
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```
