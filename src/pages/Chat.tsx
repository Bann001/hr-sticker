import { useState } from 'react';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
}

const conversations: Conversation[] = [
  { id: '1', name: 'Sarah Chen', avatar: 'SC', lastMessage: 'The new batch labels look great!', time: '2m', unread: 3, online: true },
  { id: '2', name: 'Mike Johnson', avatar: 'MJ', lastMessage: 'Can we adjust the margins on A4?', time: '15m', unread: 1, online: true },
  { id: '3', name: 'Emily Davis', avatar: 'ED', lastMessage: 'Client approved the sticker design', time: '1h', unread: 0, online: false },
  { id: '4', name: 'Alex Rivera', avatar: 'AR', lastMessage: 'Updated the template file', time: '2h', unread: 0, online: false },
  { id: '5', name: 'Design Team', avatar: 'DT', lastMessage: 'Meeting tomorrow at 10am', time: '3h', unread: 5, online: true },
  { id: '6', name: 'Priya Patel', avatar: 'PP', lastMessage: 'Need help with the barcode format', time: '5h', unread: 0, online: false },
];

const mockMessages: Message[] = [
  { id: 'm1', text: 'Hey team, just uploaded the new sticker templates for Q3', time: '9:32 AM', fromMe: false },
  { id: 'm2', text: 'Nice, I\'ll take a look. Are these for the premium line?', time: '9:33 AM', fromMe: true },
  { id: 'm3', text: 'Yes, exactly. We\'re rolling out 4 new SKUs.', time: '9:34 AM', fromMe: false },
  { id: 'm4', text: 'The die-cut dimensions need to match the spec sheet from last week', time: '9:36 AM', fromMe: true },
  { id: 'm5', text: 'Already cross-referenced them. Everything aligns perfectly.', time: '9:38 AM', fromMe: false },
  { id: 'm6', text: 'Great work! When can we get the print proofs?', time: '9:40 AM', fromMe: true },
  { id: 'm7', text: 'Print shop says EOD tomorrow for digital proofs.', time: '9:42 AM', fromMe: false },
  { id: 'm8', text: 'Perfect, that gives us time for one revision cycle before the deadline.', time: '9:45 AM', fromMe: true },
];

export function ChatPage() {
  const [activeId, setActiveId] = useState('1');
  const [inputValue, setInputValue] = useState('');

  const activeConv = conversations.find(c => c.id === activeId)!;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-bg-sidebar border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Conversations</h1>
          <p className="text-sm text-text-muted">Team discussions</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[280px] min-w-[280px] bg-bg-sidebar border-r border-border overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`px-4 py-3 border-b border-border hover:bg-bg-surface cursor-pointer transition-colors ${
                activeId === conv.id ? 'bg-accent/10 border-l-2 border-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg-sidebar" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {conv.name}
                    </span>
                    <span className="text-xs text-text-muted shrink-0 ml-2">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-text-secondary truncate">{conv.lastMessage}</span>
                    {conv.unread > 0 && (
                      <span className="bg-accent text-selected-text rounded-full text-xs px-2 py-0.5 font-medium shrink-0 ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </aside>

        {/* Main panel */}
        <div className="flex-1 flex flex-col bg-bg-primary min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-3 bg-bg-surface border-b border-border shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
              {activeConv.avatar}
            </div>
            <div>
              <span className="text-sm font-medium text-text-primary">{activeConv.name}</span>
              {activeConv.online && (
                <span className="text-xs text-text-muted ml-2">online</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {mockMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[70%] text-sm ${
                    msg.fromMe
                      ? 'ml-auto bg-accent/10 rounded-br-md'
                      : 'bg-bg-surface rounded-bl-md'
                  }`}
                >
                  <p className="text-text-primary whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-xs text-text-muted mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="px-6 py-4 bg-bg-surface border-t border-border shrink-0">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 h-10 px-4 text-sm bg-bg-primary border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10"
                placeholder="Type a message..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    setInputValue('');
                  }
                }}
              />
              <button
                className="h-10 px-5 rounded-xl text-sm font-semibold bg-accent text-selected-text hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
                disabled={!inputValue.trim()}
                onClick={() => setInputValue('')}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}