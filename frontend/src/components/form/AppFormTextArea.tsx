import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";

export default function AppFormTextArea({
  form,
  name,
  label,
  placeholder,
  disabled,
  ...other
}: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>
            <Label className="text-[13px] mb-1 text-slate-600" htmlFor={label}>
              {label}
            </Label>
          </FormLabel>
          <FormControl>
            <Textarea
              disabled={disabled}
              className={cn("leading-8", {
                "!border-red-500": fieldState.error,
              })}
              placeholder={placeholder}
              {...field}
              {...other}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
