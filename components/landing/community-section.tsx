'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Users, Trophy, Flame } from 'lucide-react';

const achievements = [
  { icon: Flame, title: 'Hot Streak', description: '5-win streak', color: 'text-secondary' },
  { icon: Trophy, title: 'Top 100', description: 'Rank in top 100', color: 'text-primary' },
  { icon: Users, title: 'Social Butterfly', description: '50+ friends', color: 'text-secondary' },
];

const chatMessages = [
  { user: 'ShadowKnight', message: 'GG everyone! That was intense 🔥', online: true },
  { user: 'NeonGamer', message: 'Who\'s up for another round?', online: true },
  { user: 'PhantomEcho', message: 'Count me in!', online: true },
];

const CommunitySection = () => {
  return (
    <section
      id="community"
      className="relative w-full bg-gradient-to-b from-background via-background to-background py-24 px-4"
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
            A Thriving Community
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Connect with players, earn achievements, and be part of something special.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border/40 bg-card/30 backdrop-blur overflow-hidden"
          >
            <div className="border-b border-border/40 px-6 py-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </h3>
              <p className="text-xs text-muted-foreground mt-1">#General</p>
            </div>

            <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                      {msg.user[0]}
                    </div>
                    {msg.online && (
                      <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{msg.user}</p>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-border/40 px-6 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message #General..."
                  className="flex-1 rounded-lg bg-background/50 px-3 py-2 text-sm outline-none border border-border/40 focus:border-primary"
                  disabled
                />
              </div>
            </div>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Achievements */}
            <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur p-6">
              <h3 className="font-semibold mb-4">Achievements & Badges</h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 rounded-lg bg-background/30 p-3"
                  >
                    <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                    <div>
                      <p className="text-sm font-semibold">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Rank Preview */}
            <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur p-6">
              <h3 className="font-semibold mb-4">Your Current Rank</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Next Rank In</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">#3</span>
                    <span className="text-muted-foreground">3,220 points</span>
                  </div>
                </div>
                <div className="w-full bg-background/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full" style={{ width: '67%' }} />
                </div>
                <p className="text-xs text-muted-foreground">630 points to next rank</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
