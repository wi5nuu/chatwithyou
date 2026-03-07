import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ChevronLeft, Bot, Sparkles, Heart, Lightbulb } from 'lucide-react';
import { useAI, AI_PERSONALITY, generateRomanticSuggestion, getRelationshipTip } from '@/hooks/useAI';

interface AIChatProps {
  userId: string;
  userEmail: string;
  onBack?: () => void;
}

interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'tip';
}

export function AIChat({ onBack }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { generateResponse, isProcessing } = useAI();

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = AI_PERSONALITY.greetings[Math.floor(Math.random() * AI_PERSONALITY.greetings.length)];
      setMessages([
        {
          id: 'welcome',
          content: greeting,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Small delay for UI feel
      const responseText = await generateResponse(userMessage.content);

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      // Attempt to check which model was used (this would normally come from the API response)
      // Since useAI only returns the string, we'll assume it's working
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRomanticSuggestion = () => {
    const suggestion = generateRomanticSuggestion();
    const aiMessage: AIMessage = {
      id: Date.now().toString(),
      content: `💡 **Saran Romantis:**\n${suggestion}`,
      isUser: false,
      timestamp: new Date(),
      type: 'suggestion',
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const getTip = () => {
    const tip = getRelationshipTip();
    const aiMessage: AIMessage = {
      id: Date.now().toString(),
      content: `💝 **Tips Hubungan:**\n${tip}`,
      isUser: false,
      timestamp: new Date(),
      type: 'tip',
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Background Blobs for Luxury Feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Container */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center p-[2px] shadow-lg">
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tighter uppercase">LoveBot AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">
                  Online
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter">Powered by Gemini</span>
          </div>
        </div>

        {/* Quick Actions moved inside the sticky area to prevent overlap */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto border-t border-gray-50 dark:border-gray-800/50">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full border-pink-200/50 dark:border-pink-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md hover:bg-pink-500 hover:text-white transition-all duration-300 shadow-sm group"
            onClick={getRomanticSuggestion}
          >
            <Heart className="w-3.5 h-3.5 mr-1.5 text-pink-500 group-hover:text-white transition-colors" />
            <span className="text-xs font-semibold">Saran Romantis</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full border-purple-200/50 dark:border-purple-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-sm group"
            onClick={getTip}
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1.5 text-purple-500 group-hover:text-white transition-colors" />
            <span className="text-xs font-semibold">Tips Hubungan</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2 z-10">
        <div className="max-w-2xl mx-auto space-y-6 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-3`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shadow-md shrink-0 mb-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[85%]">
                <div
                  className={`px-4 py-3 shadow-sm transition-all hover:shadow-md ${message.isUser
                    ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl rounded-tr-none'
                    : message.type === 'suggestion'
                      ? 'bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200/50 dark:border-pink-800/50 rounded-2xl rounded-tl-none backdrop-blur-sm'
                      : message.type === 'tip'
                        ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl rounded-tl-none backdrop-blur-sm'
                        : 'bg-white/80 dark:bg-gray-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl rounded-tl-none backdrop-blur-sm'
                    }`}
                >
                  <p className={`text-[13.5px] leading-relaxed whitespace-pre-line font-medium ${message.isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {message.content}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 ${message.isUser ? 'justify-end mr-1' : 'ml-1'}`}>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    {formatTime(message.timestamp)}
                  </span>
                  {!message.isUser && <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1 rounded font-black text-slate-500">AI</span>}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start items-end gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shadow-md shrink-0 mb-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Re-designed for modern feel */}
      <div className="p-4 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl border-t border-white/20 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-rose-500/20 transition-all">
          <Input
            placeholder="Ketik pesan romantis atau tanya sesuatu..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm font-medium px-4 h-11"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isProcessing}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/30 transition-all active:scale-95 group"
          >
            <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          <span>Asisten Romantis LoveChat</span>
        </div>
      </div>
    </div>
  );
}

