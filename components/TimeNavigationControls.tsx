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
import { ButtonGroup } from '@/components/ui/button-group';

export default function TimeNavigationControls() {
  const {
    state,
    setParams,
    availableResolutions,
    computeRangeFromPreset,
    computeRangeFromCustom,
    timezone,
  } = useTimeSeriesContext();
  const { resolution, selectedPreset, endAnchor, from, to } = state;

  const stepCustomWindow = (direction: 'minus' | 'plus') => {
    if (!from || !to) return;

    const tz = timezone;
    const fromDT = DateTime.fromISO(from, { zone: tz });
    const toDT = DateTime.fromISO(to, { zone: tz });
    const span = toDT.diff(fromDT);

    const shift = direction === 'plus' ? span : span.negate();

    const nextFrom = fromDT.plus(shift).toISO()!;
    const nextTo = toDT.plus(shift).toISO()!;
    const nextEndAnchor = nextTo;

    const { startDate, endDate } = computeRangeFromCustom(
      nextFrom,
      nextTo,
      resolution,
      tz
    );

    setParams({
      from: nextFrom,
      to: nextTo,
      endAnchor: nextEndAnchor,
      startDate,
      endDate,
    });
  };

  const stepPresetWindow = (direction: 'minus' | 'plus') => {
    if (!selectedPreset) return;
    const dur = presetConfig[selectedPreset].duration;
    const anchor = DateTime.fromISO(endAnchor, { zone: timezone });
    const nextEndAnchor = (
      direction === 'plus' ? anchor.plus(dur) : anchor.minus(dur)
    ).toISO()!;
    const { startDate, endDate } = computeRangeFromPreset(
      selectedPreset,
      nextEndAnchor,
      resolution,
      timezone
    );
    setParams({ endAnchor: nextEndAnchor, startDate, endDate });
  };

  const handlePrev = () => {
    if (selectedPreset === 'custom') stepCustomWindow('minus');
    else stepPresetWindow('minus');
  };

  const handleNext = () => {
    if (selectedPreset === 'custom') stepCustomWindow('plus');
    else stepPresetWindow('plus');
  };

  const handleToday = () => {
    const nowISO = DateTime.now().setZone(timezone).toISO()!;

    if (selectedPreset === 'custom' && from && to) {
      const span = DateTime.fromISO(to).diff(DateTime.fromISO(from));
      const newTo = DateTime.fromISO(nowISO).toISO()!;
      const newFrom = DateTime.fromISO(nowISO).minus(span).toISO()!;
      const { startDate, endDate } = computeRangeFromCustom(
        newFrom,
        newTo,
        resolution,
        timezone
      );
      setParams({
        selectedPreset: 'custom',
        from: newFrom,
        to: newTo,
        endAnchor: newTo,
        startDate,
        endDate,
      });
      return;
    }

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
    if (selectedPreset === 'custom' && from && to) {
      const { startDate, endDate } = computeRangeFromCustom(
        from,
        to,
        newResolution,
        timezone
      );
      setParams({ startDate, endDate, resolution: newResolution });
    } else if (selectedPreset) {
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
        <ButtonGroup>
          <Button
            variant="outline"
            onClick={handlePrev}
            className="h-8 w-8 p-0"
          >
            ←
          </Button>
          <Button variant="outline" onClick={handleToday} className="h-8 px-3">
            Today
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            className="h-8 w-8 p-0"
          >
            →
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
