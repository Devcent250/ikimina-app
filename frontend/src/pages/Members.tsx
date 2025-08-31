import { useEffect, useState } from "react";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import DataTable from "@/components/datatable/Datatable";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import MultiSelect from "@/components/ui/common/MultiSelect";
import { useAuth } from "@/context/auth.context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, canPerformAdminActions } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as z from "zod";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  fullNames: z.string().min(2, "Full names must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional(),
  marriageStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  idNumber: z.string().min(1, "ID number is required"),
  country: z.string().min(1, "Country is required").optional(),
  currentAddress: z
    .string()
    .min(2, "Address must be at least 2 characters")
    .optional(),
  joinedAt: z.string().min(1, "Join date is required"),
  sourceOfIncome: z.enum([
    "Employment",
    "Business",
    "Farming",
    "Freelance",
    "Other",
  ]),
  districtId: z.string().min(1, "District is required"),
  groupIds: z.array(z.string()).optional(),
  branchId: z.string().min(1, "Branch is required"),
  memberCode: z.string().length(4, "Member code must be exactly 4 digits").regex(/^\d{4}$/, "Member code must be 4 digits"),
  role: z.enum(["President", "Secretary", "Accountant", "Member"], {
    required_error: "Role is required",
  }),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

function MemberForm({ isOpen, setIsOpen, refetch, record }) {
  // Track if leader role is already taken in selected group(s)
  const [roleConflict, setRoleConflict] = useState<string | null>(null);
  const { user } = useAuth();
  const canPerformActions = canPerformAdminActions(user);

  // Extract group IDs helper function
  const extractGroupIds = (record) => {
    if (
      !record ||
      !record.groupMemberships ||
      !Array.isArray(record.groupMemberships)
    ) {
      return [];
    }
    return record.groupMemberships
      .map(
        (membership) =>
          membership.group?.id?.toString() || membership.groupId?.toString()
      )
      .filter(Boolean);
  };

  // Query for the user's group if not admin
  const { data: userGroup, refetch: refetchUserGroup } = useQuery(
    ["user-group"],
    async () => {
      const response = await api.get("/groups/my-group");
      return response.data;
    },
    {
      enabled: !canPerformActions,
      staleTime: 0,
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
        ...record,
        districtId: record?.branch?.district?.id?.toString() || "",
        branchId: record?.branch?.id?.toString() || "",
        groupIds: extractGroupIds(record),
        memberCode: record?.memberCode || "",
      }
      : {
        firstName: "",
        lastName: "",
        fullNames: "",
        gender: "",
        phone: "",
        marriageStatus: "",
        idNumber: "",
        country: "",
        currentAddress: "",
        joinedAt: "",
        sourceOfIncome: "",
        groupIds: [],
        districtId: "",
        branchId: "",
        memberCode: "",
        role: undefined,
      },
  });

  // Fetch districts
  const { data: districts } = useQuery(
    ["districts"],
    async () => {
      const { data } = await api.get("/districts");
      return data.results;
    },
    {
      staleTime: 60000, // 1 minute
    }
  );

  // Fetch branches based on selected district
  const { data: districtWithBranches, refetch: refetchBranches } = useQuery(
    ["district-branches", form.watch("districtId")],
    async () => {
      const { data } = await api.get(`/districts/${form.watch("districtId")}`);
      return data;
    },
    {
      enabled: Boolean(form.watch("districtId")),
      staleTime: 30000, // 30 seconds
    }
  );

  // Fetch groups based on selected branch
  const { data: groups, refetch: refetchGroups } = useQuery(
    [
      "groups",
      {
        branch: form.watch("branchId"),
      },
    ],
    async () => {
      const { data } = await api.get("/groups", {
        params: {
          filters: [
            {
              field: "branchId",
              operator: "eq",
              value: form.watch("branchId"),
            },
          ],
        },
      });
      return data.results;
    },
    {
      enabled: Boolean(form.watch("branchId")),
      staleTime: 30000, // 30 seconds
    }
  );

  // Set branch and group automatically when user is not admin
  useEffect(() => {
    if (isOpen) {
      // Refetch user group data when form opens
      if (!canPerformActions) {
        refetchUserGroup();
      }
    }
  }, [isOpen, canPerformActions, refetchUserGroup]);

  // Effect to update form values when user group data is available
  useEffect(() => {
    if (isOpen && !canPerformActions) {
      // Set district and branch IDs from user data for non-admins
      if (user?.branch?.district?.id) {
        form.setValue("districtId", user.branch.district.id.toString());
      }

      if (user?.branch?.id) {
        form.setValue("branchId", user.branch.id.toString());
      }

      // Set group ID when user group data is available
      if (userGroup?.data?.id) {
        form.setValue("groupIds", [userGroup.data.id.toString()]);
      } else if (user?.group?.id) {
        form.setValue("groupIds", [user.group.id.toString()]);
      }
    }
  }, [isOpen, canPerformActions, user, userGroup, form]);

  // Clear branch and group selections when district changes
  useEffect(() => {
    if (form.watch("districtId")) {
      form.setValue("branchId", "");
      form.setValue("groupIds", []);
      refetchBranches();
    }
  }, [form.watch("districtId"), refetchBranches]);

  // Clear group selections when branch changes
  useEffect(() => {
    if (form.watch("branchId")) {
      form.setValue("groupIds", []);
      refetchGroups();
    }
  }, [form.watch("branchId"), refetchGroups]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Only enforce for leader roles
    const leaderRoles = ["President", "Secretary", "Accountant"];
    if (leaderRoles.includes(values.role) && values.groupIds && values.groupIds.length > 0) {
      try {
        // Check for each group if the leader role is already assigned in the group entity
        const conflicts = [];
        for (const groupId of values.groupIds) {
          // Fetch group details
          const { data } = await api.get(`/groups/${groupId}`);
          let leaderId = null;
          if (values.role === "President") leaderId = data.president?.id;
          if (values.role === "Secretary") leaderId = data.secretary?.id;
          if (values.role === "Accountant") leaderId = data.accountant?.id;
          // If leader is set and not the current record, it's a conflict
          if (leaderId && (!record || leaderId !== record.id)) {
            conflicts.push(data.name || groupId);
          }
        }
        if (conflicts.length > 0) {
          form.setError("role", {
            type: "manual",
            message: `This group${conflicts.length > 1 ? 's' : ''} already ha${conflicts.length > 1 ? 've' : 's'} a ${values.role}.`,
          });
          return;
        }
      } catch (err) {
        toast.error("Failed to validate group leader role.");
        return;
      }
    }
    // Extract districtId from the form values before submission since the API doesn't expect it
    const q = record
      ? api.patch(`/members/${record.id}`, values)
      : api.post("/members", values);

    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Member updated successfully" : "Member created successfully"
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

  const { data: countries } = useQuery(["countries"], async () => {
    const data = await fetch("/countries.json")
      .then((e) => e.json())
      .then((e) => e.filter((e) => e.name.toLowerCase()))
      .then((e) => e.map((e) => ({ label: e.name, value: e.name })));
    return data;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full flex flex-col !gap-0 sm:max-w-2xl p-0 md:max-w-3xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b px-4 py-2.5">
          <SheetTitle className="text-[15px]">
            {record ? "Update Member" : "Add New Member"}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="h-full flex flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="space-y-8 py-3 px-4">
                {/* Location Information Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Location Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="memberCode"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Member Code (4 digits)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 1234"
                              error={fieldState?.error?.message}
                              maxLength={4}
                              pattern="\d{4}"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="districtId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!canPerformActions} // Disable district selection for non-admin users
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select district" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districts?.map((district) => (
                                  <SelectItem
                                    key={district.id}
                                    value={district.id?.toString()}
                                  >
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Zone</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!form.watch("districtId") || !canPerformActions} // Disable branch selection if no district or non-admin
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districtWithBranches?.branches?.map((branch) => (
                                  <SelectItem
                                    key={branch.id}
                                    value={branch.id?.toString()}
                                  >
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="groupIds"
                      render={({ field, fieldState }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Groups</FormLabel>
                          <FormControl>
                            <MultiSelect
                              disabled={!form.watch("branchId") || !canPerformActions} // Disable group selection if no branch or non-admin
                              options={
                                groups?.map((g) => ({
                                  value: g.id.toString(),
                                  label: g.name,
                                })) || []
                              }
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Select groups"
                              error={fieldState?.error?.message}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Personal Information Section */}
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Member's Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter first name"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter last name"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fullNames"
                      render={({ field, fieldState }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Full Names</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full names"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field, fieldState }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Role *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="President">President</SelectItem>
                                <SelectItem value="Secretary">Secretary</SelectItem>
                                <SelectItem value="Accountant">Accountant</SelectItem>
                                <SelectItem value="Member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch('role') && form.watch('role') !== 'Member' && (
                      roleConflict ? (
                        <div className="col-span-2 text-red-600 text-sm font-medium mb-2">{roleConflict}</div>
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field, fieldState }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="Enter email"
                                    error={fieldState?.error?.message}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field, fieldState }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Enter password"
                                    error={fieldState?.error?.message}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )
                    )}
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="marriageStatus"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Marriage Status</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select marriage status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">Divorced</SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter ID number"
                              error={fieldState?.error?.message}
                              type="number"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries?.map((e) => (
                                  <SelectItem key={e.value} value={e.value}>
                                    {e.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="currentAddress"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Current Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter current address"
                                error={fieldState?.error?.message}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="joinedAt"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Join Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceOfIncome"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Source of Income</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder="Select source of income" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Employment">
                                  Employment
                                </SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Farming">Farming</SelectItem>
                                <SelectItem value="Freelance">
                                  Freelance
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              </div>
            </ScrollArea>
            <div className="mt-auto border-t px-3 py-2.5 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={form.formState.disabled || form.formState.isSubmitting}
                type="submit"
                size="sm"
              >
                {form.formState.isSubmitting && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                {record ? "Update Member" : "Add Member"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


export default function Members() {
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

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const newRecordModal = useModalState();
  const confirmModal = useConfirmModal();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { user } = useAuth();
  const canPerformActions = canPerformAdminActions(user);

  // Add separate queries for filter options
  const { data: branches = [] } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results.map(branch => ({
      label: branch.name,
      value: branch.name
    }));
  });


  // Add gender options
  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" }
  ];

  // Add marriage status options
  const marriageStatusOptions = [
    { label: "Single", value: "Single" },
    { label: "Married", value: "Married" },
    { label: "Divorced", value: "Divorced" },
    { label: "Widowed", value: "Widowed" }
  ];

  // Add source of income options
  const sourceOfIncomeOptions = [
    { label: "Employment", value: "Employment" },
    { label: "Business", value: "Business" },
    { label: "Farming", value: "Farming" },
    { label: "Freelance", value: "Freelance" },
    { label: "Other", value: "Other" }
  ];

  // Add a function to handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setColumnFilters(prev => {
        const otherFilters = prev.filter(f => f.id !== "createdAt");
        return [
          ...otherFilters,
          {
            id: "createdAt",
            value: [range.from, range.to]
          }
        ];
      });
    } else {
      setColumnFilters(prev => prev.filter(f => f.id !== "createdAt"));
    }
  };

  const recordsQuery = useQuery({
    queryKey: [
      "members",
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
              branch: "branch.name",
              group: "group.name",
              createdAt: "createdAt"
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
                  endOfDay.toISOString()
                ]
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

      const { data } = await api.get(`/members`, { params });
      console.log("API Response:", data);

      return {
        items: data?.results?.map((e) => ({
          ...e,
          branch: e?.branch?.name,
          group: e?.group?.name,
          createdAt: e?.createdAt,
          // Use leaderRoles from backend for correct display
          leaderRoles: e?.leaderRoles || [],
          groupMemberships: e?.groupMemberships || [],
          contributions: e?.contributions || [],
          loans: e?.loans || [],
        })),
        totalPages: data?.totalPages,
      };
    },
  });

  // Add query for member details
  const memberDetailsQuery = useQuery(
    ["member-details", selectedMember?.id],
    async () => {
      if (!selectedMember?.id) return null;
      const { data } = await api.get(`/members/${selectedMember.id}`);
      return data.data;
    },
    {
      enabled: !!selectedMember?.id,
    }
  );

  const columns: ColumnDef<any>[] = [
    ...(user?.isAdmin ? [{
      id: "select",
      header: ({ table }) => (
        <Checkbox
          // @ts-ignore
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            #{row.getValue("id")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.avatar} />
              <AvatarFallback>
                {row.original.firstName?.[0]}
                {row.original.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <button
                onClick={() => {
                  setSelectedMember(row.original);
                  setIsViewDialogOpen(true);
                }}
                className="font-medium hover:underline"
              >
                {row.original.firstName} {row.original.lastName}
              </button>

            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "leaderRoles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leader Roles" />
      ),
      cell: ({ row }) => {
        const leaderRoles = row.original.leaderRoles || [];
        if (leaderRoles.length === 0) {
          return <span className="text-muted-foreground text-sm">Member</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {leaderRoles.map((leaderRole, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20"
              >
                {leaderRole.role} ({leaderRole.group.name})
              </Badge>
            ))}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("phone")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "branch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Zone" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.original.branch?.name}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "groups",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Groups" />
      ),
      cell: ({ row }) => {
        const groups = row.original.groups || [];

        if (groups.length === 0) {
          return <span className="text-muted-foreground text-sm">No groups</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {groups.slice(0, 2).map((group, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-1.5 py-0.5"
              >
                {group.name}
              </Badge>
            ))}
            {groups.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {groups.length - 2} More
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "currentSavings",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current Savings" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("currentSavings")} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "marriageStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marriage Status" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("marriageStatus")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "sourceOfIncome",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source of Income" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("sourceOfIncome")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    // country
    {
      accessorKey: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("country")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center mt-1 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedMember(row.original);
                  setIsViewDialogOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
              {(user?.isAdmin || user?.role?.name === "President" || user?.role?.name === "Accountant" || user?.role?.name === "Secretary") && (
                <DropdownMenuItem
                  onClick={() => {
                    setRecordToEdit(row?.original);
                  }}
                >
                  Update Member
                </DropdownMenuItem>
              )}
              {user?.isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        onClick={() => {
                          confirmModal.open({ meta: row?.original });
                        }}
                        disabled={
                          row.original.groupMemberships?.length > 0 ||
                          row.original.contributions?.length > 0 ||
                          row.original.loans?.length > 0 ||
                          row.original.currentSavings !== 0
                        }
                        className={
                          row.original.groupMemberships?.length > 0 ||
                            row.original.contributions?.length > 0 ||
                            row.original.loans?.length > 0 ||
                            row.original.currentSavings !== 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                      >
                        Delete Member
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    {(row.original.groupMemberships?.length > 0 ||
                      row.original.contributions?.length > 0 ||
                      row.original.loans?.length > 0 ||
                      row.original.currentSavings !== 0) && (
                        <TooltipContent>
                          <p>Cannot delete member with active group memberships, contributions, loans, or non-zero savings</p>
                        </TooltipContent>
                      )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/members/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Member deleted successfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        const errorMessage = e.response?.data?.message || e.message;

        // Check if it's the specific constraint error
        if (errorMessage.includes("Cannot delete member with group memberships, contributions, or loans")) {
          toast.error("Cannot delete member. This member has active group memberships, contributions, or loans. Please remove these relationships first.");
        } else {
          toast.error(errorMessage);
        }
      });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={async () => {
            // Dynamically import jsPDF and html2canvas
            const jsPDF = (await import('jspdf')).jsPDF;
            const html2canvas = (await import('html2canvas')).default;
            // Create a hidden div for PDF content
            const pdfDiv = document.createElement('div');
            pdfDiv.style.position = 'fixed';
            pdfDiv.style.left = '-9999px';
            pdfDiv.style.top = '0';
            pdfDiv.style.width = '900px';
            pdfDiv.style.background = '#fff';
            pdfDiv.style.fontFamily = 'Arial, sans-serif';
            pdfDiv.innerHTML = `
              <div style="padding:32px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;">
                  <span>${new Date().toLocaleString()}</span>
                  <span>ikimina management system.</span>
                </div>
                <div style="text-align:center;margin-bottom:8px;font-size:16px;font-weight:600;">ikimina | Members Report</div>
                <div style="text-align:center;margin-bottom:16px;font-size:22px;font-weight:bold;">MEMBERS LIST</div>
                <hr style="margin-bottom:16px;" />
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#f5f5f5;">
                      <th style="border:1px solid #ddd;padding:6px;">ID</th>
                      <th style="border:1px solid #ddd;padding:6px;">Member</th>
                      <th style="border:1px solid #ddd;padding:6px;">Leader Roles</th>
                      <th style="border:1px solid #ddd;padding:6px;">Phone</th>
                      <th style="border:1px solid #ddd;padding:6px;">Zone</th>
                      <th style="border:1px solid #ddd;padding:6px;">Groups</th>
                      <th style="border:1px solid #ddd;padding:6px;">Current Savings</th>
                      <th style="border:1px solid #ddd;padding:6px;">Marriage Status</th>
                      <th style="border:1px solid #ddd;padding:6px;">Source of Income</th>
                      <th style="border:1px solid #ddd;padding:6px;">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(recordsQuery.data?.items || []).map(m => `
                      <tr>
                        <td style="border:1px solid #ddd;padding:6px;">${m.id}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.fullNames}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.role}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.phone}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.branch?.name || ''}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${(m.groups || []).map(g => g.name).join('; ')}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.currentSavings} FRW</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.marriageStatus}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.sourceOfIncome}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${m.country}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div style="margin-top:24px;display:flex;justify-content:space-between;font-size:14px;">
                  <div><b>Total Members:</b> ${(recordsQuery.data?.items || []).length}</div>
                  <div><b>Generated on</b> ${new Date().toLocaleString()}</div>
                </div>
              </div>
            `;
            document.body.appendChild(pdfDiv);
            // Use html2canvas to render the div
            const canvas = await html2canvas(pdfDiv, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('members_report.pdf');
            document.body.removeChild(pdfDiv);
          }}
        >
          Download Members Report
        </Button>
      </div>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`This will permanently delete the member and cannot be undone. Note: Members with group memberships, contributions, or loans cannot be deleted.`}
        meta={confirmModal.meta}
        onConfirm={(meta) => {
          handleDelete(meta);
        }}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <span>Mmember Details</span>
              {memberDetailsQuery.data && (
                <Badge variant="outline" className="text-xs">
                  ID: #{memberDetailsQuery.data.id}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {memberDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center p-6 h-full">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : memberDetailsQuery.data ? (
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Compact Header */}
                <div className="mb-4 bg-card rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={memberDetailsQuery.data.avatar} />
                      <AvatarFallback className="text-sm">
                        {memberDetailsQuery.data.firstName?.[0]}
                        {memberDetailsQuery.data.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-bold">{memberDetailsQuery.data.fullNames}</h2>
                      <p className="text-sm text-muted-foreground">{memberDetailsQuery.data.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs for organized content */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="groups">Groups ({memberDetailsQuery.data.groupMemberships?.length || 0})</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-card rounded-lg border p-3">
                        <h3 className="text-sm font-semibold mb-3 pb-1 border-b">Personal Info</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="font-medium">{memberDetailsQuery.data.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Marriage:</span>
                            <span className="font-medium">{memberDetailsQuery.data.marriageStatus}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Income:</span>
                            <span className="font-medium">{memberDetailsQuery.data.sourceOfIncome}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Joined:</span>
                            <span className="font-medium">{new Date(memberDetailsQuery.data.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border p-3">
                        <h3 className="text-sm font-semibold mb-3 pb-1 border-b">Location</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Country:</span>
                            <span className="font-medium">{memberDetailsQuery.data.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Zone:</span>
                            <span className="font-medium">{memberDetailsQuery.data.branch?.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {memberDetailsQuery.data.currentAddress}
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border p-3">
                        <h3 className="text-sm font-semibold mb-3 pb-1 border-b">Leader Roles</h3>
                        <div className="space-y-2 text-sm">
                          {memberDetailsQuery.data.leaderRoles?.length > 0 ? (
                            <div className="space-y-2">
                              {memberDetailsQuery.data.leaderRoles.map((leaderRole, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-2 py-1 bg-primary/10 text-primary"
                                  >
                                    {leaderRole.role}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    in {leaderRole.group.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No leader roles</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="groups" className="mt-4">
                    {memberDetailsQuery.data.groupMemberships?.length > 0 ? (
                      <div className="space-y-3">
                        {memberDetailsQuery.data.groupMemberships?.map((membership) => {
                          const memberShares = memberDetailsQuery.data.contributions?.length > 0
                            ? Math.floor(memberDetailsQuery.data.contributions[0].depositAmount / membership.group.pricePerShare)
                            : 0;

                          return (
                            <div key={membership.id} className="bg-card border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{membership.group.name}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant={membership.loanEligibility ? "default" : "secondary"} className="text-xs">
                                    {membership.loanEligibility ? "Eligible" : "Not Eligible"}
                                  </Badge>
                                  {canPerformActions && (
                                    <Switch
                                      checked={membership.loanEligibility}
                                      onCheckedChange={async (checked) => {
                                        const branchId = membership.branch?.id || membership.group?.branch?.id || memberDetailsQuery.data?.branch?.id;
                                        // Only send the fields we want to update
                                        const payload = {
                                          loanEligibility: checked,
                                          branchId,
                                        };

                                        console.log("PATCH payload:", payload);
                                        console.log("Membership data:", membership);
                                        if (!branchId) {
                                          console.error("Missing branchId for membership:", membership);
                                          console.error("Member data:", memberDetailsQuery.data);
                                          alert("No branchId found for this group member. Please check your data. This might be a data inconsistency issue.");
                                          return;
                                        }
                                        try {
                                          await api.patch(`/groups/${membership.group.id}/members/${membership.id}`, payload);
                                          memberDetailsQuery.refetch();
                                        } catch (e) {
                                          alert(e?.response?.data?.message || e.message || "Failed to update eligibility");
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Shares:</span>
                                  <span className="font-medium ml-1">{memberShares}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Value:</span>
                                  <span className="font-medium ml-1">{membership.group.pricePerShare?.toLocaleString()} FRW</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Meeting:</span>
                                  <span className="font-medium ml-1">{membership.group.meetingDay || "Not set"}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {membership.group.meetingLocation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No group memberships found
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-card rounded-lg border p-3">
                        <h3 className="text-sm font-semibold mb-3 pb-1 border-b">Branch Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Zone Name:</span>
                            <span className="font-medium">{memberDetailsQuery.data.branch?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Zone Address:</span>
                            <span className="font-medium">{memberDetailsQuery.data.branch?.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center text-muted-foreground h-full flex items-center justify-center">
              <div>
                <p className="mb-2">No member details available</p>
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Members</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={async () => {
                // Dynamically import jsPDF and html2canvas
                const jsPDF = (await import('jspdf')).jsPDF;
                const html2canvas = (await import('html2canvas')).default;
                // Create a hidden div for PDF content
                const pdfDiv = document.createElement('div');
                pdfDiv.style.position = 'fixed';
                pdfDiv.style.left = '-9999px';
                pdfDiv.style.top = '0';
                pdfDiv.style.width = '900px';
                pdfDiv.style.background = '#fff';
                pdfDiv.style.fontFamily = 'Arial, sans-serif';
                pdfDiv.innerHTML = `
                  <div style="padding:32px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;">
                      <span>${new Date().toLocaleString()}</span>
                      <span>ikimina management system.</span>
                    </div>
                    <div style="text-align:center;margin-bottom:8px;font-size:16px;font-weight:600;">ikimina | Members Report</div>
                    <div style="text-align:center;margin-bottom:16px;font-size:22px;font-weight:bold;">MEMBERS LIST</div>
                    <hr style="margin-bottom:16px;" />
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                      <thead>
                        <tr style="background:#f5f5f5;">
                          <th style="border:1px solid #ddd;padding:6px;">ID</th>
                          <th style="border:1px solid #ddd;padding:6px;">Member</th>
                          <th style="border:1px solid #ddd;padding:6px;">Leader Roles</th>
                          <th style="border:1px solid #ddd;padding:6px;">Phone</th>
                          <th style="border:1px solid #ddd;padding:6px;">Zone</th>
                          <th style="border:1px solid #ddd;padding:6px;">Groups</th>
                          <th style="border:1px solid #ddd;padding:6px;">Current Savings</th>
                          <th style="border:1px solid #ddd;padding:6px;">Marriage Status</th>
                          <th style="border:1px solid #ddd;padding:6px;">Source of Income</th>
                          <th style="border:1px solid #ddd;padding:6px;">Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(recordsQuery.data?.items || []).map(m => `
                          <tr>
                            <td style="border:1px solid #ddd;padding:6px;">${m.id}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.fullNames}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.role}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.phone}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.branch?.name || ''}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${(m.groups || []).map(g => g.name).join('; ')}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.currentSavings} FRW</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.marriageStatus}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.sourceOfIncome}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${m.country}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div style="margin-top:24px;display:flex;justify-content:space-between;font-size:14px;">
                      <div><b>Total Members:</b> ${(recordsQuery.data?.items || []).length}</div>
                      <div><b>Generated on</b> ${new Date().toLocaleString()}</div>
                    </div>
                  </div>
                `;
                document.body.appendChild(pdfDiv);
                // Use html2canvas to render the div
                const canvas = await html2canvas(pdfDiv, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save('members_report.pdf');
                document.body.removeChild(pdfDiv);
              }}
            >
              Download Members Report
            </Button>
            {(user?.isAdmin || user?.role?.name === "President" || user?.role?.name === "Accountant" || user?.role?.name === "Secretary") && (
              <Button onClick={() => newRecordModal.open()}>
                <PlusCircle size={16} className="mr-2" />
                Add Member
              </Button>
            )}
          </div>
        </div>

        <DataTable
          title="Members List"
          columns={columns}
          data={recordsQuery.data?.items || []}
          facets={[
            {
              name: "branch",
              title: "Zone",
              type: "select",
              options: branches,
            },
            {
              name: "gender",
              title: "Gender",
              type: "select",
              options: genderOptions,
            },
            {
              name: "marriageStatus",
              title: "Marriage Status",
              type: "select",
              options: marriageStatusOptions,
            },
            {
              name: "sourceOfIncome",
              title: "Source of Income",
              type: "select",
              options: sourceOfIncomeOptions,
            }
          ]}
          isLoading={recordsQuery.status === "loading"}
          defaultColumnVisibility={{}}
          onSearch={(value) => setSearchText(value)}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          setSorting={setSorting}
          sorting={sorting}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={recordsQuery?.data?.totalPages || 0}
          isFetching={recordsQuery.isFetching}
        />
      </div>

      <MemberForm
        isOpen={newRecordModal.isOpen || Boolean(recordToEdit)}
        setIsOpen={(e) => {
          newRecordModal.setisOpen(e);
          if (!e) {
            setRecordToEdit(undefined);
          }
        }}
        refetch={recordsQuery.refetch}
        record={recordToEdit}
      />
    </>
  );
}