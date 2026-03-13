'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit2, Trash2, ArrowLeft, Users, Check, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location?: string;
  creator_id: string;
  creator_username?: string;
  created_at: string;
  updated_at: string;
}

interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  username?: string;
  status: 'attending' | 'not_attending' | 'maybe';
  created_at: string;
}

export default function SpaceEventsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Map<string, EventRSVP[]>>(new Map());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRsvps, setUserRsvps] = useState<Map<string, string>>(new Map());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
  });

  useEffect(() => {
    loadEventsData();
  }, [spaceSlug]);

  const loadEventsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single();

      setSpace(spaceData);

      // Check if user is admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData?.id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(memberData?.role === 'admin' || memberData?.role === 'owner');

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, profiles:creator_id(username)')
        .eq('space_id', spaceData?.id)
        .order('event_date', { ascending: true });

      const eventsWithCreators = eventsData?.map((event: any) => ({
        ...event,
        creator_username: event.profiles?.username,
      })) || [];

      setEvents(eventsWithCreators);

      // Fetch all RSVPs
      const { data: rsvpsData } = await supabase
        .from('event_rsvps')
        .select('*, profiles:user_id(username)')
        .in('event_id', eventsWithCreators.map((e) => e.id));

      const rsvpMap = new Map<string, EventRSVP[]>();
      const userRsvpMap = new Map<string, string>();

      rsvpsData?.forEach((rsvp: any) => {
        const eventRsvps = rsvpMap.get(rsvp.event_id) || [];
        eventRsvps.push({
          ...rsvp,
          username: rsvp.profiles?.username,
        });
        rsvpMap.set(rsvp.event_id, eventRsvps);

        if (rsvp.user_id === user.id) {
          userRsvpMap.set(rsvp.event_id, rsvp.status);
        }
      });

      setRsvps(rsvpMap);
      setUserRsvps(userRsvpMap);
    } catch (error) {
      console.error('[v0] Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.event_date || !space || !currentUser) return;

    try {
      if (editingId) {
        await supabase
          .from('events')
          .update({
            title: formData.title,
            description: formData.description,
            event_date: formData.event_date,
            event_time: formData.event_time,
            location: formData.location,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
      } else {
        await supabase.from('events').insert([
          {
            space_id: space.id,
            title: formData.title,
            description: formData.description,
            event_date: formData.event_date,
            event_time: formData.event_time,
            location: formData.location,
            creator_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      setFormData({ title: '', description: '', event_date: '', event_time: '', location: '' });
      setEditingId(null);
      setIsCreating(false);
      loadEventsData();
    } catch (error) {
      console.error('[v0] Error saving event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await supabase.from('events').delete().eq('id', eventId);
      loadEventsData();
    } catch (error) {
      console.error('[v0] Error deleting event:', error);
    }
  };

  const handleRsvp = async (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    if (!currentUser) return;

    try {
      const existingRsvp = userRsvps.get(eventId);

      if (existingRsvp) {
        // Update existing RSVP
        await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('event_id', eventId)
          .eq('user_id', currentUser.id);
      } else {
        // Create new RSVP
        await supabase.from('event_rsvps').insert([
          {
            event_id: eventId,
            user_id: currentUser.id,
            status,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      loadEventsData();
    } catch (error) {
      console.error('[v0] Error updating RSVP:', error);
    }
  };

  const handleEditEvent = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location || '',
    });
    setEditingId(event.id);
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  if (viewingEventId) {
    const event = events.find((e) => e.id === viewingEventId);
    const eventRsvps = rsvps.get(viewingEventId) || [];

    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => setViewingEventId(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {event && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="mt-2">
                    By {event.creator_username} • {new Date(event.event_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        handleEditEvent(event);
                        setViewingEventId(null);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        handleDeleteEvent(event.id);
                        setViewingEventId(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{event.event_time || 'Not specified'}</p>
                </div>
                {event.location && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  RSVPs ({eventRsvps.length})
                </h3>

                {!isAdmin && (
                  <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                    <p className="text-sm font-medium">Are you attending?</p>
                    <div className="flex gap-2">
                      <Button
                        variant={userRsvps.get(viewingEventId) === 'attending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRsvp(viewingEventId, 'attending')}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Yes
                      </Button>
                      <Button
                        variant={userRsvps.get(viewingEventId) === 'maybe' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRsvp(viewingEventId, 'maybe')}
                      >
                        Maybe
                      </Button>
                      <Button
                        variant={userRsvps.get(viewingEventId) === 'not_attending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRsvp(viewingEventId, 'not_attending')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        No
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {eventRsvps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No RSVPs yet</p>
                  ) : (
                    <>
                      {eventRsvps
                        .filter((r) => r.status === 'attending')
                        .map((rsvp) => (
                          <div key={rsvp.id} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{rsvp.username} - Attending</span>
                          </div>
                        ))}
                      {eventRsvps
                        .filter((r) => r.status === 'maybe')
                        .map((rsvp) => (
                          <div key={rsvp.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">Maybe</Badge>
                            <span>{rsvp.username}</span>
                          </div>
                        ))}
                      {eventRsvps
                        .filter((r) => r.status === 'not_attending')
                        .map((rsvp) => (
                          <div key={rsvp.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <X className="h-4 w-4 text-gray-400" />
                            <span>{rsvp.username} - Not attending</span>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {isCreating ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setEditingId(null);
              setFormData({ title: '', description: '', event_date: '', event_time: '', location: '' });
            }}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Event' : 'Create New Event'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Event Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Gaming Tournament"
                  className="bg-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Date</label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Time</label>
                  <Input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="bg-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Location (Optional)</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Discord Voice, Game Server"
                  className="bg-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event..."
                  className="bg-input min-h-32"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ title: '', description: '', event_date: '', event_time: '', location: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent} disabled={!formData.title || !formData.event_date}>
                  {editingId ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Events</h1>
              <p className="text-muted-foreground mt-2">Upcoming events in {spaceSlug}</p>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isAdmin ? 'No events yet. Create one to get started!' : 'No upcoming events'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventRsvps = rsvps.get(event.id) || [];
                const userStatus = userRsvps.get(event.id);

                return (
                  <Card key={event.id} className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setViewingEventId(event.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {new Date(event.event_date).toLocaleDateString()} {event.event_time && `at ${event.event_time}`}
                            {event.location && ` • ${event.location}`}
                          </CardDescription>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{eventRsvps.length} RSVP</p>
                          {userStatus && (
                            <Badge className="mt-1" variant={userStatus === 'attending' ? 'default' : 'secondary'}>
                              {userStatus === 'attending' ? 'Attending' : userStatus === 'maybe' ? 'Maybe' : 'Not attending'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isAdmin && (
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
