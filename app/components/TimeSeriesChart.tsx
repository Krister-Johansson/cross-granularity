'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeSeriesQuery } from '@/lib/timeSeries';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { AlertCircle, ChartNoAxesCombined } from 'lucide-react';
import { DateTime, DateTimeUnit } from 'luxon';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

const formatTimestampForDisplay = (
  timestamp: DateTime,
  resolution: DateTimeUnit
): string => {
  switch (resolution) {
    case 'hour':
      return timestamp.toFormat('MMM dd HH:mm');
    case 'day':
      return timestamp.toFormat('MMM dd');
    case 'week':
      return timestamp.toFormat('MMM dd');
    case 'month':
      return timestamp.toFormat('MMM yyyy');
    case 'year':
      return timestamp.toFormat('yyyy');
    default:
      return timestamp.toFormat('MMM dd');
  }
};

export default function TimeSeriesChart() {
  const { state } = useTimeSeriesContext();
  const { startDate, endDate, resolution } = state;
  const { data, isLoading, error } = useTimeSeriesQuery({
    startDate,
    endDate,
    resolution,
  });

  const chartData = useMemo(
    () =>
      (data?.buckets ?? []).map(bucket => ({
        timestamp: bucket.timestamp,
        value: bucket.value,
        label: bucket.label,

        displayTime: formatTimestampForDisplay(
          DateTime.fromISO(bucket.timestamp),
          resolution
        ),

        date: DateTime.fromISO(bucket.timestamp).toFormat('MMM dd, yyyy'),
      })),
    [data?.buckets, resolution]
  );

  const todayPosition = useMemo(() => {
    const now = DateTime.now();
    const chartStart = DateTime.fromISO(startDate);
    const chartEnd = DateTime.fromISO(endDate);

    if (now < chartStart || now > chartEnd) {
      return null;
    }

    const todayDisplayTime = formatTimestampForDisplay(now, resolution);

    return todayDisplayTime;
  }, [startDate, endDate, resolution]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="mb-4 text-sm text-muted-foreground">
          Loading time series data...
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartNoAxesCombined className="h-12 w-12" />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>No data available</EmptyTitle>
          <EmptyDescription>
            No time series data found for the selected date range. Try adjusting
            your date range or selecting a different preset.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  const chartConfig: ChartConfig = {
    value: {
      label: 'Inventory Level',
    },
    date: {
      label: 'Date',
    },
  };

  return (
    <div className="flex-1 p-4">
      <div className="h-full">
        <div className="w-full h-full flex flex-col">
          <div className="mb-4 text-sm text-muted-foreground">
            Resolution:{' '}
            <span className="font-medium capitalize">{resolution}</span> | Total
            data points:{' '}
            <span className="font-medium">
              {data.metadata.totalHourlyPoints}
            </span>
          </div>

          <div className="flex-1">
            <ChartContainer
              config={chartConfig}
              className="!aspect-auto h-full"
            >
              <AreaChart data={chartData} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="displayTime"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                {todayPosition && (
                  <ReferenceLine
                    x={todayPosition}
                    stroke="red"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: 'Now', position: 'top' }}
                  />
                )}
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0] && payload[0].payload) {
                          return payload[0].payload.date;
                        }
                        return value;
                      }}
                      formatter={value => [value?.toLocaleString()]}
                    />
                  }
                />
                <Area dataKey="value" />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
