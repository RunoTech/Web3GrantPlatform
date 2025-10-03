# Overview

DUXXAN is a professional Web3 donation platform for Ethereum and BSC Mainnets. It features a corporate Binance-style design with both light and dark themes. The platform facilitates commission-free donations, with funds directly reaching campaign creators. Revenue is generated through one-time campaign creation fees paid via MetaMask (USDT). Key functionalities include campaign management, a daily reward system, and comprehensive admin controls for fee management and winner selection. The affiliate/referral system has been removed to simplify the platform and focus on core donation features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with Vite
- **Styling**: Tailwind CSS with a Binance-inspired corporate design system (white/yellow light, black/yellow dark themes)
- **UI Components**: Radix UI primitives via shadcn/ui
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Wallet Integration**: ethers.js (MetaMask, Trust Wallet, WalletConnect)

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Development**: TypeScript with tsx
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: JWT-based admin authentication with bcrypt
- **API Design**: RESTful endpoints with structured error handling
- **Admin System**: Comprehensive admin panel with role-based access and activity logging, including a dynamic Data Explorer for managing 17+ database tables with CRUD, filtering, sorting, and server-side security (permissions, data masking, audit logging).

## Database Design
Uses PostgreSQL with tables for:
- **Core Platform**: Admins, Platform Settings, Network Fees, Sessions
- **User & Campaign**: Accounts, Campaigns, Donations, Daily Entries, Daily Winners
- **Content Management**: Footer Links, Announcements, Admin Logs

## Authentication & Authorization
- **Dual Authentication**: Wallet-based for users, JWT-based for admins.
- **Account Activation**: Pay-to-activate model via blockchain token transfers.
- **Admin Access**: Role-based permissions (admin, super_admin).
- **Session Management**: PostgreSQL-based storage.
- **Security**: bcrypt password hashing, activity logging, token-based API access.

## Blockchain Integration
- **Multi-chain Support**: Ethereum Mainnet (Chain ID: 1), BSC Mainnet (Chain ID: 56).
- **Token Standards**: ERC-20 for USDT/BUSD.
- **Payment Verification**: Transaction hash validation for account activation.
- **Direct Donations**: Commission-free transfers to creator wallets.

## Revenue Model
- **Campaign Creation Fees**: Automatic MetaMask payment system - users pay campaign fees directly when clicking "Create Campaign" button. No manual transaction hash input required.
  - DONATE campaigns: Fee configurable via admin settings (campaign_fee_donate)
  - FUND campaigns: Fee configurable via admin settings (campaign_fee_fund)
- **Zero Commission Donations**: No platform fees on donations.

## UI/UX Decisions
- Corporate Binance-style design with white/yellow light and black/yellow dark themes.
- Clean typography and compact spacing.
- SEO and social sharing improvements with comprehensive meta tags (Open Graph, Twitter Card).
- Visual indicators for credit card payment support on campaign cards.
- Icon visibility fix for light mode using theme-aware classes.
- Separation of FUND and DONATE campaign creation flows based on URL parameters.
- Company information for FUND campaigns is private and admin-only.

# External Dependencies

## Blockchain Services
- **Ethereum RPC**: eth.llamarpc.com
- **BSC RPC**: bsc.llamarpc.com
- **ethers.js**: Blockchain interaction library.

## Database & Storage
- **SQLite**: (Local development)
- **Drizzle ORM**: Type-safe database operations.
- **Neon Database**: (Optional PostgreSQL provider).

## UI & Styling
- **Radix UI**: Primitive components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **Google Fonts**: Inter and Poppins.

## Development Tools
- **Vite**: Build tool.
- **TypeScript**: Type safety.
- **React Hook Form**: Form management with Zod validation.