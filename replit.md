# Pharmacy Locator PWA

## Overview

This is a mobile-first Progressive Web Application (PWA) designed to help users find and contact pharmacies on duty in their area. The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service Worker for offline functionality, Web App Manifest for app-like experience

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling XLSX file uploads
- **API Design**: RESTful endpoints with JSON responses
- **Development**: Hot reloading with Vite middleware integration

### Mobile-First Design
- **Responsive Design**: Tailored for mobile devices with touch-friendly interfaces
- **PWA Capabilities**: Installable app with offline functionality
- **Performance**: Optimized for mobile networks with efficient caching strategies

## Key Components

### Database Schema
- **Users**: Basic user management with username/password authentication
- **Pharmacies**: Store pharmacy information including name, location, contact details, and GPS coordinates
- **Weekly Schedules**: Track duty periods with start and end dates
- **Pharmacy Schedules**: Junction table linking pharmacies to their duty schedules

### Core Features
1. **Pharmacy Search**: Real-time search functionality with query-based filtering
2. **Current Week Display**: Automatic display of pharmacies on duty for the current week
3. **Contact Integration**: Direct phone calling and WhatsApp messaging capabilities
4. **Interactive Map**: Leaflet-based map showing pharmacy locations with markers
5. **Admin Panel**: Password-protected XLSX file upload system for bulk pharmacy data import
6. **Admin Authentication**: Secure login system with session management for administrative functions
7. **Responsive UI**: Mobile-optimized interface with touch-friendly controls

### Data Import System
- **File Processing**: XLSX file parsing with data validation
- **Bulk Import**: Efficient batch processing of pharmacy schedules
- **Error Handling**: Comprehensive validation and error reporting
- **Admin Interface**: Password-protected user interface with progress feedback
- **Security**: Session-based authentication for administrative operations

## Data Flow

1. **User Access**: Users access the PWA through web browsers or installed app
2. **Data Fetching**: Client requests pharmacy data through REST API endpoints
3. **Real-time Updates**: Automatic refresh of pharmacy data every 5 minutes
4. **Search Operations**: Dynamic search queries with debounced input
5. **Contact Actions**: Direct integration with device communication apps
6. **Admin Operations**: Secure file upload and processing workflow

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React ecosystem with TypeScript support
- **Component Library**: Radix UI primitives for accessible components
- **Mapping**: Leaflet for interactive maps with OpenStreetMap tiles
- **State Management**: TanStack Query for server state synchronization
- **File Processing**: XLSX library for client-side file operations

### Backend Dependencies
- **Database**: Neon PostgreSQL for cloud-hosted database
- **ORM**: Drizzle with PostgreSQL adapter
- **File Handling**: Multer for multipart form data processing
- **Validation**: Zod for runtime type checking and validation

### Development Tools
- **Build System**: Vite with React and TypeScript plugins
- **Linting**: ESLint and TypeScript compiler for code quality
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets with code splitting
- **Backend**: ESBuild compiles server code to single bundle
- **Assets**: Efficient bundling with tree-shaking and minification

### Environment Configuration
- **Database**: Environment-based connection string configuration
- **Secrets**: Secure handling of database credentials and API keys
- **Development**: Hot module replacement for rapid development

### PWA Deployment
- **Service Worker**: Caches critical resources for offline functionality
- **Manifest**: Configures app installation and appearance
- **Performance**: Optimized loading strategies for mobile networks

## Changelog

```
Changelog:
- June 27, 2025: Initial setup
- June 27, 2025: Added password protection for admin panel with secure authentication system
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```