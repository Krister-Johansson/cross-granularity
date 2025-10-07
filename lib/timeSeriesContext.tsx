'use client';

import { DateTime, DateTimeUnit } from 'luxon';
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  presetConfig,
  DEFAULT_PRESET,
  getAvailableResolutions,
  getDefaultResolution,
} from './presets';

interface TimeSeriesState {
  startDate: string;
  endDate: string;
  resolution: DateTimeUnit;
  selectedPreset: string | null;
  endAnchor: string;
  from?: string;
  to?: string;
}

interface TimeSeriesContextType {
  state: TimeSeriesState;
  setParams: (params: Partial<TimeSeriesState>) => void;
  availableResolutions: DateTimeUnit[];
  timezone: string;
  computeRangeFromPreset: (
    presetKey: string,
    endAnchor: string,
    resolution: DateTimeUnit,
    tz: string
  ) => { startDate: string; endDate: string };
  computeRangeFromCustom: (
    fromISO: string,
    toISO: string,
    resolution: DateTimeUnit,
    tz: string
  ) => { startDate: string; endDate: string };
}

const TimeSeriesContext = createContext<TimeSeriesContextType | undefined>(
  undefined
);

export function useTimeSeriesContext() {
  const context = useContext(TimeSeriesContext);
  if (context === undefined) {
    throw new Error(
      'useTimeSeriesContext must be used within a TimeSeriesProvider'
    );
  }
  return context;
}

interface TimeSeriesProviderProps {
  children: ReactNode;
}

export function TimeSeriesProvider({ children }: TimeSeriesProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timezone = DateTime.now().zoneName;

  const initialState = useMemo(() => {
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const resolution =
      (searchParams.get('resolution') as DateTimeUnit) ||
      getDefaultResolution(DEFAULT_PRESET);
    const endAnchor = searchParams.get('endAnchor') || DateTime.now().toISO()!;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    let selectedPreset: string | null = null;

    const urlPreset = searchParams.get('preset');
    if (urlPreset && (urlPreset === 'custom' || presetConfig[urlPreset])) {
      selectedPreset = urlPreset;
    } else if (startDate && endDate) {
      const currentStart = DateTime.fromISO(startDate);
      const currentEnd = DateTime.fromISO(endDate);
      const currentDuration = currentEnd.diff(currentStart);

      for (const [key, preset] of Object.entries(presetConfig)) {
        const presetDates = preset.getPreset();
        const presetStart = DateTime.fromISO(presetDates.startDate);
        const presetEnd = DateTime.fromISO(presetDates.endDate);
        const presetDuration = presetEnd.diff(presetStart);

        const durationDiff = Math.abs(
          currentDuration.as('hours') - presetDuration.as('hours')
        );

        if (durationDiff < 1) {
          selectedPreset = key;
          break;
        }
      }
    }

    return {
      startDate,
      endDate,
      resolution,
      selectedPreset,
      endAnchor,
      from,
      to,
    };
  }, [searchParams]);

  const updateUrlParams = useCallback(
    (newState: Partial<TimeSeriesState>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newState.startDate !== undefined) {
        params.set('startDate', newState.startDate);
      }
      if (newState.endDate !== undefined) {
        params.set('endDate', newState.endDate);
      }
      if (newState.resolution !== undefined) {
        params.set('resolution', newState.resolution);
      }
      if (newState.selectedPreset !== undefined) {
        if (newState.selectedPreset) {
          params.set('preset', newState.selectedPreset);
        } else {
          params.delete('preset');
        }
      }
      if (newState.endAnchor !== undefined) {
        params.set('endAnchor', newState.endAnchor);
      }
      if (newState.from !== undefined) {
        params.set('from', newState.from);
      }
      if (newState.to !== undefined) {
        params.set('to', newState.to);
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setParams = useCallback(
    (params: Partial<TimeSeriesState>) => {
      updateUrlParams(params);
    },
    [updateUrlParams]
  );

  const computeRangeFromPreset = useCallback(
    (
      presetKey: string,
      endAnchorISO: string,
      resolution: DateTimeUnit,
      tz: string
    ) => {
      const preset = presetConfig[presetKey];
      if (!preset) throw new Error(`Unknown preset: ${presetKey}`);

      const anchor = DateTime.fromISO(endAnchorISO, { zone: tz });
      const duration = preset.duration;

      const semanticEnd = anchor;
      const semanticStart = anchor.minus(duration);

      if (preset.duration.weeks && resolution === 'day') {
        const days = 7 * (preset.duration.weeks as number);
        const endBucketStart = semanticEnd.startOf('day');
        const start = endBucketStart.minus({ days: days - 1 }).startOf('day');
        const end = endBucketStart.endOf('day');
        return { startDate: start.toISO()!, endDate: end.toISO()! };
      }

      const snappedStart = semanticStart.startOf(resolution);
      const snappedEnd = semanticEnd.endOf(resolution);

      return {
        startDate: snappedStart.toISO()!,
        endDate: snappedEnd.toISO()!,
      };
    },
    []
  );

  const computeRangeFromCustom = useCallback(
    (fromISO: string, toISO: string, resolution: DateTimeUnit, tz: string) => {
      const from = DateTime.fromISO(fromISO, { zone: tz });
      const to = DateTime.fromISO(toISO, { zone: tz });
      const startDate = from.startOf(resolution).toISO()!;
      const endDate = to.endOf(resolution).toISO()!;
      return { startDate, endDate };
    },
    []
  );

  const availableResolutions = useMemo(() => {
    if (initialState.selectedPreset) {
      return getAvailableResolutions(initialState.selectedPreset);
    }
    return ['hour', 'day', 'week', 'month', 'year'] as DateTimeUnit[];
  }, [initialState.selectedPreset]);

  const contextValue: TimeSeriesContextType = {
    state: initialState,
    setParams,
    availableResolutions,
    timezone,
    computeRangeFromPreset,
    computeRangeFromCustom,
  };

  useEffect(() => {
    if (!initialState.startDate || !initialState.endDate) {
      const preset = presetConfig[DEFAULT_PRESET];
      const { startDate, endDate } = preset.getPreset();
      updateUrlParams({
        startDate,
        endDate,
        resolution: getDefaultResolution(DEFAULT_PRESET),
        selectedPreset: DEFAULT_PRESET,
        endAnchor: DateTime.now().toISO()!,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TimeSeriesContext.Provider value={contextValue}>
      {children}
    </TimeSeriesContext.Provider>
  );
}
