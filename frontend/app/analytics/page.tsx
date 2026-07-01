'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { AnalyticsConsole, SignedOutPrompt } from '../../components/analytics/operations-console';

export default function AnalyticsPage() {
  return (
    <>
      <SignedOut>
        <SignedOutPrompt label="Analytics" />
      </SignedOut>
      <SignedIn>
        <AnalyticsConsole />
      </SignedIn>
    </>
  );
}
