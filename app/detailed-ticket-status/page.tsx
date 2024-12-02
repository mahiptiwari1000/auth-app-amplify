'use client';

import { Suspense } from 'react';
import DetailedTicketStatus from './DetailedTicketStatus';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailedTicketStatus />
    </Suspense>
  );
}
