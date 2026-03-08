'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserPlus, Gamepad2, Rocket, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up Free',
    description: 'Create your account in seconds. No credit card required, just your email and you\'re ready to go.',
    color: 'from-primary to-primary/50',
  },
  {
    number: '02',
    icon: Gamepad2,
    title: 'Choose a Game',
    description: 'Browse our library of 50+ games. From casual puzzles to competitive tournaments, find your favorites.',
    color: 'from-secondary to-secondary/50',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Start Playing',
    description: 'Jump into games, climb the leaderboards, make friends, and become part of the GameVerse community.',
    color: 'from-primary to-secondary',
  },
];

const HowItWorks = () => {
  return (
    <section className="relative min-h-screen w-full bg-gradient-to-b from-background via-background to-background py-24 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_80%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="relative z-10 container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-semibold text-primary">Getting Started</span>
          <h2 className="mt-2 mb-4 text-4xl font-bold md:text-5xl">How It Works</h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Join thousands of players in just three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Connection lines for desktop */}
          <div className="absolute hidden h-1 w-1/3 translate-x-full bg-gradient-to-r from-primary to-transparent top-1/4 left-1/6 md:block">
            <div className="absolute top-0 h-full w-full bg-gradient-to-r from-primary/50 to-transparent" />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Step number */}
              <motion.div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold text-primary">
                {step.number}
              </motion.div>

              {/* Icon */}
              <motion.div className="mb-6 h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary p-2.5">
                <step.icon className="h-full w-full text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="mb-2 text-2xl font-semibold">{step.title}</h3>
              <p className="mb-4 text-muted-foreground">{step.description}</p>

              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <motion.div className="my-4 flex justify-center md:hidden">
                  <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="mb-6 text-lg text-muted-foreground">
            Ready to begin your adventure?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create your free account →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
