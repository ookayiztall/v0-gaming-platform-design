'use client';

import { motion } from 'framer-motion';
import { Users, Gamepad2, Trophy, Zap } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '25K+',
    label: 'Active Players',
    color: 'text-primary',
  },
  {
    icon: Gamepad2,
    value: '48.2K',
    label: 'Games Played',
    color: 'text-secondary',
  },
  {
    icon: Trophy,
    value: '150+',
    label: 'Tournaments',
    color: 'text-primary',
  },
  {
    icon: Zap,
    value: '42.3%',
    label: 'Avg Win Rate',
    color: 'text-secondary',
  },
];

const StatsSection = () => {
  return (
    <section
      id="stats"
      className="relative w-full bg-gradient-to-b from-background via-background to-background py-24 px-4"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

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
            Join the Growing Community
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Thousands of players are already competing, connecting, and having fun.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border/40 bg-card/30 p-8 backdrop-blur text-center hover:border-border/80 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <div className={`inline-flex justify-center mb-4 ${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
