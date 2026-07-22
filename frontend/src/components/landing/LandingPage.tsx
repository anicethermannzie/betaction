'use client';

import React from 'react';
import { HeroSection } from './HeroSection';
import { SportCategories } from './SportCategories';
import { DiscoverSection } from './DiscoverSection';
import { HowItWorks } from './HowItWorks';
import { TicketPreview } from './TicketPreview';
import { FeaturesGrid } from './FeaturesGrid';
import { PricingSection } from './PricingSection';
import { StatsBar } from './StatsBar';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f1419] text-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Sport Filter Categories Bar */}
      <SportCategories />

      {/* What is BetAction (Discover) */}
      <DiscoverSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Today's Tickets Preview */}
      <TicketPreview />

      {/* Key Features Grid */}
      <FeaturesGrid />

      {/* Pricing Options */}
      <PricingSection />

      {/* Stats Social Proof Strip */}
      <StatsBar />
    </div>
  );
}
