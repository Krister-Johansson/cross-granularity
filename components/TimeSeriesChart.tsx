'use client';

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
import { useTimeSeriesQuery } from '@/lib/timeSeries';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { formatTimestampForDisplay } from '@/lib/utils';
import { ChartNoAxesCombined, Loader2, TriangleAlert } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

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
      })),
    [data?.buckets]
  );
  const todayPosition = useMemo(() => {
    const actualNow = DateTime.now();
    const chartStart = DateTime.fromISO(startDate);
    const chartEnd = DateTime.fromISO(endDate);

    // Check if today is within the chart range using actual time
    if (actualNow < chartStart || actualNow > chartEnd) {
      return null;
    }

    // Align to bucket start for matching
    const bucketAlignedNow = actualNow.startOf(resolution);
    const alignedMillis = bucketAlignedNow.toMillis();

    // Find the index of the bucket that matches by comparing milliseconds
    const matchingIndex = chartData.findIndex(bucket => {
      const bucketMillis = DateTime.fromISO(bucket.timestamp).toMillis();
      return bucketMillis === alignedMillis;
    });

    // Return the index if found
    return matchingIndex >= 0 ? matchingIndex : null;
  }, [startDate, endDate, resolution, chartData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader2 className="h-12 w-12 animate-spin" />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>Loading chart data</EmptyTitle>
          <EmptyDescription>
            Fetching time series data for the selected range...
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlert className="h-12 w-12 text-destructive" />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>Failed to load data</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred while fetching time series data.'}
          </EmptyDescription>
        </Empty>
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
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={timestamp =>
                    formatTimestampForDisplay(
                      DateTime.fromISO(timestamp),
                      resolution
                    )
                  }
                />
                <YAxis tick={{ fontSize: 12 }} />
                {todayPosition !== null && chartData[todayPosition] && (
                  <ReferenceLine
                    x={chartData[todayPosition].timestamp}
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
                          const timestamp = payload[0].payload.timestamp;
                          const dt = DateTime.fromISO(timestamp);
                          return formatTimestampForDisplay(dt, resolution);
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
