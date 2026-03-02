# 💖 LoveChat: The Gold Standard for Private Messaging

LoveChat is a luxury, high-security messaging platform designed for those who value absolute privacy and a premium user experience. Built with a "Privacy First" philosophy, it combines state-of-the-art Web WebCrypto E2E encryption with a stunning, modern interface.

![LoveChat Preview](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## ✨ Premium Features

### 🛡️ Unrivaled Security
- **End-to-End Encryption (E2EE)**: Powered by **ECDH (P-256)** for key exchange and **AES-GCM (256-bit)** for message confidentiality.
- **Zero-Knowledge Architecture**: Your keys never leave your device. Not even the LoveChat servers can read your meaningful conversations.
- **Secure Media Pipeline**: Photos, videos, and voice notes are encrypted locally before being stored in Supabase Storage.

### 🎨 Human-Centric Design
- **Interactive Multimedia**: Seamlessly share images, high-definition videos, and location pins.
- **Vanish Mode**: Send messages that automatically self-destruct after being read.
- **Modern Polls**: Native polling with real-time visual results for group decision making.
- **LoveBot AI Assistant**: Integrated Gemini-powered AI that provides romantic suggestions and relationship tips.

### 📞 Robust Communication
- **Global VoIP**: High-quality voice and video calls with real-time notifications across the entire app.
- **WebRTC Optimization**: Advanced ICE candidate exchange ensures stable connections across various network configurations.

## 🛠️ Technology Stack

- **Frontend Core**: React 18 + Vite + TypeScript (Type-safe throughout)
- **Styling Engine**: Tailwind CSS with custom Glassmorphism & Luxury shadows
- **Backend Infrastructure**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Security**: SubtleCrypto (Web Crypto API)

## 🚀 Professional Deployment Guide

### 1. Database Initialization
This project includes a comprehensive `setup.sql` script.
- Log in to your [Supabase Dashboard](https://supabase.com).
- Open the **SQL Editor**.
- Copy the contents of [`setup.sql`](./setup.sql) and execute it. This will create all tables, RLS policies, and triggers automatically.

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/your-org/lovechat.git
cd lovechat

# Install dependencies
npm install

# Configure environments (.env)
cp .env.example .env
# Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Start Development
```bash
npm run dev
```

---

*Handcrafted with ❤️ for those who believe that privacy is a fundamental human right.*
