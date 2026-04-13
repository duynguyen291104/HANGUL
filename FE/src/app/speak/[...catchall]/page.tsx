'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpeakCatchAll({ params }: { params: { catchall: string[] } }) {
  const router = useRouter();

  useEffect(() => {
    const path = params.catchall.join('/');
    // Redirect /speak/* to /pronunciation/*
    if (path) {
      router.replace(`/pronunciation/${path}`);
    } else {
      router.replace('/pronunciation');
    }
  }, [params.catchall, router]);

  return null;
}
