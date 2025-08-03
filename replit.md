# ERP Pro - Enterprise Resource Planning System

## Overview

ERP Pro is a comprehensive business management application built with React, Express.js, and PostgreSQL. The system provides integrated modules for inventory management, sales processing, customer relationship management, and business analytics. It features a modern Arabic-supported interface with role-based authentication and real-time dashboard metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript and follows a component-based architecture:

- **UI Framework**: React with Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Component Structure**: Modular components organized by feature (dashboard, inventory, sales, layout)

The frontend uses a clean separation between pages, components, and utility functions, with shared types and schemas imported from a shared directory.

### Backend Architecture
The server-side follows an Express.js REST API architecture:

- **Framework**: Express.js with TypeScript for type safety
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit OpenID Connect (OIDC) integration with session-based auth
- **API Design**: RESTful endpoints organized by resource (products, customers, transactions)
- **Session Storage**: PostgreSQL-backed session store for scalable session management
- **Middleware**: Custom logging, authentication, and error handling middleware

### Database Design
PostgreSQL database with Drizzle ORM provides:

- **Schema Definition**: Type-safe schema definitions in TypeScript
- **Migration System**: Automated database migrations with drizzle-kit
- **Relationships**: Proper foreign key relationships between entities
- **Session Management**: Dedicated sessions table for authentication state
- **Business Entities**: Products, customers, transactions, and transaction items tables

### Authentication System
Replit-integrated authentication provides:

- **OAuth Integration**: OpenID Connect with Replit's identity provider
- **Session Management**: Secure session storage with automatic cleanup
- **User Management**: User profile storage and role-based permissions
- **Security**: HTTP-only cookies and CSRF protection

### Application Features
The system includes comprehensive business management capabilities:

- **Dashboard**: Real-time metrics, quick stats, and transaction overview
- **Inventory Management**: Product catalog, stock tracking, and low-stock alerts
- **Sales Processing**: Transaction creation, customer management, and order tracking
- **Multi-language Support**: Arabic interface with RTL text support
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

### Authentication Services
- **Replit Auth**: OpenID Connect integration for user authentication
- **Session Storage**: connect-pg-simple for PostgreSQL session management

### UI and Styling
- **Radix UI**: Comprehensive component primitives for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

### Form and Data Management
- **React Hook Form**: Performant form handling with validation
- **Zod**: TypeScript-first schema validation
- **TanStack Query**: Server state management and caching
- **Date-fns**: Date manipulation and formatting utilities

The application is designed for scalability and maintainability, with clear separation of concerns between frontend and backend, comprehensive type safety, and modern development practices throughout the stack.