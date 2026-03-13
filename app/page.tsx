'use client';

import Navbar from '@/components/landing/navbar';
import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import HowItWorks from '@/components/landing/how-it-works';
import GamesShowcase from '@/components/landing/games-showcase';
import StatsSection from '@/components/landing/stats-section';
import CommunitySection from '@/components/landing/community-section';
import PricingSection from '@/components/landing/pricing-section';
import CTASection from '@/components/landing/cta-section';
import Footer from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <GamesShowcase />
      <StatsSection />
      <PricingSection />
      <CommunitySection />
      <CTASection />
      <Footer />
    </main>
  );
}
