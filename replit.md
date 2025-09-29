# Overview

This is a comprehensive sports management platform built with a modern web stack. The application provides a complete solution for managing sports institutions, venues, groups, athletes, events, publications, and attendance tracking. It features a multi-tenant architecture supporting different user roles (super admin, institution admin, venue admin, coach, secretary, representative, athlete) with role-based access control.

The platform is designed to handle multiple sports institutions, each with their own venues, groups, and athletes. It includes features for event management, communication through publications and notifications, attendance tracking, and a comprehensive dashboard with analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with consistent response patterns
- **Authentication**: JWT-based authentication with role-based authorization middleware
- **File Structure**: Modular architecture with separated routes, services, and storage layers

## Database & ORM
- **Database**: PostgreSQL for relational data with ACID compliance
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Shared schema definitions between frontend and backend using Zod
- **Connection**: Neon Database serverless PostgreSQL for scalable cloud hosting

## Authentication & Authorization
- **Strategy**: JWT token-based authentication with role hierarchy
- **Roles**: Seven-tier role system (super_admin, admin_institucion, admin_sede, entrenador, secretario, representante, deportista)
- **Access Control**: Middleware-based authorization with resource-level permissions
- **Session Management**: Stateless authentication with token-based sessions

## Key Features & Modules
- **Multi-tenant Support**: Institution-based data isolation with venue and group hierarchies
- **User Management**: Comprehensive user system with role-based permissions
- **Event Management**: Sports event creation, scheduling, and management
- **Attendance Tracking**: Real-time attendance monitoring with status tracking
- **Communication System**: Publications and notifications with visibility controls
- **Dashboard Analytics**: KPI tracking and summary reports
- **Responsive Design**: Mobile-first approach with adaptive layouts

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## UI & Design System
- **Radix UI**: Headless UI component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel components

## Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static type checking across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Authentication & Validation
- **JSON Web Tokens**: Stateless authentication tokens
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form handling with validation

## State Management & Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing solution for single-page applications

## Development Environment
- **Replit Integration**: Cloud development environment with real-time collaboration
- **Hot Module Replacement**: Instant feedback during development
- **Error Overlay**: Runtime error reporting and debugging tools