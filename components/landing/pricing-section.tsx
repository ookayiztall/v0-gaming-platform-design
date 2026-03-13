'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Trophy, MessageCircle, BookOpen, Calendar } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Perfect for testing and small groups',
      members: 5,
      features: [
        'Up to 5 members',
        'All core games',
        'Basic chat channels',
        'Leaderboards',
        'Blog & Events',
        'Community support',
      ],
      cta: 'Create Free Space',
      featured: false,
    },
    {
      name: 'Standard',
      price: '$9.95',
      period: '/month',
      description: 'Great for growing communities',
      members: 10,
      features: [
        'Up to 10 members',
        'All games & tournaments',
        'Unlimited chat channels',
        'Advanced leaderboards',
        'Blog & Events management',
        'Voice chat support',
        'Priority support',
      ],
      cta: 'Start 7-Day Trial',
      featured: false,
    },
    {
      name: 'Premium',
      price: '$19.95',
      period: '/month',
      description: 'For established gaming communities',
      members: 20,
      features: [
        'Up to 20 members',
        'All games & tournaments',
        'Unlimited channels & users',
        'Custom leaderboards',
        'Full blog & events suite',
        '24/7 priority support',
        'Custom branding',
        'Analytics dashboard',
      ],
      cta: 'Start 7-Day Trial',
      featured: true,
    },
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-background via-background to-background py-24 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative z-10 container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">Private Spaces</Badge>
          <h2 className="text-4xl font-bold md:text-5xl mb-6 text-balance">
            Create Your Own Gaming Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Launch a private gaming space for your friends, family, or team. Same great features as our public platform, but completely private with your own stats, chat, and leaderboards.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`relative h-full flex flex-col ${
                plan.featured ? 'ring-2 ring-primary md:scale-105' : ''
              }`}>
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Up to {plan.members} members
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link href="/register">
                    <Button 
                      className="w-full"
                      variant={plan.featured ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-card/30 rounded-lg border border-border/50 p-8 backdrop-blur"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">What's Included in Every Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Trophy, label: 'Private Leaderboards', desc: 'Track stats only for your space' },
              { icon: MessageCircle, label: 'Chat & Voice', desc: 'Exclusive channels for members' },
              { icon: BookOpen, label: 'Blog & Stories', desc: 'Share guides and community posts' },
              { icon: Calendar, label: 'Events & Tournaments', desc: 'Organize gaming competitions' },
              { icon: Users, label: 'Member Management', desc: 'Full admin controls' },
              { icon: 'gamepad2', label: '100+ Games', desc: 'Full library access' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {item.icon === 'gamepad2' ? (
                    <span className="text-lg">🎮</span>
                  ) : (
                    <item.icon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold mb-6">Why Choose a Private Space?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="font-semibold mb-2">Completely Private</h4>
              <p className="text-sm text-muted-foreground">Only invited members can access. Your data stays yours.</p>
            </div>
            <div>
              <div className="text-4xl mb-3">⚙️</div>
              <h4 className="font-semibold mb-2">Full Control</h4>
              <p className="text-sm text-muted-foreground">You decide the rules, channels, games, and member roles.</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold mb-2">Built Your Way</h4>
              <p className="text-sm text-muted-foreground">Customize everything from leaderboards to event types.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
