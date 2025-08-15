# PocketBank Frontend

## Environment Setup

This application requires the following environment variables to be set in a `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:5271/api
```

## Setup Instructions

1. Copy the environment variables from your Supabase project
2. Create a `.env` file in the root directory
3. Fill in the actual values for your project
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Notes

- The application uses Supabase for authentication and database
- Make sure your backend API is running on the specified port
- Environment variables are required for the application to function properly
