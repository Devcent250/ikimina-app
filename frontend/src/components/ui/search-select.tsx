import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "./button";

export default function SearchSelect({
  value,
  setValue,
  options,
  placeholder,
  error = "",
  disabled = false,
}) {
  const [open, setOpen] = useState<boolean>(false);

  const id = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
            {
              "!border-red-500": error,
            }
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search here..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {(options || []).map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    setValue(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {value === option.value && (
                    <CheckIcon size={16} className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
