# 💖 LoveChat - Secure & Premium Messaging

LoveChat adalah aplikasi messaging modern yang mengutamakan privasi tinggi dan pengalaman pengguna (UX) yang premium. Dibangun dengan fokus pada keamanan **End-to-End Encryption (E2EE)** dan fitur-fitur interaktif canggih.

## ✨ Fitur Utama

### 🛡️ Keamanan & Privasi
- **Full E2EE**: Pesan dienknipsi di perangkat menggunakan **ECDH (P-256)** dan **AES-GCM (256-bit)**. Server tidak bisa membaca isi pesan Anda.
- **👻 Vanish Mode**: Kirim pesan rahasia yang akan menghilang otomatis dalam 1 menit atau 1 jam.
- **🔒 Secure Media**: Foto, video, dan pesan suara semuanya dienkripsi sebelum diunggah.

### 🚀 Fitur Chat Modern
- **📊 Interactive Polls**: Buat polling langsung di grup atau private chat dengan hasil real-time.
- **📍 Share Location**: Kirim pin lokasi Anda dengan preview Google Maps yang rapi.
- **🔵 Read Receipts**: Indikator centang pink instan saat pesan sudah dibaca.
- **🔗 Link Previews**: Deteksi otomatis dan preview visual untuk link website.
- **🖼️ Custom Wallpapers**: Personalisasi latar belakang setiap room chat sesuai keinginan.
- **🎤 Voice Messages**: Rekam dan dengarkan pesan suara dengan visualizer progres.

### 🤖 AI Integration
- **✨ Smart Suggestions**: Dapatkan saran balasan otomatis yang cerdas sesuai konteks percakapan untuk membalas lebih cepat.

## 🛠️ Stack Teknologi
- **Frontend**: React 18, Vite, TypeScript
- **Backend / BaaS**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Security**: Web Crypto API

## 🚀 Persiapan & Instalasi

1. **Clone Repository**:
   ```bash
   git clone https://github.com/username/lovechat.git
   cd lovechat
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Buat file `.env` di root direktori:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

---

Dibuat dengan ❤️ untuk komunikasi yang lebih aman dan menyenangkan.

