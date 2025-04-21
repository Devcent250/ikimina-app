import AsyncSelectField from "../ui/AsyncSelectField";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Label } from "../ui/label";
export default function AppFormAsyncSelect({ form, name, label, ...other }) {
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
            <AsyncSelectField
              defaultOptions={other?.defaultOptions || true}
              error={fieldState?.error?.message}
              onChange={(e) => {
                if (
                  typeof e?.value === "string" ||
                  typeof e?.value === "number"
                )
                  return form.setValue(name, e.value);

                form.setValue(
                  name,
                  e.map((e) => e.value)
                );
                // field.onChange(e?.value);
              }}
              value={field.value}
              name={name}
              {...other}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
