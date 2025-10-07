import { NextRequest, NextResponse } from 'next/server';
import { DateTime, DateTimeUnit } from 'luxon';

const VALID_RESOLUTIONS = [
  'hour',
  'day',
  'week',
  'month',
  'year',
] as const satisfies readonly DateTimeUnit[];
type Resolution = (typeof VALID_RESOLUTIONS)[number];

interface TimeSeriesBucket {
  timestamp: string;
  value: number;
  label: string;
}

function generateDeterministicValue(timestamp: DateTime): number {
  const seed = timestamp.toMillis();

  let x = Math.sin(seed * 0.0001) * 10000;
  x = x - Math.floor(x);

  const baseValue = 50 + x * 950;

  const hourOfDay = timestamp.hour;
  const dayTrend = Math.sin((hourOfDay / 24) * Math.PI * 2) * 20;

  return Math.round(baseValue + dayTrend);
}

function generateHourlyData(
  startDate: DateTime,
  endDate: DateTime
): Array<{ timestamp: DateTime; value: number }> {
  const data: Array<{ timestamp: DateTime; value: number }> = [];
  let current = startDate.startOf('hour');

  while (current <= endDate) {
    data.push({
      timestamp: current,
      value: generateDeterministicValue(current),
    });
    current = current.plus({ hours: 1 });
  }

  return data;
}

function aggregateIntoBuckets(
  hourlyData: Array<{ timestamp: DateTime; value: number }>,
  resolution: Resolution
): TimeSeriesBucket[] {
  const buckets = new Map<string, { values: number[]; timestamp: DateTime }>();

  hourlyData.forEach(({ timestamp, value }) => {
    let bucketKey: string;
    let bucketTimestamp: DateTime;

    switch (resolution) {
      case 'hour':
        bucketKey = timestamp.toFormat('yyyy-MM-dd HH:00');
        bucketTimestamp = timestamp.startOf('hour');
        break;
      case 'day':
        bucketKey = timestamp.toFormat('yyyy-MM-dd');
        bucketTimestamp = timestamp.startOf('day');
        break;
      case 'week':
        bucketKey = timestamp.toFormat("yyyy-'W'WW");
        bucketTimestamp = timestamp.startOf('week');
        break;
      case 'month':
        bucketKey = timestamp.toFormat('yyyy-MM');
        bucketTimestamp = timestamp.startOf('month');
        break;
      case 'year':
        bucketKey = timestamp.toFormat('yyyy');
        bucketTimestamp = timestamp.startOf('year');
        break;
      default:
        throw new Error(`Unsupported resolution: ${resolution}`);
    }

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { values: [], timestamp: bucketTimestamp });
    }

    buckets.get(bucketKey)!.values.push(value);
  });

  return Array.from(buckets.entries())
    .map(([key, bucket]) => ({
      timestamp: bucket.timestamp.toISO()!,
      value: Math.round(
        bucket.values.reduce((sum, val) => sum + val, 0) / bucket.values.length
      ),
      label: key,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function validateAndParseInput(searchParams: URLSearchParams) {
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const resolution = searchParams.get('resolution') as Resolution;

  if (!startDateStr || !endDateStr || !resolution) {
    throw new Error(
      'Missing required parameters: startDate, endDate, resolution'
    );
  }

  const startDate = DateTime.fromISO(startDateStr);
  const endDate = DateTime.fromISO(endDateStr);

  if (!startDate.isValid) {
    throw new Error(`Invalid startDate: ${startDateStr}`);
  }

  if (!endDate.isValid) {
    throw new Error(`Invalid endDate: ${endDateStr}`);
  }

  if (startDate >= endDate) {
    throw new Error('startDate must be before endDate');
  }

  if (!VALID_RESOLUTIONS.includes(resolution)) {
    throw new Error(
      `Invalid resolution. Must be one of: ${VALID_RESOLUTIONS.join(', ')}`
    );
  }

  return { startDate, endDate, resolution };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { startDate, endDate, resolution } =
      validateAndParseInput(searchParams);

    const hourlyData = generateHourlyData(startDate, endDate);

    const buckets = aggregateIntoBuckets(hourlyData, resolution);

    return NextResponse.json({
      success: true,
      data: {
        buckets,
        metadata: {
          startDate: startDate.toISO(),
          endDate: endDate.toISO(),
          resolution,
          totalBuckets: buckets.length,
          totalHourlyPoints: hourlyData.length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 400 }
    );
  }
}
