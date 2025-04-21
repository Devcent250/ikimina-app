import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, Phone } from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  type InputHTMLAttributes,
} from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

const PhoneInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn(
          "-ms-px rounded-s-none w-full h-10 shadow-none focus-visible:z-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export default function PhoneNumberInput({
  value,
  onChange,
  error,
  ...other
}: any) {
  const inputComponentRender = useCallback(
    React.forwardRef((props: any, ref) => (
      <PhoneInput
        {...props}
        ref={ref}
        className={cn(props.className, {
          "!border-red-600": error,
        })}
      />
    )),
    [error] // Only recreate when error changes
  );

  return (
    <div>
      <RPNInput.default
        className={cn("flex !w-full rounded-lg shadow-none shadow-black/5")}
        international
        flagComponent={FlagComponent}
        inputComponent={inputComponentRender}
        countrySelectComponent={({ ...other }) => (
          <CountrySelect
            {...other}
            className={cn(other.className, {
              "!border-red-600": error,
            })}
          />
        )}
        placeholder="Enter phone number"
        {...other}
        value={value}
        onChange={onChange}
        error={false}
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country | undefined }[];
  className?: string;
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  className,
  options,
}: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country);
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center self-stretch rounded-s-lg border border-input bg-background py-2 pe-2 ps-3 text-muted-foreground ring-offset-background transition-shadow focus-within:z-10 focus-within:border-ring focus-within:text-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 hover:bg-accent hover:text-foreground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
        className
      )}
    >
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className="text-muted-foreground/80">
          <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className="absolute inset-0 text-sm opacity-0"
        aria-label="Select country"
      >
        <option key="default" value="">
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label}{" "}
              {option.value &&
                `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <Phone size={16} aria-hidden="true" />
      )}
    </span>
  );
};
