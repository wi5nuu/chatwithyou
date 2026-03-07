import { useState, useCallback } from 'react';

interface UseAIReturn {
  isProcessing: boolean;
  error: string | null;
  generateResponse: (message: string, context?: string[]) => Promise<string>;
  suggestReply: (conversation: string[]) => Promise<string>;
  analyzeSentiment: (text: string) => Promise<'positive' | 'negative' | 'neutral'>;
}


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (
    message: string,
    context: string[] = []
  ): Promise<string> => {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API Key missing, using local fallback...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "Maaf, aku sedang tidak bisa berpikir jernih. Coba lagi nanti ya sayang! ❤️";
    }

    setIsProcessing(true);
    setError(null);

    try {
      const history = context.map(msg => ({
        role: msg.startsWith('User:') ? 'user' : 'model',
        parts: [{ text: msg.replace(/^(User|Model|Assistant): /, '') }]
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...history,
            {
              role: 'user',
              parts: [{
                text: `Kamu adalah LoveBot, asisten romantis LoveChat. 
                Tugasmu: Memberikan saran hubungan, jawaban romantis, atau sekadar teman curhat.
                ATURAN PENTING: 
                1. Jawaban harus SANGAT SINGKAT (maksimal 2-3 kalimat).
                2. Gunakan gaya bahasa yang hangat, perhatian, dan sedikit romantis.
                3. Gunakan Bahasa Indonesia kecuali user bertanya dalam bahasa lain.
                4. Jika user bertanya "siapa kamu", jelaskan singkat bahwa kamu LoveBot.
                
                Pesan user: ${message}`
              }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error('AI API Error:', err);
      return "Aku butuh waktu sebentar untuk merenung. Tanya lagi ya! ❤️";
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const suggestReply = useCallback(async (_conversation: string[]): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      return 'Wah, menarik banget! Ceritain lebih banyak dong... 😊';
    } catch (err: any) {
      setError(err.message || 'Failed to suggest reply');
      return '';
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const analyzeSentiment = useCallback(async (
    text: string
  ): Promise<'positive' | 'negative' | 'neutral'> => {
    try {
      const positiveWords = ['senang', 'bahagia', 'cinta', 'sayang', 'bagus', 'hebat', 'mantap', 'keren', 'love', 'happy', 'good', 'great', 'awesome', '❤️', '😊', '😍', '🥰'];
      const negativeWords = ['sedih', 'marah', 'kecewa', 'buruk', 'jelek', 'sakit', 'sad', 'angry', 'bad', 'hate', '😢', '😠', '😞', '💔'];

      const lowerText = text.toLowerCase();

      let positiveScore = 0;
      let negativeScore = 0;

      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveScore++;
      });

      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeScore++;
      });

      if (positiveScore > negativeScore) return 'positive';
      if (negativeScore > positiveScore) return 'negative';
      return 'neutral';
    } catch (err) {
      return 'neutral';
    }
  }, []);

  return {
    isProcessing,
    error,
    generateResponse,
    suggestReply,
    analyzeSentiment,
  };
}

// AI Assistant personality for LoveChat
export const AI_PERSONALITY = {
  name: 'LoveBot',
  description: 'AI assistant untuk pasangan yang membantu komunikasi dan memberikan saran romantis',
  traits: [
    'Romantis dan perhatian',
    'Pendengar yang baik',
    'Memberikan saran positif',
    'Responsif dan ramah',
  ],
  greetings: [
    'Halo! Aku LoveBot, siap membantu komunikasi kalian ❤️',
    'Hai! Aku di sini untuk membuat hubungan kalian lebih harmonis',
    'Selamat datang! Mau curhat atau butuh saran romantis?',
  ],
};

// Generate romantic suggestions
export function generateRomanticSuggestion(): string {
  const suggestions = [
    'Kirimkan pesan "Aku cinta kamu" secara tiba-tiba',
    'Bagikan foto kenangan manis kalian',
    'Tanyakan kabarnya dengan penuh perhatian',
    'Kirimkan emoji love ❤️ tanpa alasan',
    'Ceritakan hal kecil yang membuatmu teringat dia',
    'Ucapkan terima kasih untuk hal-hal kecil',
    'Rencanakan kejutan kecil untuknya',
    'Kirimkan voice note yang manis',
  ];

  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Relationship tips
export function getRelationshipTip(): string {
  const tips = [
    'Komunikasi adalah kunci hubungan yang sehat',
    'Selalu dengarkan dengan empati',
    'Katakan hal-hal positif setiap hari',
    'Jangan pernah tidur dalam keadaan marah',
    'Berikan ruang dan privasi satu sama lain',
    'Rayakan momen-momen kecil bersama',
    'Jujur dan terbuka tentang perasaanmu',
    'Support impian dan tujuan pasanganmu',
  ];

  return tips[Math.floor(Math.random() * tips.length)];
}
