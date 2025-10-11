import React from 'react';
import { Hero } from '../components/landing/Hero';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      {/* Add other landing sections here as needed */}
    </div>
  );
}