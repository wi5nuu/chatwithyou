import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KNOWLEDGE_BASE: Record<string, { keywords: string[]; responses: string[] }> = {
    greetings: {
        keywords: ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "cuy", "ads", "assalamualaikum", "p", "halo bot", "hey", "apa kabar"],
        responses: [
            "Halo manis! Ada yang bisa aku bantu untuk hubungan kalian hari ini? 😊",
            "Hai! Senang sekali bisa ngobrol sama kamu. Apa kabar?",
            "Selamat datang kembali di LoveChat! Butuh saran romantis hari ini?",
            "Halo sayang! Hari ini kelihatannya cerah ya, bagaimana harimu?",
            "Hai hai! LoveBot di sini, siap menemani obrolanmu. ✨"
        ]
    },
    marriage: {
        keywords: ["nikah", "kawin", "lamar", "menikah", "suami", "istri", "akad", "halal", "pelaminan", "mahar", "penghulu", "wedding"],
        responses: [
            "Wih, serius banget! Nikah itu komitmen besar lho. Pastikan kalian berdua sudah siap secara mental & finansial ya. Aku doain yang terbaik buat kalian! 💍",
            "Rencana masa depan yang indah! Menikah adalah ibadah dan perjalanan panjang. Sudah diskusikan visi-misi bersama?",
            "Menikah bukan cuma tentang pesta, tapi tentang kerja tim selamanya. Semoga persiapannya lancar ya!",
            "Akad nikah adalah janji suci. Pertahankan niat baik kalian, semoga dimudahkan jalannya ke pelaminan! ✨",
            "Ciee yang mau ke jenjang serius! Jangan lupa persiapkan hati dan sabar yang luas ya. ❤️"
        ]
    },
    sleepy: {
        keywords: ["ngantuk", "tidur", "bobok", "istirahat", "lelah", "capek", "merem", "night", "mimpi", "turu"],
        responses: [
            "Duh, kalau sudah ngantuk mending istirahat ya. Jangan dipaksain, kesehatan itu nomor satu. Selamat istirahat, mimpi indah! 💤",
            "Tidur yang nyenyak ya. Biar besok bangun dengan energi baru untuk pasanganmu!",
            "Bobo nyenyak! Jangan lupa berdoa dan matikan HP-mu ya agar kualitas tidur maksimal.",
            "Lelah itu wajar. Istirahatkan pikiranmu, LoveBot di sini bakal nungguin kamu bangun besok pagi.",
            "Have a sweet dream! Semoga mimpi indah bareng si doi ya. 🌙"
        ]
    },
    food: {
        keywords: ["makan", "lapar", "laper", "kenyang", "haus", "minum", "kuliner", "jajan", "nasi", "bakso", "seblak", "mie", "pizza", "burger", "laper nih"],
        responses: [
            "Makan itu penting! Coba ajak pasangan kamu makan bareng di tempat favorit kalian? Atau mungkin masak bareng di rumah? Pasti romantis! 🥞",
            "Lagi lapar ya? Gimana kalau kasih kejutan ke pasangan dengan kirim makanan via ojek online? Pasti dia seneng banget!",
            "Wah nasi goreng atau seblak nih? Hehe. Apapun makanannya, yang penting dinikmati bareng orang tersayang ya!",
            "Jangan telat makan ya, nanti sakit. Pasanganmu pasti sedih kalau kamu kenapa-napa.",
            "Hmm... membayangkan makanan jadi bikin laper juga ya (padahal aku bot). Yuk makan dulu! 🍴"
        ]
    },
    love_advice: {
        keywords: ["tips", "saran", "gimana", "hubungan", "pacaran", "berantem", "marah", "baikan", "langgeng", "rahasia", "harmonis"],
        responses: [
            "Tips langgeng: Selalu jujur meski menyakitkan, dan jangan pernah berhenti mencoba hal baru bersama pasangan. ❤️",
            "Kalau lagi berantem, coba tarik napas dulu. Jangan ambil keputusan saat emosi. Ingat alasan kenapa kalian memulai hubungan ini.",
            "Saran dariku: Berikan apresiasi kecil setiap hari. Ucapan 'Terima kasih' atau 'Kamu hebat' itu sangat berarti.",
            "Kunci hubungan sehat adalah komunikasi dua arah dan rasa saling percaya yang tinggi.",
            "Terkadang kita perlu 'mengalah untuk menang'. Hindari ego, utamakan kebersamaan. 🤝"
        ]
    },
    acknowledgment: {
        keywords: ["oke", "baik", "sip", "ok", "siap", "noted", "paham", "mengerti", "iya", "yaps", "betul", "benar"],
        responses: [
            "Siap! Senang bisa membantu kamu. Ada lagi yang mau dibahas? 😊",
            "Mantap! Terus semangat ya menjaga hubungannya.",
            "Noted! Aku selalu di sini kalau kamu butuh teman ngobrol atau saran lagi.",
            "Iya nih, setuju banget! Pokoknya yang terbaik buat kamu.",
            "Oke deh! Semangat terus buat hari ini ya! ✨"
        ]
    },
    jealousy: {
        keywords: ["cemburu", "posesif", "curiga", "selingkuh", "bohong", "percaya", "mantan", "stalking"],
        responses: [
            "Cemburu tanda sayang, tapi kalau berlebihan bisa jadi beban. Coba bicarakan pelan-pelan apa yang bikin kamu khawatir.",
            "Kepercayaan itu mahal harganya. Jika ada yang mengganjal, komunikasi adalah jalan satu-satunya.",
            "Mantan itu masa lalu, kamu adalah masa depannya. Fokus pada apa yang kalian bangun sekarang ya.",
            "Penting untuk memberi ruang satu sama lain. Rasa percaya bikin hubungan jauh lebih tenang lho. 🕊️"
        ]
    },
    hobbies: {
        keywords: ["game", "main", "nonton", "film", "musik", "lagu", "baca", "buku", "hobi", "olahraga", "futsal", "gym"],
        responses: [
            "Seru banget hobinya! Pernah coba ngelakuin hobi itu bareng pasangan? Bisa bikin makin kompak lho.",
            "Nonton bareng atau main game bareng itu quality time yang asik banget. Rekomendasi film favoritmu apa?",
            "Lagi sibuk sama diri sendiri ya? Gapapa, self-care itu penting biar kamu bisa kasih kasih sayang maksimal ke doi.",
            "Musik bisa jadi bahasa cinta lho. Coba kirimin lagu yang mewakili perasaanmu ke dia hari ini! 🎶"
        ]
    },
    work_study: {
        keywords: ["kerja", "sibuk", "tugas", "kantor", "kuliah", "sekolah", "ujian", "deadline", "capek kerja", "pusing"],
        responses: [
            "Semangat kerjanya! Jangan lupa istirahat sebentar ya di sela-sela kesibukan.",
            "Tugas emang kadang bikin pusing. Tapi tenang, setelah selesai kamu bisa tenang ngobrol sama doi.",
            "Kejar mimpi itu penting, tapi jangan lupa luangkan waktu buat orang tersayang ya agar seimbang.",
            "Fighting! Kamu hebat sudah berjuang sampai sejauh ini. Bangga deh sama kamu! 💪"
        ]
    },
    manifestation: {
        keywords: ["semoga", "ingin", "pengen", "harapan", "cita-cita", "maunya", "kapan ya", "doa"],
        responses: [
            "Aamiin! Semoga semua harapan dan doamu segera terwujud ya. ✨",
            "Usaha tidak akan mengkhianati hasil. Terus berjuang buat impianmu dan hubunganmu!",
            "Aku ikut mengaminkan semua harapan baikmu. LoveChat selalu mendukung kamu!",
            "Yakin saja, hal baik akan datang pada waktu yang tepat. Sabar ya! 🙏"
        ]
    },
    sadness: {
        keywords: ["sedih", "nangis", "galau", "kecewa", "putus", "patah hati", "sakit", "luka", "hampa", "sepi"],
        responses: [
            "Jangan sedih ya... Badai pasti berlalu. Tarik napas dalam-dalam, aku di sini dengerin kamu. 😢",
            "Menangis itu manusiawi kok. Lepaskan saja bebanmu, semoga setelah ini perasaanmu jadi lebih baik.",
            "Setiap luka butuh waktu untuk sembuh. Jangan menyalahkan dirimu sendiri ya. Kamu berharga!",
            "Ingat, kamu tidak sendirian. Ada orang-orang yang peduli padamu, termasuk aku (walaupun aku cuma bot). ❤️"
        ]
    },
    jokes: {
        keywords: ["lucu", "hibur", "ketawa", "lawak", "cerita lucu", "tebak", "dagelan", "gombal", "pantun"],
        responses: [
            "Kenapa pasangan itu kayak sepatu? Karena kalau gak pas, bakal bikin luka. Hehe... garing ya?",
            "Apa bedanya kamu sama modem? Kalau modem nyambung ke internet, kalau kamu nyambung ke hatiku. Eaa!",
            "Tahu gak kenapa aku suka LoveChat? Karena di sini aku bisa ketemu kamu yang manis banget.",
            "Cita-citaku dulu mau jadi astronot, tapi sekarang berubah. Mau jadi yang terbaik buat kamu aja. Heuheu.",
            "Pantun nih: Masak air biar matang, eh yang ditunggu gak kunjung datang. Sabar ya! 😂"
        ]
    },
    identity: {
        keywords: ["siapa kamu", "nama kamu", "siapa sih", "pencipta", "siapa nama", "lovebot", "bot", "kecerdasan", "manusia"],
        responses: [
            "Aku adalah LoveBot 2.0, asisten AI spesial untuk LoveChat yang dibuat untuk menjaga keharmonisan hubungan kalian. Aku pinter, tapi aku bakal makin cerdas kalau kamu mau upgrade ke Gemini! 😉",
            "Kenalin, namaku LoveBot! Aku asisten setiamu di sini yang siap mendengarkan curhatanmu kapan saja.",
            "Aku diciptakan khusus untuk membantu user LoveChat membangun hubungan yang lebih baik dan lebih seru!",
            "Aku adalah AI yang diprogram untuk mengerti rasa sayang. Walaupun aku bot, aku peduli kok! ❤️"
        ]
    }
};

