'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LeagueLogoProps {
  src: string;
  fallback: string;
  country: string;
}

export function LeagueLogo({ src, fallback, country }: LeagueLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <span className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl leading-none" role="img" aria-label={country}>{fallback}</span>;
  }

  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center" role="img" aria-label={`${country} competition logo`}>
      <Image
        src={src}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

