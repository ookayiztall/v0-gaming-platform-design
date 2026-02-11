"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, Edit2 } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Family Tournament",
    date: "Tomorrow",
    time: "8:00 PM",
    description: "Compete in our monthly family tournament with exciting prizes",
    participants: 24,
    maxParticipants: 32,
    game: "Chess Masters",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Quiz Night",
    date: "Friday",
    time: "6:00 PM",
    description: "Test your knowledge across various topics",
    participants: 18,
    maxParticipants: 20,
    game: "Trivia Masters",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Poker Championship",
    date: "Next Saturday",
    time: "7:00 PM",
    description: "High-stakes poker tournament for experienced players",
    participants: 16,
    maxParticipants: 20,
    game: "Poker Night",
    status: "upcoming",
  },
]

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold glow-text">Events</h1>
            </div>
            <p className="text-muted-foreground">Family & friends gaming events</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 hidden md:flex">
            <Edit2 className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="bg-card/50 border-border/50 backdrop-blur hover:border-primary/30 transition-all overflow-hidden group"
            >
              {/* Card Header with gradient */}
              <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {event.date} at <span className="font-semibold text-foreground">{event.time}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">{event.game}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-secondary" />
                    <span>
                      <span className="font-semibold text-foreground">{event.participants}</span> /{" "}
                      {event.maxParticipants} joined
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                      style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-4">
                  Join Event
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Event Mobile Button */}
        <div className="md:hidden">
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-12">
            <Edit2 className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Calendar View Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Calendar</h2>
          <Card className="bg-card/50 border-border/50 backdrop-blur p-6">
            <div className="grid grid-cols-7 gap-2 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="font-semibold text-muted-foreground text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {Array.from({ length: 35 }).map((_, idx) => {
                const day = idx - 2 // Adjust to start on the right day
                const hasEvent = day === 1 || day === 5 || day === 13
                return (
                  <div
                    key={idx}
                    className={`aspect-square p-2 rounded-lg flex items-center justify-center text-sm ${
                      day < 1 || day > 30
                        ? "text-muted-foreground/30"
                        : hasEvent
                          ? "bg-primary/30 border border-primary/50 font-semibold text-primary"
                          : "hover:bg-primary/10 text-foreground"
                    }`}
                  >
                    {day > 0 && day <= 30 ? day : ""}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
