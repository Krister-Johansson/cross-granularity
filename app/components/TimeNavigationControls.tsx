'use client';

import { DateTime, DateTimeUnit } from 'luxon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { presetConfig } from '@/lib/presets';

export default function TimeNavigationControls() {
  const {
    state,
    setParams,
    availableResolutions,
    computeRangeFromPreset,
    timezone,
  } = useTimeSeriesContext();
  const { resolution, selectedPreset, endAnchor } = state;

  const stepAnchorByPreset = (direction: 'minus' | 'plus') => {
    if (!selectedPreset) return;
    const dur = presetConfig[selectedPreset].duration; // calendar-aware
    const anchor = DateTime.fromISO(endAnchor, { zone: timezone });
    const next = direction === 'plus' ? anchor.plus(dur) : anchor.minus(dur);
    return next.toISO()!;
  };

  const handlePrev = () => {
    if (!selectedPreset) return;
    const nextEndAnchor = stepAnchorByPreset('minus')!;
    const { startDate, endDate } = computeRangeFromPreset(
      selectedPreset,
      nextEndAnchor,
      resolution,
      timezone
    );
    setParams({ startDate, endDate, endAnchor: nextEndAnchor });
  };

  const handleNext = () => {
    if (!selectedPreset) return;
    const nextEndAnchor = stepAnchorByPreset('plus')!;
    const { startDate, endDate } = computeRangeFromPreset(
      selectedPreset,
      nextEndAnchor,
      resolution,
      timezone
    );
    setParams({ startDate, endDate, endAnchor: nextEndAnchor });
  };

  const handleToday = () => {
    const nowISO = DateTime.now().setZone(timezone).toISO()!;
    const presetKey = selectedPreset ?? '1w';
    const { startDate, endDate } = computeRangeFromPreset(
      presetKey,
      nowISO,
      resolution,
      timezone
    );
    setParams({
      startDate,
      endDate,
      endAnchor: nowISO,
      ...(selectedPreset ? {} : { selectedPreset: presetKey }),
    });
  };

  const handleResolutionChange = (newResolution: DateTimeUnit) => {
    if (selectedPreset) {
      const { startDate, endDate } = computeRangeFromPreset(
        selectedPreset,
        endAnchor,
        newResolution,
        timezone
      );
      setParams({ startDate, endDate, resolution: newResolution });
    } else {
      setParams({ resolution: newResolution });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Select value={resolution} onValueChange={handleResolutionChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableResolutions.map(res => (
              <SelectItem key={res} value={res}>
                {res.charAt(0).toUpperCase() + res.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          className="h-8 w-8 p-0"
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="h-8 px-3"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-8 w-8 p-0"
        >
          →
        </Button>
      </div>
    </div>
  );
}
