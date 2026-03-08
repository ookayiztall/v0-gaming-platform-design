'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Trophy, MessageCircle, Users, Calendar, User } from 'lucide-react';

const features = [
  {
    icon: Gamepad2,
    title: 'Game Library',
    description: 'Access 50+ games including Card Games, Casino, Trivia, and Puzzles. New games added regularly.',
    gradient: 'from-primary to-primary/50',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'Compete for the top spots. Track your global rank, win streaks, and earn achievement badges.',
    gradient: 'from-secondary to-secondary/50',
  },
  {
    icon: MessageCircle,
    title: 'Discord-Style Chat',
    description: 'Join channels, chat with friends, and connect with the gaming community in real-time.',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: Users,
    title: 'Multiplayer Games',
    description: 'Challenge friends or match with players worldwide. Real-time multiplayer experience.',
    gradient: 'from-secondary to-primary',
  },
  {
    icon: Calendar,
    title: 'Tournaments & Events',
    description: 'Participate in weekly tournaments and special events. Win prizes and glory.',
    gradient: 'from-primary to-primary/50',
  },
  {
    icon: User,
    title: 'Player Profiles',
    description: 'Customize your profile, track stats, manage friends, and showcase your achievements.',
    gradient: 'from-secondary to-secondary/50',
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative min-h-screen w-full bg-gradient-to-b from-background via-background to-background py-24 px-4"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="relative z-10 container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Everything You Need to <span className="text-gradient">Play & Connect</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            A complete gaming ecosystem designed for fun, competition, and community.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 p-8 backdrop-blur transition-all hover:border-border/80 hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-5`}
              />

              {/* Icon */}
              <div className="relative z-10 mb-6 inline-flex rounded-lg bg-gradient-to-br p-3">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="relative z-10 mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="relative z-10 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
