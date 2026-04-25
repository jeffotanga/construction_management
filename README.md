# Frontend - Construction Management System

React-based frontend for the Construction Management System.

## Setup Instructions

### Prerequisites
- Node.js 14+ and npm

### Installation

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment (optional):
   Create `.env` file in frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

## Features

- User authentication (login/register)
- Project management dashboard
- Task tracking and management
- Team collaboration
- Budget tracking
- File uploads
- Real-time progress reporting

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API services and state management
├── styles/         # CSS stylesheets
├── App.js          # Main app component
└── index.js        # Entry point
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
