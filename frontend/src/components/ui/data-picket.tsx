import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  error?: any;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, error }) => {
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              `w-full h-11 justify-start text-left font-normal ${
                !value && "text-muted-foreground"
              }`,
              {
                "border-destructive/80 focus-visible:border-destructive/80 focus-visible:ring-destructive/30":
                  error,
              }
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>Pick join date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-white border p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
};

export default DatePicker;
