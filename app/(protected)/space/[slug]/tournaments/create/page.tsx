'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

interface Game {
  id: string
  title: string
}

const SpaceTournamentCreatePage = () => {
  const params = useParams()
  const router = useRouter()
  const spaceSlug = params.slug as string
  const supabase = createBrowserClient()
  
  const [space, setSpace] = useState<any>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gameId: '',
    startDate: '',
    endDate: '',
    maxParticipants: '0',
    prizeDescription: '',
    status: 'upcoming',
  })

  useEffect(() => {
    fetchData()
  }, [spaceSlug])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single()

      setSpace(spaceData)

      // Check if user is admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData?.id)
        .eq('user_id', user.id)
        .single()

      if (memberData?.role !== 'admin' && memberData?.role !== 'owner') {
        router.push(`/space/${spaceSlug}/tournaments`)
        return
      }

      setIsAdmin(true)

      // Fetch games
      const { data: gamesData } = await supabase
        .from('games')
        .select('id, title')
        .order('title')

      setGames(gamesData || [])
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !space) {
        alert('Invalid session')
        return
      }

      if (!formData.name || !formData.gameId || !formData.startDate || !formData.endDate) {
        alert('Please fill in all required fields')
        return
      }

      const { error } = await supabase.from('tournaments').insert([
        {
          name: formData.name,
          description: formData.description,
          game_id: formData.gameId,
          start_date: new Date(formData.startDate).toISOString(),
          end_date: new Date(formData.endDate).toISOString(),
          max_participants: parseInt(formData.maxParticipants) || 0,
          prize_description: formData.prizeDescription,
          status: formData.status,
          created_by: user.id,
          space_id: space.id, // Private space tournament
        },
      ])

      if (error) {
        console.error('[v0] Error creating tournament:', error)
        alert('Failed to create tournament')
        return
      }

      alert('Tournament created successfully!')
      router.push(`/space/${spaceSlug}/tournaments`)
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('An error occurred while creating the tournament')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200/50 bg-red-50/50">
          <CardContent className="pt-6">
            <p className="text-red-600">You do not have permission to create tournaments</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link href={`/space/${spaceSlug}/tournaments`}>
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tournaments
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Create New Tournament</CardTitle>
          </div>
          <CardDescription>Set up a new tournament for {spaceSlug}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Space Championship"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the tournament..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-input min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="game">Game *</Label>
              <Select value={formData.gameId} onValueChange={(value) => setFormData({ ...formData, gameId: value })}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants (0 = Unlimited)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="0"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizeDescription">Prize Description</Label>
              <Textarea
                id="prizeDescription"
                placeholder="e.g., Bragging rights, in-game items, etc..."
                value={formData.prizeDescription}
                onChange={(e) => setFormData({ ...formData, prizeDescription: e.target.value })}
                className="bg-input min-h-20"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Link href={`/space/${spaceSlug}/tournaments`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SpaceTournamentCreatePage
