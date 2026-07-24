import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTIONS = [
  "How do I create a batch?",
  "What formats are supported?",
  "Help me design a sticker",
];

export function ChatBuddyPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        "Hi! I'm your AI assistant. I can help you with sticker design, batch processing, formatting, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `Thanks for your question! I'm still learning, but I'll do my best to help you with "${text}". In the meantime, feel free to explore the other tools available in the sidebar.`,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    addUserMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">AI Assistant</h1>
        <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-success/10 text-success">
          v3.0
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <div
                key={i}
                className="bg-bg-surface border border-border rounded-2xl rounded-bl-md p-4 max-w-[85%]"
              >
                <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              <div
                key={i}
                className="bg-accent/10 rounded-2xl rounded-br-md p-4 max-w-[85%] ml-auto"
              >
                <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
              </div>
            ),
          )}
          {isLoading && (
            <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-md p-4 max-w-[85%]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addUserMessage(suggestion)}
                  className="px-4 py-2 bg-bg-surface border border-border rounded-full text-sm text-text-secondary hover:bg-border hover:text-text-primary cursor-pointer transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="h-12 px-4 bg-bg-surface border border-border rounded-2xl text-text-primary w-full focus:outline-none focus:border-accent/30"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-12 w-12 flex items-center justify-center bg-accent rounded-2xl text-selected-text disabled:opacity-40 hover:bg-accent-hover transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}