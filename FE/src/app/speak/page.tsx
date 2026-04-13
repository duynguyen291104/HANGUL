'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpeakRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /speak to /pronunciation
    router.replace('/pronunciation');
  }, [router]);

  return null;
}
