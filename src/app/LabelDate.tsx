'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Trailer } from '@/types';

export default function LabelDate({ trailer }: { trailer: Trailer | null }) {
  const [labelDate, setLabelDate] = useState('');

  useEffect(() => {
    const dateFormat = 'dd/MM/yyyy';
    if (trailer?.arrivalDate) {
      try {
        setLabelDate(format(parseISO(trailer.arrivalDate), dateFormat));
      } catch {
        setLabelDate(format(new Date(), dateFormat));
      }
    } else {
      setLabelDate(format(new Date(), dateFormat));
    }
  }, [trailer]);

  return <>{labelDate}</>;
}
