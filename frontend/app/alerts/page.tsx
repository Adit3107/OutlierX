'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { AlertsConsole, SignedOutPrompt } from '../../components/analytics/operations-console';

export default function AlertsPage() {
  return (
    <>
      <SignedOut>
        <SignedOutPrompt label="Alert Center" />
      </SignedOut>
      <SignedIn>
        <AlertsConsole />
      </SignedIn>
    </>
  );
}
