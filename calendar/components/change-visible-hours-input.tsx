"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Button } from "@/components/ui/button";
import { TimeInput } from "@/components/ui/time-input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import type { TimeValue } from "react-aria-components";

export function ChangeVisibleHoursInput() {
  const { visibleHours, setVisibleHours } = useCalendar();

  const [from, setFrom] = useState<string>(visibleHours.from.toString());
  const [to, setTo] = useState<string>(visibleHours.to.toString());

  const handleApply = () => {
    setVisibleHours({ from: parseInt(from), to: parseInt(to) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">Change visible hours</p>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3" />
            </TooltipTrigger>

            <TooltipContent className="max-w-80 text-center">
              <p>
                If an event falls outside the specified visible hours, the
                visible hours will automatically adjust to include that event.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-4">
        <p>From</p>
        <TimeInput
          id="start-time"
          hourCycle={12}
          granularity="hour"
          value={from as unknown as TimeValue}
          onChange={setFrom as unknown as (value: TimeValue | null) => void}
        />
        <p>To</p>
        <TimeInput
          id="end-time"
          hourCycle={12}
          granularity="hour"
          value={to as unknown as TimeValue}
          onChange={setTo as unknown as (value: TimeValue | null) => void}
        />
      </div>

      <Button className="mt-4 w-fit" onClick={handleApply}>
        Guardar alterações
      </Button>
    </div>
  );
}
