import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DateTime, DateTimeUnit } from 'luxon';

export interface TimeSeriesBucket {
  timestamp: string;
  value: number;
  label: string;
}

export interface TimeSeriesResponse {
  success: boolean;
  data?: {
    buckets: TimeSeriesBucket[];
    metadata: {
      startDate: string;
      endDate: string;
      resolution: DateTimeUnit;
      totalBuckets: number;
      totalHourlyPoints: number;
    };
  };
  error?: string;
}

export function buildTimeSeriesUrl(params: {
  startDate: string;
  endDate: string;
  resolution: DateTimeUnit;
}) {
  const sp = new URLSearchParams(params);
  return `/api/time-series?${sp.toString()}`;
}

export async function fetchTimeSeries(params: {
  startDate: string;
  endDate: string;
  resolution: DateTimeUnit;
}): Promise<TimeSeriesResponse['data']> {
  const alignedParams = {
    startDate: DateTime.fromISO(params.startDate)
      .startOf(params.resolution)
      .toISO()!,
    endDate: DateTime.fromISO(params.endDate).endOf(params.resolution).toISO()!,
    resolution: params.resolution,
  };

  const res = await fetch(buildTimeSeriesUrl(alignedParams));
  const json = (await res.json()) as TimeSeriesResponse;
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch time series');
  }
  return json.data!;
}

export function useTimeSeriesQuery(params: {
  startDate: string;
  endDate: string;
  resolution: DateTimeUnit;
}) {
  return useQuery({
    queryKey: ['time-series', params],
    queryFn: () => fetchTimeSeries(params),
    placeholderData: keepPreviousData,
    enabled: !!(params.startDate && params.endDate),
  });
}
