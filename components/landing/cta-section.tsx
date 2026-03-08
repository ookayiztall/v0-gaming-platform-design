'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative w-full bg-gradient-to-b from-background via-background to-background py-24 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative z-10 container mx-auto text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-6 text-4xl font-bold md:text-5xl"
        >
          Ready to Level Up?
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-12 max-w-2xl mx-auto text-lg text-muted-foreground"
        >
          Join thousands of players already on GameVerse. Free to play, easy to start, impossible to put down.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-8"
        >
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Create Free Account
            </Button>
          </Link>
          <Link href="/games">
            <Button size="lg" variant="outline" className="gap-2">
              Explore Games
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Features text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-sm text-muted-foreground"
        >
          No credit card required • Instant access • Free forever
        </motion.p>
      </div>
    </section>
  );
};

export default CTASection;
