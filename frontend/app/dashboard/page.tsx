'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { DashboardConsole, SignedOutPrompt } from '../../components/analytics/operations-console';

export default function DashboardPage() {
  return (
    <>
      <SignedOut>
        <SignedOutPrompt label="Dashboard" />
      </SignedOut>
      <SignedIn>
        <DashboardConsole />
      </SignedIn>
    </>
  );
}
