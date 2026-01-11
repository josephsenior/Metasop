'use client';

import { ReactNode } from 'react';

// Simple passthrough wrapper for now
// AI SDK 3.4 doesn't have stable RSC providers
export default function GenUIWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
