# 💖 LoveChat: The Gold Standard for Private Messaging

LoveChat is a luxury, high-security messaging platform designed for those who value absolute privacy and a premium user experience. Built with a "Privacy First" philosophy, it combines state-of-the-art Web WebCrypto E2E encryption with a stunning, modern interface.

![LoveChat Preview](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

### ✨ Premium Features

#### 🛡️ Unrivaled Security
- **End-to-End Encryption (E2EE)**: Powered by **ECDH (P-256)** for key exchange and **AES-GCM (256-bit)** for message confidentiality.
- **Zero-Knowledge Architecture**: Your keys never leave your device.
- **Vanish Mode**: Messages that self-destruct after a set timer (1 minute or 1 hour).

#### 🎬 Social Entertainment
- **Movie Watch Together**: Integrated YouTube synchronization. Watch movie trailers or full movies together with a dedicated room chat.
- **Game Center**: Engage with partners through WordGuess, Truth or Dare, and LoveQuiz missions to earn special certificates.
- **Story (Status)**: Share moments that last 24 hours. Track who viewed your stories with real-time viewer lists.

#### 📞 Robust Communication
- **Global VoIP & Video**: High-quality WebRTC calls with signaling via Supabase.
- **Global Notifications**: Browser and system-level notifications for messages and calls, even when the tab is in the background.
- **Unread Badges**: Dynamic browser tab titles (e.g., `(2) LoveChat`) to keep you informed.

#### 📱 Native Experience
- **PWA Ready**: Install LoveChat on your phone or desktop for a native-app feel with a premium icon.
- **Client-Side Routing**: Unique URLs for every feature (`/profile`, `/settings`, `/movie/:id`) for seamless navigation and persistence.

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite + TypeScript + React Router 6
- **Styling**: Tailwind CSS + Lucide Icons + Sonner (Luxury Toasts)
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Security**: Web Crypto API (SubtleCrypto)

## 🚀 Deployment Guide

### 1. Database Initialization
Copy the contents of [`setup.sql`](./setup.sql) into your Supabase SQL Editor to initialize all tables, RLS policies, and triggers.

### 2. Local Setup
```bash
# Install dependencies
npm install

# Start development
npm run dev
```

### 3. Progressive Web App
To enable PWA features, ensure you serve the app over HTTPS or use localhost. The Service Worker (`sw.js`) handles background notifications and caching.

---

*Handcrafted with ❤️. Your privacy is a priority.*
