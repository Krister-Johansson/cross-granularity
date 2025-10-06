'use client';

import { Button } from '@/components/ui/button';
import { getDefaultResolution, presetConfig } from '@/lib/presets';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { DateTime } from 'luxon';

export default function PresetButtons() {
  const { state, setParams, computeRangeFromPreset, timezone } =
    useTimeSeriesContext();
  const { selectedPreset } = state;

  const handlePresetSelect = (presetKey: string) => {
    const preset = presetConfig[presetKey];
    if (preset) {
      const now = DateTime.now().setZone(timezone).toISO()!;
      const defaultResolution = getDefaultResolution(presetKey);
      const { startDate: newStartDate, endDate: newEndDate } =
        computeRangeFromPreset(presetKey, now, defaultResolution, timezone);

      setParams({
        startDate: newStartDate,
        endDate: newEndDate,
        selectedPreset: presetKey,
        resolution: defaultResolution,
        endAnchor: now,
      });
    }
  };

  return (
    <div className="flex items-center gap-6">
      {Object.entries(presetConfig).map(([key, preset]) => (
        <Button
          key={key}
          variant={selectedPreset === key ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetSelect(key)}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all ${
            selectedPreset === key
              ? 'bg-primary text-primary-foreground shadow-md border-primary'
              : 'hover:bg-muted/50'
          }`}
        >
          <span
            className={`text-sm font-medium ${
              selectedPreset === key ? 'text-primary-foreground' : ''
            }`}
          >
            {preset.label}
          </span>
          <span
            className={`text-xs ${
              selectedPreset === key
                ? 'text-primary-foreground/80'
                : 'opacity-70'
            }`}
          >
            {preset.description}
          </span>
        </Button>
      ))}
    </div>
  );
}
