'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { getDefaultResolution, presetConfig } from '@/lib/presets';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';
import { CustomRangePicker } from './CustomRangePicker';

export default function PresetButtons() {
  const { state, setParams, computeRangeFromPreset, timezone } =
    useTimeSeriesContext();
  const { selectedPreset } = state;

  const handlePresetSelect = (selectedPreset: string) => {
    const preset = presetConfig[selectedPreset];
    if (preset) {
      const resolution = getDefaultResolution(selectedPreset);
      const { endDate } = preset.getPreset();
      const endAnchor = endDate;
      const snapped = computeRangeFromPreset(
        selectedPreset,
        endAnchor,
        resolution,
        timezone
      );
      setParams({
        startDate: snapped.startDate,
        endDate: snapped.endDate,
        selectedPreset,
        resolution,
        endAnchor,
      });
    }
  };

  return (
    <div className="flex items-center gap-6">
      <ButtonGroup>
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
          </Button>
        ))}
      </ButtonGroup>
      <CustomRangePicker className="h-auto py-2 px-3" />
    </div>
  );
}
