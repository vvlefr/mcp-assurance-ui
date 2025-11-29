# CLAUDE.md - AI Assistant Guide for MCP Assurance UI

## Project Overview

**MCP Assurance UI** is an intelligent chatbot application for generating loan insurance quotes (Assurance Emprunteur) in the French insurance market. Built for Titan Assurances, it enables insurance brokers to generate and compare quotes through natural language conversation.

### Core Functionality
- AI-powered chat for collecting client information via natural language
- Automatic comparison of insurance offers from multiple providers via Digital Insure API
- CRM integration (Supabase) for retrieving existing client data
- Automatic quote saving to insurance company extranet systems
- Admin dashboard for API provider configuration

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Tailwind CSS 4, Radix UI, Wouter (routing) |
| **State Management** | React Query (TanStack), React Context |
| **Backend** | Node.js, Express 4, TypeScript 5.9 |
| **API Layer** | tRPC 11 (type-safe RPC) |
| **Database** | MySQL/TiDB with Drizzle ORM |
| **AI/LLM** | OpenAI API with structured outputs |
| **Build Tools** | Vite 7 (frontend), esbuild (backend) |
| **Package Manager** | pnpm 10.4.1+ |
| **Testing** | Vitest |

## Directory Structure

```
mcp-assurance-ui/
├── client/                     # Frontend React application
│   └── src/
│       ├── _core/hooks/        # Core hooks (useAuth)
│       ├── components/         # React components
│       │   └── ui/             # Radix UI wrappers (shadcn-style)
│       ├── contexts/           # React contexts (Theme)
│       ├── hooks/              # Custom hooks
│       ├── pages/              # Page components
│       ├── lib/                # Utilities (trpc client, cn helper)
│       ├── App.tsx             # Root component with routing
│       └── main.tsx            # Entry point
├── server/                     # Backend Node.js application
│   ├── _core/                  # Infrastructure code
│   │   ├── index.ts            # Server entry point
│   │   ├── trpc.ts             # tRPC setup
│   │   ├── context.ts          # Request context
│   │   ├── llm.ts              # OpenAI integration
│   │   ├── oauth.ts            # OAuth handler
│   │   └── env.ts              # Environment variables
│   ├── api/                    # External API clients
│   │   ├── digitalInsureApi.ts # Digital Insure API client
│   │   ├── crmApi.ts           # Supabase CRM client
│   │   ├── chatContext.ts      # Chat context management
│   │   └── garantiesExplications.ts # Insurance guarantee rules
│   ├── routers/                # tRPC routers
│   │   ├── mcpHttp.ts          # Main workflow router (801 lines)
│   │   ├── mcpChat.ts          # Chat router
│   │   └── apiConfig.ts        # API config CRUD
│   ├── db.ts                   # Database operations
│   ├── routers.ts              # Router aggregation
│   └── debug-logger.ts         # Debug logging utility
├── shared/                     # Shared types/constants
│   ├── _core/errors.ts         # HTTP error classes
│   ├── const.ts                # Shared constants
│   └── types.ts                # Type exports
├── drizzle/                    # Database schema & migrations
│   └── schema.ts               # Complete schema definitions
├── vite.config.ts              # Frontend build config
├── tsconfig.json               # TypeScript config
├── drizzle.config.ts           # Drizzle ORM config
└── vitest.config.ts            # Test config
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/routers/mcpHttp.ts` | **Main workflow** - Chat processing, LLM extraction, quote generation |
| `server/api/digitalInsureApi.ts` | Digital Insure API client with OAuth2 |
| `server/api/crmApi.ts` | Supabase CRM integration |
| `server/api/garantiesExplications.ts` | Insurance guarantee rules by property type |
| `server/_core/llm.ts` | OpenAI integration for structured data extraction |
| `client/src/components/AIChatBox.tsx` | Main chat UI component |
| `client/src/lib/trpc.ts` | tRPC client configuration |
| `drizzle/schema.ts` | Database schema definitions |

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (hot reload)
pnpm dev

# Type checking
pnpm check

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Database migrations
pnpm db:push

