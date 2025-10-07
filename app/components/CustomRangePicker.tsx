'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTimeSeriesContext } from '@/lib/timeSeriesContext';

interface CustomRangePickerProps {
  className?: string;
}

export function CustomRangePicker({ className }: CustomRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, setParams, computeRangeFromCustom, timezone } =
    useTimeSeriesContext();
  const { selectedPreset } = state;

  const handleApplyCustom = (fromISO: string, toISO: string) => {
    const span = DateTime.fromISO(toISO).diff(DateTime.fromISO(fromISO));
    if (span.valueOf() <= 0) return;

    const anchor = toISO;

    const { startDate, endDate } = computeRangeFromCustom(
      fromISO,
      toISO,
      state.resolution,
      timezone
    );

    setParams({
      selectedPreset: 'custom',
      from: fromISO,
      to: toISO,
      endAnchor: anchor,
      startDate,
      endDate,
    });

    setIsOpen(false);
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      handleApplyCustom(
        DateTime.fromJSDate(date.from).toISO()!,
        DateTime.fromJSDate(date.to).toISO()!
      );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={selectedPreset === 'custom' ? 'default' : 'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {DateTime.fromJSDate(date.from).toFormat('LLL dd, y')} -{' '}
                {DateTime.fromJSDate(date.to).toFormat('LLL dd, y')}
              </>
            ) : (
              DateTime.fromJSDate(date.from).toFormat('LLL dd, y')
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
        />
        <div className="flex justify-end p-3 border-t">
          <Button onClick={handleApply} disabled={!date?.from || !date?.to}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
