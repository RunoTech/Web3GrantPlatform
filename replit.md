# Overview

This is a Web3 donation platform built for Ethereum Mainnet and BSC Mainnet networks. The platform enables commission-free donations where funds go directly to campaign creators, with revenue generated through one-time account activation fees paid in USDT/BUSD. The system includes campaign management, daily reward mechanisms, and admin controls for fee management and winner selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite as the build tool
- **Styling**: Tailwind CSS with custom pastel color scheme optimized for Web3 applications
- **UI Components**: Radix UI primitives through shadcn/ui component library for consistent, accessible interface
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Wallet Integration**: ethers.js for blockchain interactions with support for MetaMask, Trust Wallet, and WalletConnect

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Development**: TypeScript with tsx for development server
- **Database**: SQLite with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **API Design**: RESTful endpoints with structured error handling and request logging middleware

### Database Design
The system uses SQLite as the primary database with the following core entities:
- **Fees**: Network-specific activation costs (Ethereum USDT, BSC BUSD/USDT)
- **Accounts**: Wallet-based user accounts with activation status
- **Campaigns**: Donation campaigns with metadata and statistics
- **Daily Entries**: Daily reward participation tracking
- **Winners**: Historical record of daily reward winners

### Authentication & Authorization
- **Wallet-based Identity**: No traditional user accounts; wallet addresses serve as user identifiers
- **Account Activation**: Pay-to-activate model using blockchain token transfers
- **Admin Access**: API key-based admin authentication for fee management and winner selection
- **Session Persistence**: Browser-based session management for connected wallet state

### Blockchain Integration
- **Multi-chain Support**: Ethereum Mainnet (Chain ID: 1) and BSC Mainnet (Chain ID: 56)
- **Token Standards**: ERC-20 token interactions for USDT/BUSD payments
- **Payment Verification**: Transaction hash validation for account activation
- **Direct Donations**: Commission-free transfers directly to campaign creator wallets

### Revenue Model
- **Account Activation Fees**: One-time payment required to create campaigns or participate in daily rewards
- **Dynamic Fee Management**: Admin-configurable fees per network with token flexibility
- **Zero Commission Donations**: All donations transfer directly to campaign creators without platform fees

## External Dependencies

### Blockchain Services
- **Ethereum RPC**: eth.llamarpc.com (configurable via ETH_RPC_URL)
- **BSC RPC**: bsc.llamarpc.com (configurable via BSC_RPC_URL)
- **ethers.js**: Blockchain interaction library for wallet connections and contract calls

### Database & Storage
- **SQLite**: Local file-based database with better-sqlite3 driver
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Neon Database**: Optional PostgreSQL provider support via @neondatabase/serverless

### UI & Styling
- **Radix UI**: Comprehensive primitive components for accessible interface building
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Modern icon library for consistent visual elements
- **Google Fonts**: Inter and Poppins font families for typography

### Development Tools
- **Vite**: Fast build tool with HMR and development server
- **TypeScript**: Type safety across frontend and backend
- **Replit Integration**: Platform-specific development tools and error handling
- **React Hook Form**: Form state management with Zod validation schemas