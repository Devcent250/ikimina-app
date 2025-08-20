import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import "react-datepicker/dist/react-datepicker.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PopoutSelect from "../PopoutSelect";
import DatePickerAdvance from "../DatePicker";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  type;
  loader;
  name;
  disabled?: any;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  type,
  loader,
  name,
  disabled,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues =
    type !== "date" && new Set(column?.getFilterValue() as string[]);

  const filterValue = column.getFilterValue() as any;

  const [open, setopen] = React.useState(false);

  const handleSelect = (option, isSelected) => {
    if (isSelected) {
      selectedValues.delete(option.value);
    } else {
      selectedValues.add(option.value);
    }
    const filterValues = Array.from(selectedValues);
    column?.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  const [_, setshowDatePicker] = React.useState(false);

  const dates: any = column.getFilterValue() || {};

  const { from, to } = dates;

  return type === "input" ? (
    <div className="relative">
      <Input
        placeholder={title}
        value={(column?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          column?.setFilterValue(event.target.value)
        }
        className="h-8 w-[150px] lg:w-[250px]"
      />
    </div>
  ) : type === "date" ? (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            size="sm"
            className="!h-[30px] border-dashed"
            onClick={() => setshowDatePicker(true)}
          >
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            {title}
            {filterValue?.from ? (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="hidden- space-x-1 lg:flex">
                  <Badge
                    variant="secondary"
                    className="rounded-sm capitalize px-1 font-normal"
                  >
                    {[from, to]
                      .filter((e) => e)
                      .map((e) => e?.toLocaleDateString())
                      .join(" - ")}
                  </Badge>{" "}
                </div>
              </>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-0 shadow-md">
          <DatePickerAdvance
            date={{
              from,
              to,
            }}
            setDate={(e) => {
              column?.setFilterValue(e);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <Popover open={open} onOpenChange={setopen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="h-[30px] border-dashed"
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {filterValue ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="hidden- space-x-1 lg:flex">
                {type === "async-options" ? (
                  <>
                    {(column.getFilterValue() as any[])?.length > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {(column.getFilterValue() as any[])?.length} selected
                      </Badge>
                    ) : (
                      (column.getFilterValue() as any[]).map((option, i) => (
                        <Badge
                          variant="secondary"
                          key={i}
                          className="rounded-sm capitalize px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {selectedValues.size > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {selectedValues.size} selected
                      </Badge>
                    ) : (
                      options
                        .filter((option) => selectedValues.has(option.value))
                        .map((option, i) => (
                          <Badge
                            variant="secondary"
                            key={i}
                            className="rounded-sm capitalize px-1 font-normal"
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </>
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      {type === "async-options" ? (
        <PopoverContent className="w-auto bg-white !p-0">
          <PopoutSelect
            open={open}
            name={name}
            isMulti={true}
            value={column.getFilterValue()}
            loader={loader}
            onChange={(e) => {
              if (e.length) {
                column?.setFilterValue(e);
              } else {
                column?.setFilterValue(undefined);
              }
            }}
            setOpen={setopen}
          />
        </PopoverContent>
      ) : (
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={title} />
            <CommandList>
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options?.map((option, i) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <CommandItem
                        className="py-2"
                        key={i}
                        onSelect={() => {
                          handleSelect(option, isSelected);
                        }}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 text-slate-500 font-medium items-center justify-center rounded-md border border-slate-400",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <CheckIcon className={cn("h-3 w-3")} />
                        </div>
                        {option.icon && (
                          <option.icon className="mr-2 h-4 w-4 text-slate-500" />
                        )}
                        <span className="capitalize text-[12.5px] text-slate-500">
                          {option.label}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>

              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => column?.setFilterValue(undefined)}
                      className="justify-center text-slate-600 !dark:text-slate-300 text-[13px] font-medium text-center"
                    >
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
