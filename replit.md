# Trucker Buddy PWA

## Overview

A Progressive Web App for semi-truck drivers to manage pickup and delivery location data. The application supports both local-first storage (IndexedDB) and server-side persistence with user authentication. Users can create, view, and edit facility records with detailed trucking-specific information (dock types, parking instructions, hours of operation) and place custom entry/exit pins on interactive maps.

The architecture supports multiple facility types (warehouses, truck stops, rest areas, parking) and includes predefined seeded POIs. User authentication enables private location storage per user.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Authentication System (Feb 2026)
- Added email/password authentication with Passport.js local strategy
- Users table with id, username, password (hashed), createdAt
- Locations table now has userId field for ownership
- Protected routes redirect to /auth when not logged in
- Session storage in PostgreSQL via connect-pg-simple
- Logout button in navigation (desktop sidebar and mobile bottom bar)

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
- **Authentication**: Passport.js with local strategy (server/auth.ts)
- **Session Store**: PostgreSQL via connect-pg-simple
- **Password Hashing**: Node.js crypto (scrypt with salt)

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