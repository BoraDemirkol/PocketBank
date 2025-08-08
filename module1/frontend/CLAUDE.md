# PocketBank Frontend - Claude Development Guide

## Project Overview

PocketBank is a React-based banking application frontend built with modern web technologies. This is a TypeScript React application using Vite as the build tool, integrated with Supabase for authentication and a .NET backend API for banking operations.

## Key Technologies & Dependencies

### Core Framework

- **React 18.3.1** - Main UI framework
- **TypeScript 5.8.3** - Type safety and development experience
- **Vite 7.0.4** - Fast build tool and development server

### UI Framework

- **Ant Design (antd) 5.26.6** - Primary component library
- Custom CSS styling with green theme (`#4a7c59`)

### Routing & Navigation

- **React Router DOM 7.7.1** - Client-side routing
- Routes: `/` (home), `/signin`, `/signup`, `/dashboard`

### Authentication & Backend

- **Supabase 2.52.1** - Authentication service
- Custom API service for .NET backend communication
- JWT token-based authentication

### Development Tools

- **ESLint 9.30.1** - Code linting with TypeScript and React plugins
- **Vite** - Development server and bundling
- Modern TypeScript configuration with strict mode

## Build & Development Commands

```bash
# Development server (starts on default Vite port, typically 5173)
npm run dev

# Production build
npm run build

# Build with TypeScript compilation check
tsc -b && vite build

# Code linting
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

### Application Structure

```
src/
├── main.tsx           # Application entry point
├── App.tsx           # Main app component with routing
├── AuthContext.tsx   # Authentication context provider
├── supabase.ts       # Supabase client configuration
├── api.ts           # Backend API service
├── index.css        # Global styles
└── [Components]     # Page components
```

### Component Architecture

#### Layout Structure

- **App.tsx**: Main layout with Ant Design Layout components
  - Header with "PocketBank" branding
  - Content area with routing
  - Footer with copyright
  - Consistent green theme (`#4a7c59`)

#### Page Components

- **Mainpage.tsx**: Landing page with sign-in/sign-up options
- **Signin.tsx**: Wrapper for Login component
- **Login.tsx**: Login form with email/password
- **Signup.tsx**: Wrapper for Register component
- **Register.tsx**: Registration form
- **Dashboard.tsx**: Protected dashboard showing user profile and balance

### Authentication Flow

#### Context-Based State Management

```typescript
// AuthContext provides:
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}
```

#### Authentication Provider Hierarchy

```tsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

#### Session Management

- Automatic session restoration on app load
- Real-time auth state changes via Supabase subscription
- JWT tokens automatically handled by Supabase

### API Integration

#### Backend Communication

- **Base URL**: `http://localhost:5271/api`
- **Authentication**: Bearer token from Supabase session
- **Endpoints Used**:
  - `GET /account/profile` - User profile data
  - `GET /account/balance` - Account balance information

#### API Service Pattern

```typescript
class ApiService {
  private async getAuthHeaders(); // Automatic token retrieval
  async get(endpoint: string); // GET requests
  async post(endpoint: string, data: any); // POST requests
}
```

### Routing Patterns

#### Route Structure

```tsx
<Routes>
  <Route path="/" element={<Mainpage />} />
  <Route path="/signin" element={<Signin />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Routes>
```

#### Navigation Patterns

- Programmatic navigation using `useNavigate()` hook
- Link components for static navigation
- Back buttons to home page in auth forms

### Import Conventions

#### External Dependencies

```typescript
// React imports
import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";

// Ant Design imports (note unusual path in some files)
import { Layout, Typography } from "../node_modules/antd"; // or just 'antd'
import { Button, Input, message, Form } from "antd";

// Local imports
import { useAuth } from "./AuthContext";
import { apiService } from "./api";
```

#### File Extensions

- All React components use `.tsx` extension
- Utility files use `.ts` extension
- CSS files use `.css` extension

### Styling Approach

#### CSS Organization

- **index.css**: Global reset and base styles
- **Component.css**: Component-specific styles (e.g., Signin.css, Signup.css)
- **Inline styles**: Extensive use of React inline styles for component styling

#### Design System

- **Primary Color**: `#4a7c59` (green)
- **Background**: `#f8faf9` with subtle gradient patterns
- **Typography**: System fonts with Helvetica fallbacks
- **Layout**: Flexbox-based responsive design

## Environment Configuration

### Required Environment Variables

```bash
# .env file
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuration Files

- **vite.config.ts**: Basic Vite setup with React plugin
- **tsconfig.json**: Project references to app and node configs
- **tsconfig.app.json**: Strict TypeScript configuration
- **eslint.config.js**: Modern ESLint flat config

## Development Guidelines

### Code Quality

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured for React, TypeScript, and hooks
- **Error Handling**: User-friendly error messages via Ant Design message component

### State Management

- React Context for authentication state
- Local component state for UI interactions
- No external state management library (Redux, Zustand, etc.)

### Component Patterns

- Functional components with hooks
- Custom hooks for authentication (`useAuth`)
- Form handling with Ant Design Form components
- Loading states and error handling

### Security Considerations

- Environment variables for sensitive configuration
- JWT token handling via Supabase
- Protected routes (dashboard requires authentication)
- Input validation on forms

## Backend Integration

### API Expectations

The frontend expects a .NET backend API running on `localhost:5271` with the following characteristics:

- JWT token authentication using Supabase tokens
- RESTful endpoints for account operations
- JSON request/response format
- CORS enabled for frontend origin

### Data Models

```typescript
interface UserProfile {
  userId: string;
  email: string;
  message: string;
}

interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
}
```

## Common Development Tasks

### Adding New Pages

1. Create component in `src/ComponentName.tsx`
2. Add route in `App.tsx`
3. Add navigation links as needed
4. Consider authentication requirements

### Styling Updates

- Modify inline styles for component-specific changes
- Update `index.css` for global changes
- Maintain color consistency with theme (`#4a7c59`)

### API Integration

- Use existing `apiService` for new endpoints
- Handle loading states and errors consistently
- Follow existing patterns for data fetching

### Authentication Changes

- Modify `AuthContext.tsx` for new auth methods
- Update types in the context interface
- Test with both authenticated and unauthenticated states

## Known Issues & Considerations

### Import Inconsistencies

Some files import Ant Design from `../node_modules/antd` instead of `'antd'` - this should be standardized.

### Component Organization

- Login/Signin and Register/Signup have wrapper components that may not be necessary
- Consider consolidating or removing redundant wrappers

### Styling Architecture

- Heavy reliance on inline styles may impact maintainability
- Consider moving to CSS modules or styled-components for better organization

### Error Handling

- Limited global error handling
- API errors are handled per-component rather than globally

This guide provides a comprehensive overview of the PocketBank frontend architecture and development patterns for effective contribution and maintenance.

#### RULES

1. Use '../node_modules/antd' to import ant design.
2. After you think of a solution, think if you can make it simpler without taking away functionality or readability.