const getSmartFallback = (userMsg: string): string => {
    const lowerMsg = userMsg.toLowerCase();
    let bestMatch: string | null = null;
    let maxMatches = 0;

    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
        const matchCount = data.keywords.reduce((acc, kw) => acc + (lowerMsg.includes(kw) ? 1 : 0), 0);
        if (matchCount > maxMatches) {
            maxMatches = matchCount;
            bestMatch = category;
        }
    }

    if (bestMatch) {
        const responses = KNOWLEDGE_BASE[bestMatch].responses;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    return `Aww, aku dengar kamu bilang '${userMsg}'. Sebagai LoveBot, aku melihat ini sebagai warna-warni dalam hubungan. Ceritain lebih lanjut dong!`;
};

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message, context = [] } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
                    { category: "HARM_CATEGORY_HATE_SPEECH" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any, threshold: "BLOCK_ONLY_HIGH" as any },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
                ],
            });

            const systemPrompt = `
        Identity: Kamu adalah LoveBot 2.0, asisten AI tercerdas dan paling romantis di aplikasi LoveChat.
        Style: Gunakan Bahasa Indonesia yang sangat ramah, hangat, perhatian, dan sedikit jenaka (Gaya bahasa anak muda Jakarta/gaul tapi sopan).
        Objective: Bantu user dengan masalah hubungan, beri saran romantis, atau ngobrol santai layaknya sahabat karib. 
        Constraint: Jangan memberikan jawaban yang terlalu teknis/kaku. Selalu akhiri dengan emoji yang manis. Maksimal 3-4 kalimat.
      `;

            const chatContext = context.slice(-5).join('\n');
            const prompt = `${systemPrompt}\n\nContext Percakapan:\n${chatContext}\n\nUser: ${message}\nLoveBot:`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            return {
                statusCode: 200,
                body: JSON.stringify({
                    response: responseText,
                    processed_at: Date.now() / 1000,
                    model_used: "Gemini 1.5 Flash (Netlify Node)"
                }),
            };
        }

        // Fallback
        const fallbackResponse = getSmartFallback(message);
        return {
            statusCode: 200,
            body: JSON.stringify({
                response: fallbackResponse,
                processed_at: Date.now() / 1000,
                model_used: "LoveBot Knowledge Base"
            }),
        };
    } catch (error: any) {
        console.error('Error in AI Chat Function:', error);
        return {
            statusCode: 200, // Still return 200 to not break frontend but with error msg
            body: JSON.stringify({
                response: "Duh, otak AI aku lagi overheat sedikit. Tapi intinya aku selalu di sini buat kamu! ❤️",
                processed_at: Date.now() / 1000,
                model_used: "Error Fallback"
            }),
        };
    }
};
