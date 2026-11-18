# 🏨 Aurelia Grand Hotel — Management & Booking System

A modern luxury hotel booking and management platform featuring an elegant user interface, interactive room listings, reservation management, and a dedicated administration dashboard.

Built with React, Node.js, Express, and MongoDB, Aurelia Grand Hotel provides separate experiences for hotel guests and administrators.

## Project Architecture

The project contains three independent components:

- `frontend/` — Customer-facing hotel website built with React and Vite.
- `admin/` — Separate hotel administration application built with React and Vite.
- `backend/` — Shared Express.js API with MongoDB and Mongoose.

## Tech Stack

- **Frontend:** React, Vite, CSS
- **Admin Panel:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **API:** REST API

## Features

### Customer Website
- Modern luxury hotel design
- Room browsing and room categories
- Booking search and reservation workflow
- Room details and amenities
- Guest registration and authentication
- Responsive user interface

### Administration Dashboard
- Separate administrator login
- Dashboard and management interface
- Reservation management
- Room management
- Guest management
- Staff and services management
- Payments and reports

### Backend
- Shared API for frontend and administration
- Authentication and authorization
- Booking and room management
- Database integration
- Validation and error handling

## Project Structure

```text
Aurelia-Grand-Hotel/
├── admin/
├── backend/
├── frontend/
├── README.md
├── package.json
└── package-lock.json
```

## Local Development

Each application runs independently. Start each in its own terminal.

### Backend

```powershell
cd backend
npm install
npm run dev
```

Default backend port: `4000`

### Customer Frontend

```powershell
cd frontend
npm install
npm run dev
```

Default Vite port: `5173`

### Admin Application

```powershell
cd admin
npm install
npm run dev
```

Default Vite port: `5174`

## Environment Configuration

Create local environment files using the provided `.env.example` files.

- Backend configuration includes database and server settings.
- Frontend configuration includes API connection settings.
- Admin configuration includes API connection settings.

Do not commit passwords, API keys, database credentials, or other secrets.

## Security

- Administrator access is separate from customer authentication.
- Admin roles cannot be created through public customer registration.
- Administrative permissions are enforced by the backend.
- Server secrets must not be exposed in browser applications.

## Documentation

For backend API, database, environment setup, and testing information, refer to:

[`backend/README.md`](./backend/README.md)

---

*A premium hospitality experience powered by modern web technology.*
