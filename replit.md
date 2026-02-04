# Truck Locations PWA

## Overview

A Progressive Web App for semi-truck drivers to manage pickup and delivery location data. The application is designed as a **local-first** system where all data persists in the browser's IndexedDB, enabling full offline functionality. Users can create, view, and edit facility records with detailed trucking-specific information (dock types, parking instructions, hours of operation) and place custom entry/exit pins on interactive maps.

The architecture is intentionally simple and focused on correctness - no social features, routing, or complex backend logic. The backend exists primarily to serve the frontend and is structured for future cloud sync capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for async state, React Hook Form for forms
- **Styling**: Tailwind CSS with Shadcn UI component library
- **Maps**: Leaflet + React-Leaflet with OpenStreetMap tiles (no API key required)

### Data Storage Strategy
- **Primary Storage**: IndexedDB via the `idb` library (`client/src/lib/idb-storage.ts`)
- **Pattern**: Local-first - all CRUD operations happen against IndexedDB
- **Hooks**: Custom hooks (`use-locations.ts`) wrap IndexedDB operations with the same interface as API calls, making future backend sync straightforward
- **Schema**: Locations with nested pins (entry/exit points with coordinates and labels)

### Backend Structure
- **Runtime**: Node.js with Express
- **Database ORM**: Drizzle ORM configured for PostgreSQL (schema in `shared/schema.ts`)
- **Current Role**: Serves static frontend assets; API routes exist but frontend uses local storage
- **Future Role**: Ready for multi-user sync when DATABASE_URL is provisioned

### Shared Code
- **Location**: `shared/` directory
- **Schema**: `schema.ts` defines Drizzle tables, Zod validation schemas, and TypeScript types
- **Routes**: `routes.ts` defines API contract with Zod schemas for type-safe endpoints

### Key Design Decisions

1. **Local-First Over Cloud-First**: Data stored in IndexedDB ensures offline functionality. The hook interface mirrors API patterns so switching to server sync requires minimal changes.

2. **No Geocoding Dependencies**: Uses OpenStreetMap tiles (free, no key). Reverse geocoding via OSM Nominatim for "use current location" feature.

3. **Phone-First PWA**: Designed for mobile with responsive navigation (bottom bar on mobile, sidebar on desktop). Dark industrial theme optimized for trucking use cases.

4. **Single Source of Truth**: Edits overwrite previous data - no version history or conflict resolution complexity.

## External Dependencies

### Maps & Location
- **OpenStreetMap**: Free map tiles, no API key required
- **OSM Nominatim**: Reverse geocoding for current location feature
- **Leaflet/React-Leaflet**: Map rendering and interaction

### Database (Backend - Optional)
- **PostgreSQL**: Target database when `DATABASE_URL` is provisioned
- **Drizzle ORM**: Type-safe database operations with `drizzle-kit` for migrations

### UI Components
- **Shadcn UI**: Pre-built accessible components (located in `client/src/components/ui/`)
- **Radix UI**: Underlying primitives for Shadcn components
- **Lucide Icons**: Icon library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between frontend and backend
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions