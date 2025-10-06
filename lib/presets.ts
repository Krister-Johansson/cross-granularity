import { DateTime, DateTimeUnit, DurationLikeObject } from 'luxon';

export interface PresetConfig {
  allowedResolutions: DateTimeUnit[];
  defaultResolution: DateTimeUnit;
  duration: DurationLikeObject;
  getPreset: () => { startDate: string; endDate: string };
  label: string;
  description: string;
}

export const presetConfig: Record<string, PresetConfig> = {
  '1w': {
    label: '1 Week',
    description: '2 days past, 5 days future',
    defaultResolution: 'day',
    allowedResolutions: ['day', 'hour'],
    duration: {
      weeks: 1,
    },
    getPreset: function () {
      const now = DateTime.now();
      const start = now.minus({ day: 2 });
      const end = now.plus({ day: 5 });
      return {
        startDate: start.toISO()!,
        endDate: end.toISO()!,
      };
    },
  },
  '1m': {
    label: '1 Month',
    description: '6 days past, 24 days future',
    defaultResolution: 'day',
    allowedResolutions: ['day', 'week', 'hour'],
    duration: {
      months: 1,
    },
    getPreset: () => {
      const now = DateTime.now();
      const start = now.minus({ day: 6 });
      const end = now.plus({ day: 24 });
      return {
        startDate: start.toISO()!,
        endDate: end.toISO()!,
      };
    },
  },
  '3m': {
    label: '3 Months',
    description: '18 days past, 72 days future',
    defaultResolution: 'week',
    allowedResolutions: ['week', 'day', 'month'],
    duration: {
      months: 3,
    },
    getPreset: () => {
      const now = DateTime.now();
      const start = now.minus({ week: 2 });
      const end = now.plus({ week: 10 });
      return {
        startDate: start.toISO()!,
        endDate: end.toISO()!,
      };
    },
  },
  '6m': {
    label: '6 Months',
    description: '36 days past, 144 days future',
    defaultResolution: 'month',
    allowedResolutions: ['week', 'month', 'day'],
    duration: {
      months: 6,
    },
    getPreset: () => {
      const now = DateTime.now();
      const start = now.minus({ month: 2 });
      const end = now.plus({ month: 4 });
      return {
        startDate: start.toISO()!,
        endDate: end.toISO()!,
      };
    },
  },
  '1y': {
    label: '1 Year',
    description: '73 days past, 292 days future',
    defaultResolution: 'month',
    allowedResolutions: ['month', 'week', 'day'],
    duration: {
      months: 12,
    },
    getPreset: () => {
      const now = DateTime.now();
      const start = now.minus({ month: 2 });
      const end = now.plus({ month: 10 });
      return {
        startDate: start.toISO()!,
        endDate: end.toISO()!,
      };
    },
  },
};

export const allResolutions: DateTimeUnit[] = [
  'hour',
  'day',
  'week',
  'month',
  'year',
];

export const DEFAULT_PRESET = '1w';

export function getAvailableResolutions(presetKey: string): DateTimeUnit[] {
  return presetConfig[presetKey]?.allowedResolutions || allResolutions;
}

export function getDefaultResolution(presetKey: string): DateTimeUnit {
  return presetConfig[presetKey]?.defaultResolution || 'day';
}
