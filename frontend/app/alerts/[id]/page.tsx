'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { AlertDetailConsole, SignedOutPrompt } from '../../../components/analytics/operations-console';

export default function AlertDetailPage() {
  return (
    <>
      <SignedOut>
        <SignedOutPrompt label="Alert Details" />
      </SignedOut>
      <SignedIn>
        <AlertDetailConsole />
      </SignedIn>
    </>
  );
}
