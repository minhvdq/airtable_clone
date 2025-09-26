'use client';

import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';
import { type PropsWithChildren } from 'react';
import { TRPCReactProvider } from '~/trpc/react'; // Assuming this is your client TRPC provider

/**
 * A combined provider component that wraps TRPC and NextAuth Session.
 * It must be a client component (use client) to use SessionProvider.
 */
export default function CombinedProviders({
  children,
  session,
}: PropsWithChildren<{ session: Session | null }>) {
  return (
    // Wrap the entire app with SessionProvider first, 
    // so useSession() works inside TRPC-connected components.
    <SessionProvider session={session}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </SessionProvider>
  );
}