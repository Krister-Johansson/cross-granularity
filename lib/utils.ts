import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DateTime, DateTimeUnit } from 'luxon';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestampForDisplay(
  timestamp: DateTime,
  resolution: DateTimeUnit
): string {
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
}
