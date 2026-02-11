'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat-message';
import { Send, Phone, PhoneOff, Mic, MicOff, Plus, Trash2, Edit2 } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatPageProps {
  spaceSlug: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  space_id: string;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface VoiceUser {
  userId: string;
  username: string;
  avatar: string;
  isMuted: boolean;
}

export function ChatPage({ spaceSlug }: ChatPageProps) {
  const [space, setSpace] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Get space
        const { data: spaceData } = await supabase
          .from('spaces')
          .select('*')
          .eq('slug', spaceSlug)
          .single();

        setSpace(spaceData);

        // Check if owner/admin
        const { data: membership } = await supabase
          .from('space_memberships')
          .select('role')
          .eq('space_id', spaceData.id)
          .eq('user_id', user.id)
          .single();

        setIsOwner(['owner', 'admin'].includes(membership?.role));

        // Fetch channels
        const { data: channelsData } = await supabase
          .from('chat_channels')
          .select('*')
          .eq('space_id', spaceData.id)
          .order('created_at', { ascending: true });

        setChannels(channelsData || []);
        if (channelsData?.length > 0) {
          setSelectedChannel(channelsData[0].id);
        }
      } catch (error) {
        console.error('[v0] Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [spaceSlug]);

  // Load messages and subscribe
  useEffect(() => {
    if (!selectedChannel) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          profiles:user_id (username, avatar_url)
        `)
        .eq('channel_id', selectedChannel)
        .order('created_at', { ascending: true })
        .limit(50);

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`space:${spaceSlug}:${selectedChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${selectedChannel}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel, spaceSlug]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    await supabase.from('chat_messages').insert({
      channel_id: selectedChannel,
      user_id: currentUser.id,
      message: inputValue.trim(),
    });

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsVoiceChatActive(true);

      // Create voice session
      await supabase.from('voice_sessions').insert({
        channel_id: selectedChannel,
        user_id: currentUser.id,
        peer_id: currentUser.id,
      });

      // Subscribe to voice presence
      const voiceChannel = supabase.channel(`voice:${selectedChannel}`);
      voiceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = voiceChannel.presenceState();
          const users = Object.values(state).flat().map((p: any) => ({
            userId: p.user_id,
            username: p.username || 'User',
            avatar: p.avatar || '👤',
            isMuted: p.is_muted || false,
          }));
          setVoiceUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('user_id', currentUser.id)
              .single();

            await voiceChannel.track({
              user_id: currentUser.id,
              username: profile?.username || 'User',
              avatar: profile?.avatar_url || '👤',
              is_muted: false,
            });
          }
        });

      channelRef.current = voiceChannel;
    } catch (error) {
      console.error('[v0] Error starting voice chat:', error);
      alert('Could not access microphone');
    }
  };

  const stopVoiceChat = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (channelRef.current) {
      await channelRef.current.untrack();
    }

    setIsVoiceChatActive(false);
    setIsMuted(false);
    setVoiceUsers([]);

    // Update voice session
    await supabase
      .from('voice_sessions')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('user_id', currentUser.id)
      .eq('channel_id', selectedChannel);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);

      if (channelRef.current && currentUser) {
        channelRef.current.track({
          user_id: currentUser.id,
          is_muted: !audioTrack.enabled,
        });
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading chat...</div>;
  }

  const currentChannelName = channels.find(c => c.id === selectedChannel)?.name || 'general';

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Channels Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/30 backdrop-blur">
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Channels</h3>
            {isOwner && (
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`p-2 rounded cursor-pointer group transition-colors ${
                selectedChannel === channel.id
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-accent/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">#{channel.name}</span>
                {isOwner && (
                  <div className="hidden group-hover:flex gap-1">
                    <button className="p-1 hover:bg-background rounded">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 hover:bg-destructive/10 text-destructive rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">#{currentChannelName}</h1>
            <div className="flex items-center gap-2">
              {isVoiceChatActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={isMuted ? 'text-red-500' : 'text-green-500'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Button
                variant={isVoiceChatActive ? 'destructive' : 'default'}
                size="sm"
                onClick={isVoiceChatActive ? stopVoiceChat : startVoiceChat}
                className="gap-2"
              >
                {isVoiceChatActive ? (
                  <>
                    <PhoneOff className="w-4 h-4" />
                    Leave Voice
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Join Voice
                  </>
                )}
              </Button>
              {voiceUsers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {voiceUsers.length} in voice
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              username={msg.profiles?.username || 'Unknown'}
              avatar={msg.profiles?.avatar_url || '👤'}
              message={msg.message}
              timestamp={new Date(msg.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
              isCurrentUser={msg.user_id === currentUser?.id}
              status="online"
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Users */}
        {isVoiceChatActive && voiceUsers.length > 0 && (
          <div className="border-t border-border/50 bg-card/30 backdrop-blur px-6 py-3">
            <p className="text-xs text-muted-foreground mb-2">In voice chat:</p>
            <div className="flex gap-2 flex-wrap">
              {voiceUsers.map((user) => (
                <div key={user.userId} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary text-xs">
                  <span>{user.avatar}</span>
                  <span>{user.username}</span>
                  {user.isMuted && <Mic className="w-2 h-2 opacity-50" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/50 bg-card/30 backdrop-blur p-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={`Message #${currentChannelName}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-accent hover:bg-accent/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
