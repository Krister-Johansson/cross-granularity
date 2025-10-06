'use client';

import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { useTimeSeriesQuery } from '@/lib/timeSeries';
import { DateTime } from 'luxon';
import PresetButtons from './PresetButtons';
import { Skeleton } from '@/components/ui/skeleton';

export default function BottomSummaryBar() {
  const { state } = useTimeSeriesContext();
  const { startDate, endDate, resolution } = state;
  const { data } = useTimeSeriesQuery({ startDate, endDate, resolution });

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-center justify-between">
        <PresetButtons />
        <div className="text-sm text-muted-foreground">
          {data?.metadata ? (
            <>
              {DateTime.fromISO(data.metadata.startDate).toFormat('MMM dd')} -{' '}
              {DateTime.fromISO(data.metadata.endDate).toFormat('MMM dd, yyyy')}
            </>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </div>
      </div>
    </div>
  );
}
