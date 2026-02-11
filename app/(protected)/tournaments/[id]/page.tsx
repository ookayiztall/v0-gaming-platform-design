"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Participant {
  id: string
  user_id: string
  score: number
  rank: number | null
  profile: {
    username: string
  }
}

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const [tournament, setTournament] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchTournament()
    fetchParticipants()
  }, [params.id])

  async function fetchTournament() {
    const { data } = await supabase.from("tournaments").select(`*, game:games(title)`).eq("id", params.id).single()

    setTournament(data)
  }

  async function fetchParticipants() {
    const { data } = await supabase
      .from("tournament_participants")
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq("tournament_id", params.id)
      .order("score", { ascending: false })

    if (data) {
      // Assign ranks
      const rankedParticipants = data.map((p, index) => ({
        ...p,
        rank: index + 1,
      }))
      setParticipants(rankedParticipants)
    }
  }

  if (!tournament) return <div className="text-center py-12">Loading...</div>

  const medalColors = ["text-yellow-500", "text-gray-400", "text-orange-500"]

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tournaments
      </Button>

      <div className="grid gap-6">
        {/* Tournament Info */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{tournament.name}</CardTitle>
                <p className="text-muted-foreground mb-4">{tournament.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{tournament.game.title}</Badge>
                  <Badge variant="outline">{tournament.status.replace("_", " ")}</Badge>
                  <Badge variant="outline">
                    {new Date(tournament.start_date).toLocaleDateString()} -{" "}
                    {new Date(tournament.end_date).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          {tournament.prize_description && (
            <CardContent>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm">
                  <strong>Prize:</strong> {tournament.prize_description}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Leaderboard */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? "border-primary bg-primary/5" : "border-border bg-background/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {index < 3 ? (
                      <Medal className={`h-6 w-6 ${medalColors[index]}`} />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
                    )}

                    <Avatar>
                      <AvatarFallback>{participant.profile.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-semibold">{participant.profile.username}</p>
                      {index === 0 && <p className="text-xs text-yellow-500">Champion</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">{participant.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}

              {participants.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No participants yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
