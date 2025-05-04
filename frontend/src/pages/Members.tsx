import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle, UserPlus, X, Calendar as CalendarIcon, FileX, Users, UserCircle, Phone, User, MapPin, Building, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

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
});

function MemberForm({ isOpen, setIsOpen, refetch, record }) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

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
      enabled: !isAdmin,
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
      if (!isAdmin) {
        refetchUserGroup();
      }
    }
  }, [isOpen, isAdmin, refetchUserGroup]);

  // Effect to update form values when user group data is available
  useEffect(() => {
    if (isOpen && !isAdmin) {
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
  }, [isOpen, isAdmin, user, userGroup, form]);

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
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 py-3 px-4"
            >
              {/* Location Information Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Location Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
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
                            disabled={!isAdmin} // Disable district selection for non-admin users
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
                        <FormLabel>Branch</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!form.watch("districtId") || !isAdmin} // Disable branch selection if no district or non-admin
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select branch" />
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
                            disabled={!form.watch("branchId") || !isAdmin} // Disable group selection if no branch or non-admin
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
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="mt-auto border-t px-3 py-2.5 ">
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
            onClick={form.handleSubmit(onSubmit)}
          >
            {form.formState.isSubmitting && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            {record ? "Update Member" : "Add Member"}
          </Button>
        </SheetFooter>
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

  // Add separate queries for filter options
  const { data: branches = [] } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results.map(branch => ({
      label: branch.name,
      value: branch.name
    }));
  });

  const { data: groups = [] } = useQuery(["groups"], async () => {
    const { data } = await api.get("/groups");
    return data.results.map(group => ({
      label: group.name,
      value: group.name
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
    {
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
    },
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
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">{row.getValue("phone")}</div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "branch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Branch" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("branch")}
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
        const groups = row.getValue("groups") as { id: string | number, name: string }[] | undefined;
        
        // No groups case
        if (!groups || groups.length === 0) {
          return <span className="text-muted-foreground text-sm">No groups</span>;
        }
        
        // Show up to 2 groups directly, with a "+X more" badge if there are additional groups
        const maxVisibleBadges = 2;
        const visibleGroups = groups.slice(0, maxVisibleBadges);
        const remainingCount = groups.length - maxVisibleBadges;
        
        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[200px]">
            {visibleGroups.map((group) => (
              <TooltipProvider key={group.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2 py-0.5 text-xs font-normal"
                    >
                      {group.name || "Unnamed Group"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{group.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {remainingCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className="bg-secondary/80 hover:bg-secondary text-secondary-foreground cursor-default px-2 py-0.5 text-xs"
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      {remainingCount} more
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 max-w-[200px]">
                      <p className="font-light text-sm">Additional Groups:</p>
                      <div className="flex flex-wrap gap-1">
                        {groups.slice(maxVisibleBadges).map(group => (
                          <Badge key={group.id} variant="outline" className="bg-muted">
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )},
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "savings",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current Savings" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {(row.getValue("savings") || 0)?.toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    // mariage status
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
    // source of income
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
              <DropdownMenuItem
                onClick={() => {
                  setRecordToEdit(row?.original);
                }}
              >
                Update Member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Member
              </DropdownMenuItem>
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
        toast.error(e.message);
      });
  };

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`This will permanently delete the member and cannot be undone.`}
        meta={confirmModal.meta}
        onConfirm={(meta) => {
          handleDelete(meta);
        }}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] md:h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <span>Member Details</span>
              {memberDetailsQuery.data && (
                <Badge variant="outline">
                  ID: #{memberDetailsQuery.data.id}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {memberDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center p-8 h-full">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : memberDetailsQuery.data ? (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6">
                {/* Header Section */}
                <div className="mb-6 bg-card rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20">
                      <AvatarImage src={memberDetailsQuery.data.avatar} />
                      <AvatarFallback className="text-lg">
                        {memberDetailsQuery.data.firstName?.[0]}
                        {memberDetailsQuery.data.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold mb-1">{memberDetailsQuery.data.fullNames}</h2>
                      <p className="text-muted-foreground">{memberDetailsQuery.data.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Personal Information */}
                  <div className="bg-card rounded-lg border p-4">
                    <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium">{memberDetailsQuery.data.gender}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Marriage Status</p>
                          <p className="font-medium">{memberDetailsQuery.data.marriageStatus}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Source of Income</p>
                        <p className="font-medium">{memberDetailsQuery.data.sourceOfIncome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Joined Date</p>
                        <p className="font-medium">{new Date(memberDetailsQuery.data.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-card rounded-lg border p-4">
                    <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                      Location Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <p className="font-medium">{memberDetailsQuery.data.country}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Address</p>
                        <p className="font-medium">{memberDetailsQuery.data.currentAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Branch</p>
                        <p className="font-medium">{memberDetailsQuery.data.branch?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Branch Information */}
                  <div className="bg-card rounded-lg border p-4">
                    <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                      Branch Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Branch Name</p>
                        <p className="font-medium">{memberDetailsQuery.data.branch?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Branch Address</p>
                        <p className="font-medium">{memberDetailsQuery.data.branch?.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Group Memberships */}
                  <div className="md:col-span-2 lg:col-span-3 bg-card rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <h3 className="text-base font-semibold">Group Memberships</h3>
                      <Badge variant="outline">{memberDetailsQuery.data.groupMemberships?.length || 0} Groups</Badge>
                    </div>
                    
                    {memberDetailsQuery.data.groupMemberships?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {memberDetailsQuery.data.groupMemberships?.map((membership) => {
                          // Calculate member's shares in this group using member's contributions
                          const memberShares = memberDetailsQuery.data.contributions?.length > 0
                            ? Math.floor(memberDetailsQuery.data.contributions[0].depositAmount / membership.group.pricePerShare)
                            : 0;

                          return (
                            <div key={membership.id} className="bg-accent/5 border rounded-lg p-4 hover:bg-accent/10 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <h4 className="font-medium text-lg">{membership.group.name}</h4>
                                <Badge variant={membership.loanEligibility ? "default" : "secondary"}>
                                  {membership.loanEligibility ? "Loan Eligible" : "Not Loan Eligible"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Your Shares</p>
                                  <p className="font-medium">
                                    {memberShares} shares
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Share Value</p>
                                  <p className="font-medium">
                                    {membership.group.pricePerShare?.toLocaleString()} FRW
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Meeting Day</p>
                                  <p className="font-medium">{membership.group.meetingDay || "Not set"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Meeting Time</p>
                                  <p className="font-medium">{membership.group.meetingStartTime} - {membership.group.meetingEndTime}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Location</p>
                                  <p className="font-medium">{membership.group.meetingLocation}</p>
                                </div>
                              </div>
                              {membership.group.meetingLocationDetails && (
                                <div className="mt-3">
                                  <p className="text-sm text-muted-foreground">Location Details</p>
                                  <p className="text-sm">{membership.group.meetingLocationDetails}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No group memberships found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center">
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
            <Button onClick={() => newRecordModal.open()}>
              <PlusCircle size={16} className="mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        <DataTable
          title="Members List"
          columns={columns}
          data={recordsQuery.data?.items || []}
          facets={[
            {
              name: "branch",
              title: "Branch",
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
