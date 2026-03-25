'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface ChatModuleProps {
  space?: any;
}

export default function ChatModule({ space }: ChatModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setCurrentUser(authUser);

        if (space?.id) {
          // Fetch general chat messages for this space
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              profiles:user_id(username, avatar_url)
            `)
            .eq('space_id', space.id)
            .order('created_at', { ascending: true })
            .limit(50);

          setMessages(data || []);
        }
      } catch (error) {
        console.error('[v0] Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndMessages();

    // Subscribe to new messages
    if (space?.id) {
      const subscription = supabase
        .channel(`chat:${space.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `space_id=eq.${space.id}`,
          },
          (payload: any) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [space?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !space?.id || !currentUser) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message: newMessage,
          user_id: currentUser.id,
          space_id: space.id,
          channel_id: null, // General chat channel
        });

      if (!error) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">General Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">
                {msg.profiles?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {msg.profiles?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1 break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/30">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-input border-border focus:border-primary"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
