import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ChevronLeft, Bot, Sparkles, Heart, Lightbulb } from 'lucide-react';
import { useAI, AI_PERSONALITY, generateRomanticSuggestion, getRelationshipTip } from '@/hooks/useAI';

interface AIChatProps {
  userId: string;
  userEmail: string;
  onBack?: () => void;
  isMobile?: boolean;
}

interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'tip';
}

export function AIChat({ onBack, isMobile }: AIChatProps) {
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
  }, [messages]);

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
      const response = await generateResponse(userMessage.content);
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
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
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
      {/* Header */}
      <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-purple-100 dark:border-purple-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500">
              <AvatarFallback className="text-white">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">{AI_PERSONALITY.name}</p>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur border-b border-purple-100 dark:border-purple-800">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            onClick={getRomanticSuggestion}
          >
            <Heart className="w-4 h-4 mr-1 text-pink-500" />
            Saran Romantis
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            onClick={getTip}
          >
            <Lightbulb className="w-4 h-4 mr-1 text-purple-500" />
            Tips Hubungan
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {!message.isUser && (
                <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                  <AvatarFallback className="text-white text-xs">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none'
                    : message.type === 'suggestion'
                    ? 'bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border border-pink-200 dark:border-pink-800 rounded-bl-none'
                    : message.type === 'tip'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border border-purple-200 dark:border-purple-800 rounded-bl-none'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                }`}
              >
                <p className={`text-sm whitespace-pre-line ${message.isUser ? 'text-white' : ''}`}>
                  {message.content}
                </p>
                <p className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start items-end gap-2">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                <AvatarFallback className="text-white text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tanyakan sesuatu ke LoveBot..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isProcessing}
            className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          LoveBot AI memberikan saran romantis dan tips hubungan
        </p>
      </div>
    </div>
  );
}
