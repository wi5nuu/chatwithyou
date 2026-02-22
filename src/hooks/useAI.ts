import { useState, useCallback } from 'react';

interface UseAIReturn {
  isProcessing: boolean;
  error: string | null;
  generateResponse: (message: string, context?: string[]) => Promise<string>;
  suggestReply: (conversation: string[]) => Promise<string>;
  analyzeSentiment: (text: string) => Promise<'positive' | 'negative' | 'neutral'>;
}

// Simple AI responses for LoveChat
// In production, this would connect to an actual AI API
const AI_RESPONSES: Record<string, string[]> = {
  greeting: [
    'Halo! Senang mendengar dari kamu! 😊',
    'Hai sayang! Apa kabar?',
    'Selamat datang! Ada yang bisa saya bantu?',
  ],
  love: [
    'Aww, itu sangat manis! ❤️',
    'Kamu selalu tahu cara membuatku tersenyum',
    'Aku juga merasakan hal yang sama',
    'Kamu adalah orang spesial bagiku',
  ],
  miss: [
    'Aku juga kangen kamu 😢',
    'Semoga kita bisa segera bertemu ya',
    'Kangen banget sama kamu...',
  ],
  goodnight: [
    'Selamat malam, mimpi indah! 🌙',
    'Tidur yang nyenyak ya sayang',
    'Good night! Besok kita ngobrol lagi',
  ],
  goodmorning: [
    'Selamat pagi! Semangat hari ini! ☀️',
    'Pagi sayang! Sudah sarapan?',
    'Good morning! Hari ini akan menjadi hari yang indah',
  ],
  default: [
    'Hmm, menarik! Ceritakan lebih banyak',
    'Aku mengerti, lanjutkan...',
    'Wah, seru juga ya!',
    'Oh gitu, terus gimana?',
    'Aku dengerin kamu kok',
  ],
};

const KEYWORDS: Record<string, string[]> = {
  greeting: ['halo', 'hai', 'hi', 'hello', 'hey'],
  love: ['cinta', 'sayang', 'love', 'kangen', 'rindu', 'miss', '<3', '❤️'],
  miss: ['kangen', 'rindu', 'miss you', 'kangen banget'],
  goodnight: ['selamat malam', 'good night', 'tidur', 'mimpi indah'],
  goodmorning: ['selamat pagi', 'good morning', 'pagi'],
};

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return 'default';
}

function getRandomResponse(intent: string): string {
  const responses = AI_RESPONSES[intent] || AI_RESPONSES.default;
  return responses[Math.floor(Math.random() * responses.length)];
}

export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (
    message: string,
    _context?: string[]
  ): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      const intent = detectIntent(message);
      const response = getRandomResponse(intent);

      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to generate response');
      return 'Maaf, aku tidak mengerti. Bisa ulangi?';
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const suggestReply = useCallback(async (conversation: string[]): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const lastMessage = conversation[conversation.length - 1] || '';
      const intent = detectIntent(lastMessage);

      const suggestions: Record<string, string> = {
        greeting: 'Halo juga! Apa kabar?',
        love: 'Aww, kamu juga sayang ❤️',
        miss: 'Aku juga kangen kamu 😢',
        goodnight: 'Selamat malam, mimpi indah!',
        goodmorning: 'Selamat pagi! Semangat ya!',
        default: 'Ooh, menarik! Ceritain lebih banyak dong',
      };

      return suggestions[intent] || suggestions.default;
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