# Format code
pnpm format
```

## Client Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home.tsx | Landing page |
| `/test-chat` | TestChat.tsx | Chat interface for quotes |
| `/admin/config` | AdminConfig.tsx | API configuration (admin only) |
| `/404` | NotFound.tsx | 404 error page |

## tRPC API Structure

### Procedure Types
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user
- `adminProcedure` - Requires admin role

### Main Routers
- `auth` - Authentication procedures
- `chat` - Chat session management
- `system` - Health checks
- `apiConfig` - API configuration CRUD
- `mcpChat` - Main quote workflow

## Database Schema (Drizzle)

### Key Tables
- `users` - User profiles and authentication
- `chat_sessions` - Chat session metadata
- `chat_messages` - Message history
- `chat_contexts` - Extracted conversation context (JSON)
- `api_configs` - API provider configurations

### Type Inference
```typescript
import { users, chatSessions } from '@/drizzle/schema';
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
```

## External API Integrations

### Digital Insure API
- **Base URL**: `https://catwww.accelerassur.fr/accelerassur-webservice/ws`
- **Auth**: OAuth2 with bearer token caching
- **Key Methods**:
  - `getTarifs()` - Get insurance rates
  - `createBusinessRecord()` - Save quote to extranet
  - `chooseInsurerProduct()` - Select specific product

### CRM API (Supabase)
- **Base URL**: `https://vcqpurrypnpebiygjypg.supabase.co/functions/v1/crm-mcp`
- **Operations**: Client search, contract retrieval, quote history

## Business Logic

### Insurance Workflow
1. User sends message with loan details
2. LLM extracts structured data (name, amount, duration, etc.)
3. CRM lookup merges existing client data
4. System asks for missing information progressively
5. Guarantees selected based on property type
6. Digital Insure API called (CRD + FIXE premium types)
7. Best offer selected (lowest total cost)
8. Quote auto-saved to Digital Insure extranet

### Guarantee Rules by Property Type
| Property Type | Required Guarantees |
|---------------|---------------------|
| Residence principale | DC/PTIA, IPT, IPP, ITT |
| Investissement locatif | DC/PTIA (others optional) |
| Residence secondaire | DC/PTIA, IPT, IPP, ITT |
| Pret professionnel | DC/PTIA, IPT, IPP, ITT |
| Pret in fine | DC/PTIA only |

### Premium Types
- **CRD** (Capital Restant Du) - Decreasing premium
- **FIXE** - Fixed premium

### Quotient Calculation
- Single borrower: 100%
- Two borrowers: 50% each

## Code Conventions

### TypeScript
- Strict mode enabled (`strict: true`)
- Use Zod for runtime validation
- Prefer type inference where possible

### Path Aliases
```typescript
import { Component } from '@/components/Component';  // client/src/
import { Error } from '@shared/_core/errors';        // shared/
```

### Naming Conventions
- Variables/Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Files: `camelCase.ts` or `PascalCase.tsx` for components

### Error Handling
- Use `TRPCError` for API errors
- HTTP errors in `shared/_core/errors.ts`
- Debug logging via `server/debug-logger.ts`

### Date Formats
- **API**: ISO 8601 format (YYYY-MM-DD)
- Use `convertDateToISO()` helper for conversions

## Environment Variables

Required in `.env`:
```
DATABASE_URL=mysql://...        # MySQL/TiDB connection
JWT_SECRET=...                  # Session signing secret
OAUTH_SERVER_URL=...            # Manus OAuth server
VITE_APP_ID=...                 # Frontend app ID
VITE_OAUTH_PORTAL_URL=...       # OAuth portal URL
VITE_APP_TITLE=...              # Application title
```

## Debugging

### Debug Log
The system writes detailed logs to `debug.log` file including:
- API request/response details
- LLM extraction results
- Workflow step information

### Debug Logger Usage
```typescript
import { debugLog } from '../debug-logger';
debugLog('Context', 'Message', { data });
```

## Testing

- Framework: Vitest
- Test location: `server/**/*.test.ts`, `server/**/*.spec.ts`
- Run: `pnpm test`

## Common Tasks

### Adding a New tRPC Endpoint
1. Add procedure in appropriate router (`server/routers/`)
2. Export from `server/routers.ts` if new router
3. Client automatically gets types via tRPC

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`

### Modifying Database Schema
1. Update `drizzle/schema.ts`
2. Run `pnpm db:push` to generate and apply migrations

### Adding UI Components
- Use existing Radix UI wrappers in `client/src/components/ui/`
- Follow shadcn/ui patterns for new components

## Important Notes

- **Language**: Application UI is in French
- **Target Market**: French insurance market
- **Owner**: Titan Assurances
- **API Credentials**: Some credentials are hardcoded for testing - check `digitalInsureApi.ts`
- **No tests written yet**: Test infrastructure exists but tests need to be added
- **Port**: Default 3000, auto-increments if busy
