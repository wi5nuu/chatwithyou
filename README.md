# LoveChat

A private messaging platform built with end-to-end encryption, real-time communication, and a modern user interface. LoveChat provides secure one-on-one and group messaging with voice and video calling capabilities, media sharing, and social entertainment features.

---

## Features

### Security

- **End-to-End Encryption**: Messages are encrypted using ECDH (P-256) for key exchange and AES-GCM (256-bit) for message payload encryption. Encryption keys are generated and stored locally on the client device.
- **Zero-Knowledge Architecture**: Private keys never leave the user's device. The server stores only encrypted ciphertext and public keys.
- **Vanish Mode**: Messages that self-destruct after a configurable timer (1 minute or 1 hour).

### Communication

- **Real-Time Messaging**: Instant message delivery powered by Supabase Realtime subscriptions with PostgreSQL change tracking.
- **Voice and Video Calls**: WebRTC-based peer-to-peer calling with ICE candidate exchange via Supabase database signaling.
- **Media Sharing**: Support for images, videos, voice notes, and location sharing.
- **Poll Creation**: Create polls within chat conversations.

### Social Features

- **Friend System**: Send, accept, and manage friend requests with online presence indicators.
- **Stories (Status)**: Share photo and text statuses that expire after 24 hours with real-time viewer tracking.
- **Watch Together**: Synchronized YouTube video playback in a dedicated room with side chat.
- **Game Center**: Includes LoveQuiz, Truth or Dare, and WordGuess games with scoring and certificate generation.

### AI Integration

- **AI Chat Assistant**: Integration with Google Generative AI for an in-app AI chat experience.

### User Experience

- **Progressive Web App**: Installable on mobile and desktop devices with offline service worker support.
- **Dark Mode**: Toggle between light and dark themes with persistent preference.
- **Desktop Notifications**: Browser and system-level notifications for messages and calls, even when the tab is in the background.
- **Unread Badge**: Dynamic browser tab title updates showing unread message count.
- **Responsive Design**: Mobile-first responsive layout with adaptive sidebar navigation.

### Gamification

- **Chat Streaks**: Daily interaction tracking with streak counters and point rewards via PostgreSQL RPC functions.
- **Points System**: Earn points through streaks and game participation.

---

## Technology Stack

### Frontend

| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| React 19          | UI component library with concurrent rendering   |
| TypeScript 5.9    | Static type checking and enhanced developer tooling |
| Vite 7            | Build tool and development server with HMR        |
| React Router 7    | Client-side routing with URL-based navigation     |
| Tailwind CSS 3.4  | Utility-first CSS framework with class-based dark mode |
| shadcn/ui         | Component library built on Radix UI primitives    |
| Radix UI          | Accessible headless UI primitives (27 packages)   |

### Backend and Infrastructure

| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| Supabase          | Backend-as-a-Service providing PostgreSQL database, authentication, real-time subscriptions, and storage |
| PostgreSQL        | Relational database with Row-Level Security policies |
| Netlify Functions | Serverless functions for backend API endpoints    |
| Netlify           | Hosting and continuous deployment                 |

### Security and Encryption

| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| Web Crypto API    | Browser-native cryptographic operations (SubtleCrypto) |
| ECDH P-256        | Elliptic Curve Diffie-Hellman for asymmetric key exchange |
| AES-GCM 256       | Authenticated symmetric encryption for message payloads |

### Real-Time Communication

| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| Supabase Realtime | WebSocket-based subscriptions for live message and call events |
| WebRTC            | Browser-to-browser peer-to-peer audio and video calls |
| Navigator LockManager | Cross-tab synchronization for auth token management |

### AI

| Technology               | Purpose                              |
|--------------------------|--------------------------------------|
| Google Generative AI     | AI-powered chat assistant responses  |

### UI and Styling Libraries

| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| Lucide React      | Icon component library                           |
| Sonner            | Toast notification system                        |
| Recharts          | Charting and data visualization                  |
| React Hook Form   | Form state management with Zod schema validation |
| date-fns          | Date manipulation and formatting                 |
| Vaul              | Bottom sheet / drawer component                  |
| Embla Carousel    | Touch-optimized carousel component               |
| cmdk              | Command menu / combobox component                |

---

## Project Structure

```
src/
├── components/
│   ├── auth/          Login and registration forms
│   ├── call/          Voice and video call modal
│   ├── chat/          Chat list, chat room, AI chat, movie room, polls, streaks
│   ├── games/         WordGuess, Truth or Dare, LoveQuiz, certificate generator
│   ├── landing/       Marketing landing page sections
│   ├── profile/       User profile page
│   ├── settings/      Application settings page
│   ├── status/        Story status bar and viewer
│   └── ui/            Reusable UI primitives (shadcn/ui)
├── hooks/
│   ├── useAI.ts               AI chat integration
│   ├── useNotifications.ts    Browser notification management
│   ├── useRealtime.ts         Supabase real-time subscriptions and online status
│   ├── useTabNotification.ts  Dynamic tab title updates
│   ├── useVoiceRecorder.ts    Audio recording for voice notes
│   ├── useWebRTC.ts           WebRTC peer connection management
│   └── use-mobile.ts          Responsive breakpoint detection
├── lib/
│   ├── encryption.ts          E2EE key generation, encryption, and decryption
│   ├── supabase.ts            Supabase client and all database access functions
│   └── utils.ts               Shared utility functions
├── types/
│   ├── database.ts            Supabase database type definitions
│   └── index.ts               Application type definitions
├── App.tsx                    Main application component with routing
└── main.tsx                   Application entry point
```

---

## Database Schema

The application uses a PostgreSQL database with the following main tables:

| Table               | Purpose                                         |
|---------------------|-------------------------------------------------|
| `profiles`          | User profiles with display name, bio, avatar, public key, online status |
| `chats`             | Chat rooms supporting one-on-one and group conversations |
| `chat_participants` | Many-to-many relationship between users and chats |
| `messages`          | Encrypted messages with ciphertext, delivery and read status, vanish mode |
| `calls`             | Voice and video call records with offer/answer signaling |
| `call_candidates`   | WebRTC ICE candidate exchange storage            |
| `friendships`       | Friend request management with pending, accepted, declined states |
| `statuses`          | User stories with 24-hour expiration and viewer tracking |
| `chat_streaks`      | Daily interaction streaks for gamification       |

All tables are protected by PostgreSQL Row-Level Security policies.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project with the schema from `setup.sql` initialized
- A Google Generative AI API key (for AI chat features)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### Database Setup

Execute the contents of `setup.sql` in your Supabase SQL Editor to create all required tables, indexes, Row-Level Security policies, and triggers.

---

## Deployment

The project is configured for deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist`
4. Configure environment variables in the Netlify dashboard
5. Deploy

The `netlify.toml` configuration file handles SPA routing and serverless function proxying.

---

## Build Commands

```bash
npm run dev       # Start development server with HMR
npm run build     # TypeScript type check and production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## License

This project is private and confidential.
