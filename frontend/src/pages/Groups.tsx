import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import DataTable from "@/components/datatable/Datatable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useModalState from "@/hooks/useModalState";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import * as z from "zod";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchSelect from "@/components/ui/search-select";
import { Badge } from "@/components/ui/badge";
import { FormDescription } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth.context";

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    districtId: z.number().optional(),
    branchId: z.number().optional(),
    presidentId: z.number().optional(),
    accountantId: z.number().optional(),
    secretaryId: z.number().optional(),
    meetingFrequency: z
      .enum(["Weekly", "Bi-weekly", "Monthly", "Quarterly"])
      .default("Monthly"),
    meetingDay: z.enum([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]),
    meetingStartTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    meetingEndTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    meetingLocation: z.string().min(1, "Meeting location is required"),
    meetingLocationDetails: z.string().optional(),
    isActive: z.boolean().default(true),
    pricePerShare: z.number().positive(),
    minShares: z.number().min(0),
    maxShares: z.number().min(1),
    solidarityAmount: z.number().min(0),
    additionalNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(`2000-01-01T${data.meetingStartTime}`);
      const end = new Date(`2000-01-01T${data.meetingEndTime}`);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["meetingEndTime"],
    }
  );

function GroupForm({ isOpen, setIsOpen, refetch, record }) {
  const [selectedDistrict, setSelectedDistrict] = useState(record?.branch?.districtId || null);
  const [districtBranches, setDistrictBranches] = useState([]);

  // Fetch districts
  const districtsQuery = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data } = await api.get("/districts");
      return data.results;
    },
  });

  // Fetch all branches
  const allBranchesQuery = useQuery({
    queryKey: ["all-branches"],
    queryFn: async () => {
      const { data } = await api.get("/branches");
      return data.results;
    },
  });

  // Fetch branches for selected district
  const districtBranchesQuery = useQuery({
    queryKey: ["district-branches", selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const { data } = await api.get(`/districts/${selectedDistrict}`);
      return data.branches || [];
    },
    enabled: !!selectedDistrict,
  });

  // Update branches when district changes
  useEffect(() => {
    if (selectedDistrict) {
      if (districtBranchesQuery.data) {
        setDistrictBranches(districtBranchesQuery.data);
      }
    } else {
      setDistrictBranches(allBranchesQuery.data || []);
    }
  }, [selectedDistrict, districtBranchesQuery.data, allBranchesQuery.data]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
        ...record,
        districtId: record.branch?.districtId,
        branchId: record.branch?.id,
        presidentId: record.president?.id,
        accountantId: record.accountant?.id,
        secretaryId: record.secretary?.id,
        pricePerShare: Number(record.pricePerShare),
        minShares: Number(record.minShares),
        maxShares: Number(record.maxShares),
        solidarityAmount: Number(record.solidarityAmount),
      }
      : {
        name: "",
        description: "",
        districtId: undefined,
        branchId: undefined,
        presidentId: undefined,
        accountantId: undefined,
        secretaryId: undefined,
        meetingFrequency: "Monthly",
        meetingDay: undefined,
        meetingStartTime: "",
        meetingEndTime: "",
        meetingLocation: "",
        meetingLocationDetails: "",
        isActive: true,
        pricePerShare: 0,
        minShares: 0,
        maxShares: 1,
        solidarityAmount: 0,
        additionalNotes: "",
      },
  });

  // Debug form values
  useEffect(() => {
    if (record) {
      console.log('Form values after initialization:', form.getValues());
      console.log('District ID in form:', form.getValues('districtId'));
      console.log('Branch ID in form:', form.getValues('branchId'));
    }
  }, [record, form]);

  // Calculate duration when times change
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  // Add state for leader credentials
  const [presidentEmail, setPresidentEmail] = useState("");
  const [presidentPassword, setPresidentPassword] = useState("");
  const [accountantEmail, setAccountantEmail] = useState("");
  const [accountantPassword, setAccountantPassword] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [secretaryPassword, setSecretaryPassword] = useState("");

  // Initialize credential fields when record changes
  useEffect(() => {
    if (record) {
      console.log('Record data:', record);
      console.log('Branch data:', record.branch);
      console.log('District ID:', record.branch?.districtId);
      console.log('Branch ID:', record.branch?.id);

      setPresidentEmail(record.president?.email || "");
      setAccountantEmail(record.accountant?.email || "");
      setSecretaryEmail(record.secretary?.email || "");
      setSelectedDistrict(record.branch?.districtId || null);
    } else {
      setPresidentEmail("");
      setAccountantEmail("");
      setSecretaryEmail("");
      setSelectedDistrict(null);
    }
  }, [record]);

  // Add state for error feedback
  const [leaderCredentialError, setLeaderCredentialError] = useState("");

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLeaderCredentialError("");

    // Check for duplicate leader assignments
    const leaderIds = [
      values.presidentId,
      values.accountantId,
      values.secretaryId
    ].filter(id => id !== undefined && id !== null);

    const uniqueLeaderIds = new Set(leaderIds);

    if (leaderIds.length !== uniqueLeaderIds.size) {
      setLeaderCredentialError("A person cannot be assigned to multiple leader roles in the same group.");
      toast.error("A person cannot be assigned to multiple leader roles in the same group.");
      return;
    }

    // Always require credentials when a leader is selected
    if (
      (selectedPresident && (!presidentEmail || !presidentPassword)) ||
      (selectedAccountant && (!accountantEmail || !accountantPassword)) ||
      (selectedSecretary && (!secretaryEmail || !secretaryPassword))
    ) {
      setLeaderCredentialError("Email and password are required for all selected leaders.");
      toast.error("Email and password are required for all selected leaders.");
      return;
    }

    const duration = calculateDuration(
      values.meetingStartTime,
      values.meetingEndTime
    );
    const payload = {
      ...values,
      meetingDurationMinutes: duration,
      presidentEmail: selectedPresident ? presidentEmail : undefined,
      presidentPassword: selectedPresident ? presidentPassword : undefined,
      accountantEmail: selectedAccountant ? accountantEmail : undefined,
      accountantPassword: selectedAccountant ? accountantPassword : undefined,
      secretaryEmail: selectedSecretary ? secretaryEmail : undefined,
      secretaryPassword: selectedSecretary ? secretaryPassword : undefined,
    };

    console.log('Payload being sent:', payload);
    console.log('Selected President:', selectedPresident);
    console.log('President Email:', presidentEmail);
    console.log('President Password:', presidentPassword);

    const q = record
      ? api.patch(`/groups/${record.id}`, payload)
      : api.post("/groups", payload);

    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Group updated successfully" : "Group created successfully"
        );
        setIsOpen(false);
        form.reset();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || e.message);
        const errors = e?.response?.data?.meta?.errors || {};
        Object.keys(errors)?.forEach((field: any) => {
          form.setError(field, {
            message: errors[field],
          });
        });
      });
  }

  const { data: members } = useQuery(["members"], async () => {
    const { data } = await api.get("/members");
    return data.results;
  });

  // Find selected leaders
  const selectedPresident = members?.find(m => m.id === form.watch("presidentId"));
  const selectedAccountant = members?.find(m => m.id === form.watch("accountantId"));
  const selectedSecretary = members?.find(m => m.id === form.watch("secretaryId"));

  return (
    <Sheet open= { isOpen } onOpenChange = { setIsOpen } >
      <SheetContent className="w-full flex flex-col !gap-0 sm:max-w-2xl p-0 md:max-w-3xl lg:max-w-2xl overflow-y-auto" >
        <SheetHeader className="border-b px-4 py-2.5" >
          <SheetTitle className="text-[15px]" >
            { record? "Update Group": "Add New Group" }
            </SheetTitle>
            </SheetHeader>
            < ScrollArea className = "h-full" >
              <Form { ...form } >
              <form
              onSubmit={ form.handleSubmit(onSubmit) }
  className = "space-y-8 py-3 px-4"
    >
    <div className="space-y-4" >
      <h3 className="text-sm font-medium text-gray-500" >
        Basic Information
          </h3>
          < div className = "grid grid-cols-2 gap-4" >
            <FormField
                    control={ form.control }
  name = "name"
  render = {({ field, fieldState }) => (
    <FormItem className= "col-span-2" >
    <FormLabel>Group Name </FormLabel>
      < FormControl >
      <Input
                            placeholder="Enter group name"
  error = { fieldState?.error?.message }
  {...field }
                          />
    </FormControl>
    </FormItem>
                    )
}
                  />

  < FormField
control = { form.control }
name = "districtId"
render = {({ field }) => (
  <FormItem>
  <FormLabel>District </FormLabel>
  < Select
                          onValueChange = {(value) => {
  field.onChange(
    value === "all" ? undefined : Number(value)
  );
  setSelectedDistrict(
    value === "all" ? null : Number(value)
  );
  form.setValue("branchId", undefined);
}}
value = { field.value ? field.value.toString() : "all" }
  >
  <FormControl>
  <SelectTrigger>
  <SelectValue placeholder="Select district" />
    </SelectTrigger>
    </FormControl>
    < SelectContent >
    <SelectItem value="all" > All Districts </SelectItem>
{
  districtsQuery.data?.map((district) => (
    <SelectItem
                                key= { district.id }
                                value = { district.id.toString() }
    >
    { district.name }
    </SelectItem>
  ))
}
</SelectContent>
  </Select>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "branchId"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Zone </FormLabel>
  < Select
                          onValueChange = {(value) =>
field.onChange(Number(value))
                          }
value = { field.value?.toString() }
disabled = { districtBranchesQuery.isLoading }
  >
  <FormControl>
  <SelectTrigger>
  <SelectValue
                                placeholder={
  districtBranchesQuery.isLoading
    ? "Loading zones..."
    : "Select zone"
}
                              />
  </SelectTrigger>
  </FormControl>
  <SelectContent>
{
  districtBranches.length === 0 ? (
    <div className= "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-muted-foreground" >
    {
      selectedDistrict
      ? "No branches found in this district"
        : "No branches available"
    }
    </div>
                            ) : (
    districtBranches.map((branch) => (
      <SelectItem
                                  key= { branch.id }
                                  value = { branch.id.toString() }
      >
      { branch.name }
      </SelectItem>
    ))
                            )
}
</SelectContent>
  </Select>
  </FormItem>
                    )}
                  />
  </div>

  < h3 className = "text-sm font-medium text-gray-500" >
    Group Officers
      </h3>
      < div className = "grid grid-cols-2 gap-4" >
        <FormField
                    control={ form.control }
name = "presidentId"
render = {({ field, fieldState }) => (
  <FormItem>
  <FormLabel>President </FormLabel>
  < FormControl >
  <SearchSelect
                            error= { fieldState?.error?.message }
options = {
  members?.map((e: any) => ({
    label: e.fullNames,
    value: e.id,
  })) || []
                            }
value = { field.value }
setValue = {(value: number) => field.onChange(value)}
placeholder = "Select president"
  />
  </FormControl>
  < FormMessage />
  </FormItem>
                    )}
                  />

{
  selectedPresident && (
    <div className="col-span-2" >
      <FormLabel>President Email </FormLabel>
        < Input
  type = "email"
  value = { presidentEmail }
  onChange = { e => setPresidentEmail(e.target.value) }
  placeholder = "Enter email for president"
  required
    />
    <FormLabel>President Password </FormLabel>
      < Input
  type = "password"
  value = { presidentPassword }
  onChange = { e => setPresidentPassword(e.target.value) }
  placeholder = "Enter password for president"
  required
    />
    </div>
                  )
}

<FormField
                    control={ form.control }
name = "accountantId"
render = {({ field, fieldState }) => (
  <FormItem>
  <FormLabel>Accountant </FormLabel>
  < FormControl >
  <SearchSelect
                            error= { fieldState?.error?.message }
options = {
  members?.map((e: any) => ({
    label: e.fullNames,
    value: e.id,
  })) || []
                            }
value = { field.value }
setValue = {(value: number) => field.onChange(value)}
placeholder = "Select accountant"
  />
  </FormControl>
  < FormMessage />
  </FormItem>
                    )}
                  />

{
  selectedAccountant && (
    <div className="col-span-2" >
      <FormLabel>Accountant Email </FormLabel>
        < Input
  type = "email"
  value = { accountantEmail }
  onChange = { e => setAccountantEmail(e.target.value) }
  placeholder = "Enter email for accountant"
  required
    />
    <FormLabel>Accountant Password </FormLabel>
      < Input
  type = "password"
  value = { accountantPassword }
  onChange = { e => setAccountantPassword(e.target.value) }
  placeholder = "Enter password for accountant"
  required
    />
    </div>
                  )
}

<FormField
                    control={ form.control }
name = "secretaryId"
render = {({ field, fieldState }) => (
  <FormItem>
  <FormLabel>Secretary </FormLabel>
  < FormControl >
  <SearchSelect
                            error= { fieldState?.error?.message }
options = {
  members?.map((e: any) => ({
    label: e.fullNames,
    value: e.id,
  })) || []
                            }
value = { field.value }
setValue = {(value: number) => field.onChange(value)}
placeholder = "Select secretary"
  />
  </FormControl>
  < FormMessage />
  </FormItem>
                    )}
                  />

{
  selectedSecretary && (
    <div className="col-span-2" >
      <FormLabel>Secretary Email </FormLabel>
        < Input
  type = "email"
  value = { secretaryEmail }
  onChange = { e => setSecretaryEmail(e.target.value) }
  placeholder = "Enter email for secretary"
  required
    />
    <FormLabel>Secretary Password </FormLabel>
      < Input
  type = "password"
  value = { secretaryPassword }
  onChange = { e => setSecretaryPassword(e.target.value) }
  placeholder = "Enter password for secretary"
  required
    />
    </div>
                  )
}
</div>

  < h3 className = "text-sm font-medium text-gray-500" >
    Meeting Information
      </h3>
      < div className = "grid grid-cols-2 gap-4" >
        <FormField
                    control={ form.control }
name = "meetingFrequency"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Meeting Frequency </FormLabel>
    < Select
onValueChange = { field.onChange }
value = { field.value }
  >
  <FormControl>
  <SelectTrigger>
  <SelectValue placeholder="Select frequency" />
    </SelectTrigger>
    </FormControl>
    < SelectContent >
    <SelectItem value="Weekly" > Weekly </SelectItem>
      < SelectItem value = "Bi-weekly" > Bi - weekly </SelectItem>
        < SelectItem value = "Monthly" > Monthly </SelectItem>
          < SelectItem value = "Quarterly" > Quarterly </SelectItem>
            </SelectContent>
            </Select>
            </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "meetingDay"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Meeting Day </FormLabel>
    < Select
onValueChange = { field.onChange }
value = { field.value }
  >
  <FormControl>
  <SelectTrigger>
  <SelectValue placeholder="Select day" />
    </SelectTrigger>
    </FormControl>
    < SelectContent >
    <SelectItem value="Monday" > Monday </SelectItem>
      < SelectItem value = "Tuesday" > Tuesday </SelectItem>
        < SelectItem value = "Wednesday" > Wednesday </SelectItem>
          < SelectItem value = "Thursday" > Thursday </SelectItem>
            < SelectItem value = "Friday" > Friday </SelectItem>
              < SelectItem value = "Saturday" > Saturday </SelectItem>
                < SelectItem value = "Sunday" > Sunday </SelectItem>
                  </SelectContent>
                  </Select>
                  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "meetingStartTime"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Start Time </FormLabel>
    < FormControl >
    <Input type="time" {...field } />
      </FormControl>
      </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "meetingEndTime"
render = {({ field }) => (
  <FormItem>
  <FormLabel>End Time </FormLabel>
    < FormControl >
    <Input type="time" {...field } />
      </FormControl>
      </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "meetingLocation"
render = {({ field }) => (
  <FormItem className= "col-span-2" >
  <FormLabel>Meeting Location </FormLabel>
    < FormControl >
    <Input { ...field } />
    </FormControl>
    </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "meetingLocationDetails"
render = {({ field }) => (
  <FormItem className= "col-span-2" >
  <FormLabel>Location Details(Optional) </FormLabel>
    < FormControl >
    <Textarea
                            placeholder="Additional details about the meeting location..."
{...field }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />
  </div>

  < h3 className = "text-sm font-medium text-gray-500" >
    Share Information
      </h3>
      < div className = "grid grid-cols-2 gap-4" >
        <FormField
                    control={ form.control }
name = "pricePerShare"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Price Per Share </FormLabel>
    < FormControl >
    <Input
                            type="number"
min = { 0}
step = { 100}
{...field }
onChange = {(e) =>
field.onChange(Number(e.target.value))
                            }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "minShares"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Minimum Shares </FormLabel>
    < FormControl >
    <Input
                            type="number"
min = { 0}
{...field }
onChange = {(e) =>
field.onChange(Number(e.target.value))
                            }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "maxShares"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Maximum Shares </FormLabel>
    < FormControl >
    <Input
                            type="number"
min = { 1}
{...field }
onChange = {(e) =>
field.onChange(Number(e.target.value))
                            }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "solidarityAmount"
render = {({ field }) => (
  <FormItem>
  <FormLabel>Solidarity Amount </FormLabel>
    < FormControl >
    <Input
                            type="number"
min = { 0}
step = { 100}
{...field }
onChange = {(e) =>
field.onChange(Number(e.target.value))
                            }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />
  </div>

  < h3 className = "text-sm font-medium text-gray-500" >
    Additional Information
      </h3>
      < div className = "grid grid-cols-2 gap-4" >
        <FormField
                    control={ form.control }
name = "description"
render = {({ field }) => (
  <FormItem className= "col-span-2" >
  <FormLabel>Description </FormLabel>
  < FormControl >
  <Textarea
                            placeholder="Enter group description..."
{...field }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "additionalNotes"
render = {({ field }) => (
  <FormItem className= "col-span-2" >
  <FormLabel>Additional Notes </FormLabel>
    < FormControl >
    <Textarea
                            placeholder="Any additional information about the group..."
{...field }
                          />
  </FormControl>
  </FormItem>
                    )}
                  />

  < FormField
control = { form.control }
name = "isActive"
render = {({ field }) => (
  <FormItem className= "col-span-2 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4" >
  <FormControl>
  <Checkbox
                            checked={ field.value }
onCheckedChange = { field.onChange }
  />
  </FormControl>
  < div className = "space-y-1 leading-none" >
    <FormLabel>Active Group </FormLabel>
      <FormDescription>
                            Is this group currently active and accepting new
  members ?
  </FormDescription>
  </div>
  </FormItem>
                    )}
                  />
  </div>
{
  leaderCredentialError && (
    <div className="col-span-2 text-red-500 text-sm mb-2" > { leaderCredentialError } </div>
                )
}
</div>
  </form>
  </Form>
  </ScrollArea>

  < SheetFooter className = "mt-auto border-t px-3 py-2.5" >
    <Button
            type="button"
variant = "outline"
size = "sm"
onClick = {() => {
  setIsOpen(false);
  form.reset();
}}
          >
  Cancel
  </Button>
  < Button
disabled = { form.formState.disabled || form.formState.isSubmitting }
type = "submit"
size = "sm"
onClick = { form.handleSubmit(onSubmit) }
  >
{
  form.formState.isSubmitting && (
    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )
}
{ record ? "Update Group" : "Add Group" }
</Button>
  </SheetFooter>
  </SheetContent>
  </Sheet >
  );
}

export default function Groups() {
  const { user } = useAuth();
  const [recordToEdit, setRecordToEdit] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [sorting, setSorting] = useState([
    {
      id: "createdAt",
      desc: true,
    },
  ]);

  // Add separate queries for filter options
  const { data: branches = [] } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results.map((branch) => ({
      label: branch.name,
      value: branch.name,
    }));
  });
  console.log("branches===", branches)

  // Add meeting frequency options
  const meetingFrequencyOptions = [
    { label: "Weekly", value: "Weekly" },
    { label: "Bi-weekly", value: "Bi-weekly" },
    { label: "Monthly", value: "Monthly" },
    { label: "Quarterly", value: "Quarterly" },
  ];

  // Add a function to handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((f) => f.id !== "createdAt");
        return [
          ...otherFilters,
          {
            id: "createdAt",
            value: [range.from, range.to],
          },
        ];
      });
    } else {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "createdAt"));
    }
  };

  const columns: ColumnDef<any>[] = [
    ...(user?.isAdmin ? [{
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ||
    (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
cell: ({ row }) => (
  <Checkbox
          checked={row.getIsSelected()}
onCheckedChange={(value) => row.toggleSelected(!!value)}
aria-label="Select row"
className="translate-y-[2px]"
  />
      ),
enableSorting: false,
  enableHiding: false,
    }] : []),
{
  accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "ID" />
      ),
  cell: ({ row }) => {
    return (
      <div className= "flex items-center gap-3" >#{ row.getValue("id") } </div>
        );
  },
    enableSorting: true,
      enableHiding: false,
    },
{
  accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Group Name" />
      ),
  cell: ({ row }) => {
    return (
      <div className= "flex items-center gap-3" >
      <a href="#" className = "font-medium hover:underline" >
        { row.original.name }
        </a>
        </div>
        );
  },
    enableSorting: false,
      enableHiding: false,
    },
{
  accessorKey: "president",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "President" />
      ),
  cell: ({ row }) => {
    const president = row.getValue("president") as {
      fullNames?: string;
    } | null;
    return (
      <div className= "flex items-center gap-3" >
      { president?.fullNames || "Not assigned"
  }
  </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "accountant",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Accountant" />
      ),
  cell: ({ row }) => {
    const accountant = row.getValue("accountant") as {
      fullNames?: string;
    } | null;
    return (
      <div className= "flex items-center gap-3" >
      { accountant?.fullNames || "Not assigned"
  }
  </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "secretary",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Secretary" />
      ),
  cell: ({ row }) => {
    const secretary = row.getValue("secretary") as {
      fullNames?: string;
    } | null;
    return (
      <div className= "flex items-center gap-3" >
      { secretary?.fullNames || "Not assigned"
  }
  </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "pricePerShare",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Price Per Share" />
      ),
  cell: ({ row }) => {
    const value = row.getValue("pricePerShare");
    return (
      <div className= "flex items-center gap-3" >
      {(value || 0).toLocaleString()
  } FRW
    </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "solidarityAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Solidarity Amount" />
      ),
  cell: ({ row }) => {
    const value = row.getValue("solidarityAmount");
    return (
      <div className= "flex items-center gap-3" >
      {(value || 0).toLocaleString()
  } FRW
    </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "members",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Members" />
      ),
  cell: ({ row }) => {
    const value = row.getValue("members");
    return (
      <div className= "flex items-center gap-3" >
      {(value || 0).toLocaleString()
  }
  </div>
        );
},
enableSorting: false,
  enableHiding: false,
    },
{
  accessorKey: "meetingDay",
    header: "Meeting Day",
    },
{
  accessorKey: "meetingStartTime",
    header: "Start Time",
    },
{
  accessorKey: "meetingEndTime",
    header: "End Time",
    },
{
  accessorKey: "meetingDurationMinutes",
    header: "Duration",
      cell: ({ row }) => `${row.original.meetingDurationMinutes} minutes`,
    },
{
  accessorKey: "meetingLocation",
    header: "Location",
    },
{
  accessorKey: "isActive",
    header: "Status",
      cell: ({ row }) => (
        <Badge
          variant= { row.original.isActive ? "default" : "secondary" }
  className = {`${row.original.isActive
    ? "bg-green-100 text-green-600"
    : "bg-red-100 text-red-600"
    } font-light shadow-none`
}
        >
  { row.original.isActive ? "Active" : "Inactive" }
  </Badge>
      ),
    },
{
  id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column= { column } title = "Actions" />
      ),
  cell: ({ row }) => (
    <div className= "flex items-center justify-center mt-1 gap-2" >
    <DropdownMenu>
    <DropdownMenuTrigger asChild >
    <Button variant="ghost" className = "h-7 w-8 p-0" >
      <span className="sr-only" > Open menu </span>
        < MoreVertical size = { 16} />
          </Button>
          </DropdownMenuTrigger>
          < DropdownMenuContent align = "end" >
            <DropdownMenuLabel>Actions </DropdownMenuLabel>
            < DropdownMenuItem
  onClick = {() => {
    setSelectedGroup(row.original);
    setIsViewDialogOpen(true);
  }
}
              >
  View Details
    </DropdownMenuItem>
                {(user?.isAdmin || 
              row.original.president?.id === user?.id || 
              row.original.accountant?.id === user?.id || 
              row.original.secretary?.id === user?.id) && (
              <DropdownMenuItem
                onClick={() => {
                  setRecordToEdit(row?.original);
                }}
              >
                Update Group
              </DropdownMenuItem>
            )}
            {user?.isAdmin && (
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Group
              </DropdownMenuItem>
            )}
    </DropdownMenuContent>
    </DropdownMenu>
    </div>
      ),
    },
  ];

const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 15,
});

const newRecordModal = useModalState();
const confirmModal = useConfirmModal();

const recordsQuery = useQuery({
  queryKey: [
    "groups",
    {
      search: searchText,
      filter: columnFilters,
      sort: sorting,
      pageIndex,
      pageSize,
    },
  ],
  keepPreviousData: true,
  queryFn: async () => {
    console.log("Current filters:", columnFilters);

    const params = {
      page_size: pageSize,
      page: pageIndex + 1,
      ...(searchText && { search: searchText }),
      ...(columnFilters.length > 0 && {
        filters: columnFilters.map((filter) => {
          // Map the filter field to the correct relation name
          const fieldMap = {
            branchId: "branchId",
            meetingFrequency: "meetingFrequency",
            isActive: "isActive",
            createdAt: "createdAt",
          };

          // Handle date range filter differently
          if (filter.id === "createdAt" && filter.value?.length === 2) {
            const [startDate, endDate] = filter.value;
            // Set end date to end of day
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);

            return {
              field: fieldMap[filter.id],
              operator: "between",
              value: [
                new Date(startDate).toISOString(),
                endOfDay.toISOString(),
              ],
            };
          }

          // Handle branchId filter - we need to map from branch name to branchId
          if (filter.id === "branch") {
            return {
              field: "branchId",
              operator: "in",
              value: filter.value?.map((v) => {
                // Find the branch ID based on the branch name
                const branch = branches.find((b) => b.label === v);
                return branch ? branch.id : v;
              }),
            };
          }

          // Handle isActive filter
          if (filter.id === "isActive") {
            return {
              field: "isActive",
              operator: "eq",
              value: filter.value === "active",
            };
          }

          return {
            field: fieldMap[filter.id] || filter.id,
            operator: "in",
            value: filter.value?.map((v) => v?.value || v),
          };
        }),
      }),
      sortBy: sorting[0]?.id || "createdAt",
      order: sorting[0]?.desc ? "DESC" : "ASC",
    };

    console.log("Final API params:", params);

    const { data } = await api.get(`/groups`, { params });
    console.log("API Response:", data);

    return {
      items: data?.results?.map((e) => ({
        ...e,
        president: e.president,
        accountant: e.accountant,
        secretary: e.secretary,
        branch: e?.branch?.name,
        createdAt: e?.createdAt,
      })),
      totalPages: data?.totalPages,
    };
  },
});

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const handleDelete = (record) => {
  confirmModal.setIsLoading(true);
  return api
    .delete(`/groups/${record.id}`)
    .then(() => {
      recordsQuery.refetch();
      confirmModal.close();
      toast.success("Group deleted successfully");
    })
    .catch((e) => {
      confirmModal.setIsLoading(false);
      toast.error(e.message);
    });
};

// Add state for selected group and dialog
const [selectedGroup, setSelectedGroup] = useState(null);
const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

// Add query for group details
const groupDetailsQuery = useQuery(
  ["group-details", selectedGroup?.id],
  async () => {
    if (!selectedGroup?.id) return null;
    const { data } = await api.get(`/groups/${selectedGroup.id}`);
    return data.data;
  },
  {
    enabled: !!selectedGroup?.id,
  }
);

return (
  <>
  <ConfirmModal
        title= { "Are you sure you want to delete?"}
description = {`This will permanently delete the group and cannot be undone.`}
meta = { confirmModal.meta }
onConfirm = {(meta) => {
  handleDelete(meta);
}}
isLoading = { confirmModal.isLoading }
open = { confirmModal.isOpen }
onClose = {() => confirmModal.close()}
      />

  < div className = "sm:px-2 px-2" >
    <Tabs>
    <TabsList>
      <TabsTrigger value="tab1">Group Settings</TabsTrigger>
      <TabsTrigger value="tab2">Details</TabsTrigger>
      <TabsTrigger value="tab3">Program</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">
      {/* Content for Group Settings */ }
      < p > Group settings content goes here.</p>
        </TabsContent>
        <TabsContent value="tab2">
          {/* Content for Details */ }
          < p > Details content goes here.</p>
            </TabsContent>
            <TabsContent value="tab3">
              {/* Content for Program */ }
              < p > Program content goes here.</p>
                </TabsContent>
                </Tabs>

{/* Existing content */ }
<div className="flex items-center justify-between space-y-2- my-3" >
  <div className="flex items-start gap-2 flex-col" >
    <h2 className="text-[16px] font-semibold tracking-tight" >
      Groups Management
        </h2>
        </div>
        < div className = "flex items-center gap-2" >
          <Popover>
          <PopoverTrigger asChild >
          <Button
                  variant="outline"
className = {
  cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
  <CalendarIcon className="mr-2 h-4 w-4" />
  {
    dateRange?.from?(
      dateRange.to ? (
        <>
        { format(dateRange.from, "LLL dd, y") } - { " "}
                        { format(dateRange.to, "LLL dd, y") }
</>
                    ) : (
  format(dateRange.from, "LLL dd, y")
)
                  ) : (
  <span>Pick a date range </span>
                  )}
</Button>
  </PopoverTrigger>
  < PopoverContent className = "w-auto p-0" align = "start" >
    <Calendar
                  initialFocus
mode = "range"
defaultMonth = { dateRange?.from }
selected = { dateRange }
onSelect = { handleDateRangeChange }
numberOfMonths = { 2}
  />
  </PopoverContent>
  </Popover>
  {user?.isAdmin && (
    <Button
      onClick={() => {
        newRecordModal.open();
      }}
      size="sm"
    >
      <PlusCircle size={16} className="mr-2" />
      <span>Add new Group</span>
    </Button>
  )}
      </div>
      </div>

      {recordsQuery?.data?.items?.length === 0 && !recordsQuery.isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              {user?.isAdmin 
                ? "No groups found. Create your first group to get started."
                : "You don't have access to any groups. Contact your administrator for access."
              }
            </p>
            {user?.isAdmin && (
              <Button
                onClick={() => newRecordModal.open()}
                size="sm"
                className="mt-2"
              >
                <PlusCircle size={16} className="mr-2" />
                Create First Group
              </Button>
            )}
          </div>
        </div>
      ) : (
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{}}
          isLoading={recordsQuery.status === "loading"}
          data={recordsQuery?.data?.items || []}
          columns={columns}
          onSearch={(e) => {
            setSearchText(e);
          }}
          sorting={sorting}
          setSorting={setSorting}
          pageCount={recordsQuery?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
          facets={[
            {
              name: "branch",
              title: "Branch",
              type: "select",
              options: branches,
            },
            {
              name: "meetingFrequency",
              title: "Meeting Frequency",
              type: "select",
              options: meetingFrequencyOptions,
            },
            {
              name: "isActive",
              title: "Status",
              type: "select",
              options: statusOptions,
            },
          ]}
        />
      )}
  </div>

  < GroupForm
isOpen = { newRecordModal.isOpen || Boolean(recordToEdit) }
setIsOpen = {(e) => {
  newRecordModal.setisOpen(e);
  if (!e) {
    setRecordToEdit(undefined);
  }
}}
refetch = { recordsQuery.refetch }
record = { recordToEdit }
  />

  <Dialog open={ isViewDialogOpen } onOpenChange = { setIsViewDialogOpen } >
    <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] md:h-[85vh] overflow-hidden flex flex-col p-0" >
      <DialogHeader className="border-b px-6 py-4" >
        <DialogTitle className="text-xl font-semibold flex items-center gap-2" >
          <span>Group Details </span>
{
  groupDetailsQuery.data && (
    <Badge
                  variant={
    groupDetailsQuery.data?.isActive ? "default" : "secondary"
  }
  className = {`${groupDetailsQuery.data?.isActive
    ? "bg-green-100 text-green-600 "
    : "text-red-600 bg-red-100"
    } font-light shadow-none`
}
                >
  { groupDetailsQuery.data?.isActive ? "Active" : "Inactive" }
  </Badge>
              )}
</DialogTitle>
  </DialogHeader>

{
  groupDetailsQuery.isLoading ? (
    <div className= "flex items-center justify-center p-8 h-full" >
    <Loader className="h-8 w-8 animate-spin" />
      </div>
          ) : groupDetailsQuery.data ? (
    <ScrollArea className= "flex-1" >
    <div className="p-4 md:p-6" >
      {/* Header Section */ }
      < div className = "mb-6 bg-card rounded-lg border p-4" >
        <h2 className="text-xl md:text-2xl font-bold mb-2" >
          { groupDetailsQuery.data.name }
          </h2>
          < p className = "text-muted-foreground" >
            { groupDetailsQuery.data.description }
            </p>
            </div>

            < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" >
              {/* Basic Information */ }
              < div className = "bg-card rounded-lg border p-4" >
                <h3 className="text-base font-semibold mb-4 pb-2 border-b" >
                  Basic Information
                    </h3>
                    < div className = "space-y-3" >
                      <div className="flex justify-between items-center" >
                        <span className="text-sm text-muted-foreground" >
                          Zone
                          </span>
                          < span className = "font-medium" >
                            { groupDetailsQuery.data.branch?.name || "N/A" }
                            </span>
                            </div>
                            < div className="flex justify-between items-center" >
                              <span className="text-sm text-muted-foreground" >
                                District
                                </span>
                                < span className = "font-medium" >
                                {
                                  groupDetailsQuery.data.branch?.district?.name ||
                                    "N/A"
                                }
                                  </span>
                                  </div>
                                  < div className="flex justify-between items-center" >
                                    <span className="text-sm text-muted-foreground" >
                                      Created At
                                        </span>
                                        < span className = "font-medium" >
                                        {
                                          new Date(
                                            groupDetailsQuery.data.createdAt
                                          ).toLocaleDateString()
                                        }
                                          </span>
                                          </div>
                                          < div className="flex justify-between items-center" >
                                            <span className="text-sm text-muted-foreground" >
                                              Last Updated
                                                </span>
                                                < span className = "font-medium" >
                                                {
                                                  new Date(
                                                    groupDetailsQuery.data.updatedAt
                                                  ).toLocaleDateString()
                                                }
                                                  </span>
                                                  </div>
                                                  </div>
                                                  </div>

  {/* Meeting Information */ }
  <div className="bg-card rounded-lg border p-4" >
    <h3 className="text-base font-semibold mb-4 pb-2 border-b" >
      Meeting Information
        </h3>
        < div className = "space-y-3" >
          <div className="grid grid-cols-2 gap-3" >
            <div>
            <p className="text-sm text-muted-foreground" >
              Frequency
              </p>
              < p className = "font-medium" >
                { groupDetailsQuery.data.meetingFrequency }
                </p>
                </div>
                < div >
                <p className="text-sm text-muted-foreground" > Day </p>
                  < p className = "font-medium" >
                    { groupDetailsQuery.data.meetingDay }
                    </p>
                    </div>
                    </div>
                    < div className = "grid grid-cols-2 gap-3" >
                      <div>
                      <p className="text-sm text-muted-foreground" >
                        Start Time
                          </p>
                          < p className = "font-medium" >
                            { groupDetailsQuery.data.meetingStartTime }
                            </p>
                            </div>
                            < div >
                            <p className="text-sm text-muted-foreground" >
                              End Time
                                </p>
                                < p className = "font-medium" >
                                  { groupDetailsQuery.data.meetingEndTime }
                                  </p>
                                  </div>
                                  </div>
                                  < div >
                                  <p className="text-sm text-muted-foreground" >
                                    Duration
                                    </p>
                                    < p className = "font-medium" >
                                      { groupDetailsQuery.data.meetingDurationMinutes }{ " " }
  minutes
    </p>
    </div>
    < div >
    <p className="text-sm text-muted-foreground" >
      Location
      </p>
      < p className = "font-medium" >
        { groupDetailsQuery.data.meetingLocation }
        </p>
        </div>
  {
    groupDetailsQuery.data.meetingLocationDetails && (
      <div>
      <p className="text-sm text-muted-foreground" >
        Location Details
          </p>
          < p className = "text-sm" >
            { groupDetailsQuery.data.meetingLocationDetails }
            </p>
            </div>
                      )
  }
  </div>
    </div>

  {/* Financial Information */ }
  <div className="bg-card rounded-lg border p-4" >
    <h3 className="text-base font-semibold mb-4 pb-2 border-b" >
      Financial Information
        </h3>
        < div className = "space-y-3" >
          <div className="grid grid-cols-2 gap-3" >
            <div>
            <p className="text-sm text-muted-foreground" >
              Price Per Share
                </p>
                < p className = "font-medium" >
                  { groupDetailsQuery.data.pricePerShare.toLocaleString() }{ " " }
  FRW
    </p>
    </div>
    < div >
    <p className="text-sm text-muted-foreground" >
      Solidarity Amount
        </p>
        < p className = "font-medium" >
          { groupDetailsQuery.data.solidarityAmount.toLocaleString() }{ " " }
  FRW
    </p>
    </div>
    </div>
    < div className = "grid grid-cols-2 gap-3" >
      <div>
      <p className="text-sm text-muted-foreground" >
        Min Shares
          </p>
          < p className = "font-medium" >
            { groupDetailsQuery.data.minShares }
            </p>
            </div>
            < div >
            <p className="text-sm text-muted-foreground" >
              Max Shares
                </p>
                < p className = "font-medium" >
                  { groupDetailsQuery.data.maxShares }
                  </p>
                  </div>
                  </div>
  {
    groupDetailsQuery.data.additionalNotes && (
      <div>
      <p className="text-sm text-muted-foreground" >
        Additional Notes
          </p>
          < p className = "text-sm" >
            { groupDetailsQuery.data.additionalNotes }
            </p>
            </div>
                      )
  }
  </div>
    </div>

  {/* Group Officers */ }
  <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg border p-4" >
    <h3 className="text-base font-semibold mb-4 pb-2 border-b" >
      Group Officers
        </h3>
        < div className = "grid grid-cols-1 md:grid-cols-3 gap-4" >
          {/* President */ }
          < div className = "bg-accent/10 rounded-lg p-4" >
            <div className="flex items-center gap-3 mb-3" >
              <div className="bg-primary/10 rounded-full p-2" >
                <Avatar className="h-12 w-12" >
                  <AvatarFallback className="text-lg" >
                  {
                    groupDetailsQuery.data.president
                      ?.firstName?.[0]
                  }
  {
    groupDetailsQuery.data.president
      ?.lastName?.[0]
  }
  </AvatarFallback>
    </Avatar>
    </div>
    < div >
    <p className="text-sm text-muted-foreground" >
      President
      </p>
      < p className = "font-medium" >
      {
        groupDetailsQuery.data.president?.fullNames ||
          "Not assigned"
      }
        </p>
        </div>
        </div>
  {
    groupDetailsQuery.data.president && (
      <div className="space-y-2 text-sm" >
        <div className="flex items-center gap-2" >
          <span className="text-muted-foreground" >
            Phone:
    </span>
      <span>
    { groupDetailsQuery.data.president?.phone }
    </span>
      </div>
      < div className = "flex items-center gap-2" >
        <span className="text-muted-foreground" > ID: </span>
          <span>
    { groupDetailsQuery.data.president?.idNumber }
    </span>
      </div>
      </div>
                        )
  }
  </div>

  {/* Accountant */ }
  <div className="bg-accent/10 rounded-lg p-4" >
    <div className="flex items-center gap-3 mb-3" >
      <div className="bg-primary/10 rounded-full p-2" >
        <Avatar className="h-12 w-12" >
          <AvatarFallback className="text-lg" >
          {
            groupDetailsQuery.data.accountant
              ?.firstName?.[0]
          }
  {
    groupDetailsQuery.data.accountant
      ?.lastName?.[0]
  }
  </AvatarFallback>
    </Avatar>
    </div>
    < div >
    <p className="text-sm text-muted-foreground" >
      Accountant
      </p>
      < p className = "font-medium" >
      {
        groupDetailsQuery.data.accountant?.fullNames ||
          "Not assigned"
      }
        </p>
        </div>
        </div>
  {
    groupDetailsQuery.data.accountant && (
      <div className="space-y-2 text-sm" >
        <div className="flex items-center gap-2" >
          <span className="text-muted-foreground" >
            Phone:
    </span>
      <span>
    { groupDetailsQuery.data.accountant?.phone }
    </span>
      </div>
      < div className = "flex items-center gap-2" >
        <span className="text-muted-foreground" > ID: </span>
          <span>
    { groupDetailsQuery.data.accountant?.idNumber }
    </span>
      </div>
      </div>
                        )
  }
  </div>

  {/* Secretary */ }
  <div className="bg-accent/10 rounded-lg p-4" >
    <div className="flex items-center gap-3 mb-3" >
      <div className="bg-primary/10 rounded-full p-2" >
        <Avatar className="h-12 w-12" >
          <AvatarFallback className="text-lg" >
          {
            groupDetailsQuery.data.secretary
              ?.firstName?.[0]
          }
  {
    groupDetailsQuery.data.secretary
      ?.lastName?.[0]
  }
  </AvatarFallback>
    </Avatar>
    </div>
    < div >
    <p className="text-sm text-muted-foreground" >
      Secretary
      </p>
      < p className = "font-medium" >
      {
        groupDetailsQuery.data.secretary?.fullNames ||
          "Not assigned"
      }
        </p>
        </div>
        </div>
  {
    groupDetailsQuery.data.secretary && (
      <div className="space-y-2 text-sm" >
        <div className="flex items-center gap-2" >
          <span className="text-muted-foreground" >
            Phone:
    </span>
      <span>
    { groupDetailsQuery.data.secretary?.phone }
    </span>
      </div>
      < div className = "flex items-center gap-2" >
        <span className="text-muted-foreground" > ID: </span>
          <span>
    { groupDetailsQuery.data.secretary?.idNumber }
    </span>
      </div>
      </div>
                        )
  }
  </div>
    </div>
    </div>

  {/* Group Members */ }
  <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg border p-4" >
    <div className="flex items-center justify-between mb-4 pb-2 border-b" >
      <h3 className="text-base font-semibold" > Group Members </h3>
        < Badge variant = "outline" >
          { groupDetailsQuery.data.groupMembers?.length || 0 }{ " " }
  Members
    </Badge>
    </div>

  {
    groupDetailsQuery.data.groupMembers?.length > 0 ? (
      <div className= "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
      {
        groupDetailsQuery.data.groupMembers
          ?.slice(0, 6)
          .map((groupMember) => {
            // Find the member's contribution
            const memberContribution =
              groupDetailsQuery.data.contributions?.find(
                (contribution) =>
                  contribution.member.id ===
                  groupMember.member.id
              );

            // Calculate number of shares based on deposit amount
            const numberOfShares = memberContribution
              ? Math.floor(
                memberContribution.depositAmount /
                groupDetailsQuery.data.pricePerShare
              )
              : 0;

            return (
              <div
                                key= { groupMember.id }
            className = "bg-accent/5 border rounded-lg p-3"
              >
              <div className="flex items-center gap-3" >
                <Avatar className="h-9 w-9" >
                  <AvatarFallback>
                  { groupMember.member?.firstName?.[0] }
            { groupMember.member?.lastName?.[0] }
            </AvatarFallback>
              </Avatar>
              < div className = "flex-1" >
                <p className="font-medium text-sm" >
                  { groupMember.member?.fullNames }
                  </p>
                  < p className = "text-xs text-muted-foreground" >
                    { groupMember.member?.phone }
                    </p>
                    </div>
                    < div className = "flex flex-col items-center bg-primary/10 rounded-md px-2 py-1" >
                      <span className="text-xs text-muted-foreground" >
                        Shares
                        </span>
                        < span className = "font-semibold" >
                          { numberOfShares }
                          </span>
                          </div>
                          </div>
                          </div>
                            );
      })
  }
  </div>
                    ) : (
    <p className= "text-center text-muted-foreground py-4" >
    No members in this group yet
      </p>
                    )
}

{
  groupDetailsQuery.data.groupMembers?.length > 6 && (
    <div className="mt-4 text-center" >
      <Button variant="outline" size = "sm" >
        View all { groupDetailsQuery.data.groupMembers?.length } { " " }
  members
    </Button>
    </div>
                    )
}
</div>

{/* Recent Contributions */ }
{
  groupDetailsQuery.data.contributions?.length > 0 && (
    <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg border p-4" >
      <div className="flex items-center justify-between mb-4 pb-2 border-b" >
        <h3 className="text-base font-semibold" >
          Recent Contributions
            </h3>
            < Badge variant = "outline" >
              { groupDetailsQuery.data.contributions?.length } Total
                </Badge>
                </div>

                < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                {
                  groupDetailsQuery.data.contributions
                    ?.slice(0, 6)
                    .map((contribution) => (
                      <div
                              key= { contribution.id }
                              className = "bg-accent/5 border rounded-lg p-3"
                      >
                      <div className="flex justify-between items-center mb-2" >
                    <div className="flex items-center gap-2" >
                    <span className="font-medium text-sm" >
                    {
                      contribution.member?.fullNames ||
                        "Unknown Member"
                    }
                    </span>
                    </div>
                    <Badge variant = "outline" className = "text-xs" >
                    {
                      new Date(
                        contribution.createdAt
                      ).toLocaleDateString()
                    }
                    </Badge>
                    </div>
                    < div className = "grid grid-cols-2 gap-2 text-sm" >
                    <div>
                    <p className="text-xs text-muted-foreground" >
                    Deposit
                    </p>
                    < p className = "font-medium" >
                    { contribution.depositAmount.toLocaleString() }{ " "}
                                    FRW
                      </p>
                      </div>
                      < div >
                      <p className="text-xs text-muted-foreground" >
                      Solidarity
                      </p>
                    < p className = "font-medium" >
                    {(
                      contribution.solidarityAmount || 0
                    ).toLocaleString()}{ " " }
  FRW
    </p>
    </div>
    </div>
    </div>
                          ))
}
</div>

{
  groupDetailsQuery.data.contributions?.length > 6 && (
    <div className="mt-4 text-center" >
      <Button variant="outline" size = "sm" >
        View all{ " " }
  { groupDetailsQuery.data.contributions?.length } { " " }
  contributions
    </Button>
    </div>
                      )
}
</div>
                  )}
</div>
  </div>
  </ScrollArea>
          ) : (
  <div className= "p-8 text-center text-muted-foreground h-full flex items-center justify-center" >
  <div>
  <p className="mb-2" > No group details available </p>
    < Button
variant = "outline"
size = "sm"
onClick = {() => setIsViewDialogOpen(false)}
                >
  Close
  </Button>
  </div>
  </div>
          )}
</DialogContent>
  </Dialog>
  </>
  );
}