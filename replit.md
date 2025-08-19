# Overview

DUXXAN is a professional Web3 donation platform built for Ethereum Mainnet and BSC Mainnet networks. The platform features a corporate Binance-style design with white/yellow light theme and black/yellow dark theme, ensuring a clean and professional user experience. The platform enables commission-free donations where funds go directly to campaign creators. Revenue is generated through one-time account activation fees paid in USDT/BUSD. The system includes campaign management, daily reward mechanisms, and admin controls for fee management and winner selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Navigation Architecture Fix (August 19, 2025)
- Fixed "Create Campaign" button navigation issue where buttons incorrectly redirected to `/funds` instead of `/create-campaign`
- Updated all "Create Campaign" buttons across the platform:
  - Homepage hero section: Now redirects to `/create-campaign`
  - Donations page: Both campaign creation buttons now redirect to `/create-campaign`  
  - Profile page: Campaign creation buttons now redirect to `/create-campaign`
  - Campaigns page: Already correctly linked to `/create-campaign`
- Ensured proper separation between donation workflow (`/donations`) and funding workflow (`/funds`)

### Profile Page Complete Redesign (August 19, 2025)
- Completely redesigned profile page with Binance-style corporate design
- Implemented clean white/yellow light theme and black/yellow dark theme
- Added modern header with sticky navigation and proper back button
- Created comprehensive statistics overview with 4 key metrics cards
- Implemented tab system with Overview, Campaigns, and Daily Rewards sections
- Added achievement badges system with progress tracking
- Included campaign performance analytics and activity monitoring
- Responsive design ensuring professional appearance across all devices

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite as the build tool
- **Styling**: Tailwind CSS with Binance-inspired corporate design system
- **Design System**: Professional white/yellow light theme and black/yellow dark theme with clean typography and compact spacing
- **UI Components**: Radix UI primitives through shadcn/ui component library with Binance-style corporate theming
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Wallet Integration**: ethers.js for blockchain interactions with support for MetaMask, Trust Wallet, and WalletConnect

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Development**: TypeScript with tsx for development server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Authentication**: JWT-based admin authentication with bcrypt password hashing
- **API Design**: RESTful endpoints with structured error handling and comprehensive admin management
- **Admin System**: Complete admin panel with role-based access, activity logging, and platform control

### Database Design
The system uses PostgreSQL as the primary database with the following comprehensive entities:

**Core Platform Tables:**
- **Admins**: System administrators with roles and authentication
- **Platform Settings**: Dynamic configuration management for all platform aspects
- **Network Fees**: Multi-network activation fee management
- **Sessions**: Admin and user session storage

**User & Campaign Tables:**
- **Accounts**: Wallet-based user accounts with activation tracking
- **Campaigns**: Donation campaigns with approval workflow and statistics
- **Donations**: Comprehensive donation tracking with blockchain verification
- **Daily Entries**: Daily reward participation system
- **Daily Winners**: Admin-managed winner selection with rewards

**Content Management Tables:**
- **Footer Links**: Dynamic footer management with sections and ordering
- **Announcements**: Platform announcements with scheduling
- **Admin Logs**: Comprehensive audit trail for all admin actions

### Authentication & Authorization
- **Dual Authentication System**: 
  - **User Level**: Wallet-based identity for public platform access
  - **Admin Level**: JWT-based authentication with username/password
- **Account Activation**: Pay-to-activate model using blockchain token transfers
- **Admin Access**: Complete admin panel with role-based permissions (admin, super_admin)
- **Session Management**: PostgreSQL-based session storage for both users and admins
- **Security Features**: bcrypt password hashing, activity logging, and token-based API access

### Blockchain Integration
- **Multi-chain Support**: Ethereum Mainnet (Chain ID: 1) and BSC Mainnet (Chain ID: 56)
- **Token Standards**: ERC-20 token interactions for USDT/BUSD payments
- **Payment Verification**: Transaction hash validation for account activation
- **Direct Donations**: Commission-free transfers directly to campaign creator wallets

### Revenue Model
- **Account Activation Fees**: One-time payment of 50 USDT required to create campaigns or participate in daily rewards (consistent across both Ethereum and BSC networks)
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