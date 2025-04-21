import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle, UserPlus } from "lucide-react";
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
  groupIds: z.array(z.string()).optional(),
  branchId: z.string().min(1, "Branch is required"),
});

function MemberForm({ isOpen, setIsOpen, refetch, record }) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

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
      console.log("API response for user group:", response); // Log the full response
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
          branchId: record?.branchId?.toString(),
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
          branchId: "",
        },
  });

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
    if (isOpen) {
      // Set branch ID from user data for non-admins
      if (!isAdmin && user?.branch?.id) {
        form.setValue("branchId", user.branch.id.toString());
      }

      // Set group ID when user group data is available
      if (!isAdmin && userGroup?.data?.id) {
        console.log("Setting group from userGroup:", userGroup.data.id);
        form.setValue("groupIds", [userGroup.data.id.toString()]);
      } else if (!isAdmin && user?.group?.id) {
        console.log("Setting group from user.group:", user.group.id);
        form.setValue("groupIds", [user.group.id.toString()]);
      }
    }
  }, [isOpen, isAdmin, user, userGroup, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
          console.log(field, errors[field]);
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

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  const { data: groups } = useQuery(
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
      enabled: Boolean(form.watch("branchId")), // Only execute when branchId has a value
    }
  );

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
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear groupId when branch changes
                              form.setValue("groupIds", []);
                            }}
                            value={field.value}
                            disabled={!isAdmin} // Disable branch selection for non-admin users
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {branches?.map((e) => (
                                <SelectItem key={e.id} value={e.id?.toString()}>
                                  {e.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* Group field that depends on branch selection */}
                  <FormField
                    control={form.control}
                    name="groupIds"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Groups</FormLabel>
                        <FormControl>
                          <MultiSelect
                            disabled={!form.getValues("branchId") || !isAdmin} // Disable group selection for non-admin users
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
  const { user } = useAuth();
  const [recordToEdit, setRecordToEdit] = useState(undefined);
  
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        const firstName = row.original.firstName || row.original.member?.firstName || '';
        const lastName = row.original.lastName || row.original.member?.lastName || '';
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.avatar} />
              <AvatarFallback>
                {firstName[0]}
                {lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <a href="#" className="font-medium hover:underline">
                {firstName} {lastName}
              </a>
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
        const phone = row.original.phone || row.original.member?.phone || '';
        return (
          <div className="flex items-center gap-3">{phone}</div>
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
        const branch = row.getValue("branch") || '';
        const branchName = typeof branch === 'object' ? (branch.name || 'Unknown') : branch;
        return (
          <div className="flex items-center gap-3">
            {branchName}
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
        let groups = row.getValue("groups") || [];

        if (!Array.isArray(groups)) {
          groups = [];
        }
        
        // Filter out invalid group objects
        groups = groups.filter(group => 
          group && typeof group === 'object' && 
          (group.id !== undefined || group.name !== undefined)
        );

        // No groups case
        if (groups.length === 0) {
          return (
            <span className="text-muted-foreground text-sm">No groups</span>
          );
        }

        // Show up to 2 groups directly, with a "+X more" badge if there are additional groups
        const maxVisibleBadges = 2;
        const visibleGroups = groups.slice(0, maxVisibleBadges);
        const remainingCount = groups.length - maxVisibleBadges;

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[200px]">
            {visibleGroups.map((group) => (
              <TooltipProvider key={group.id || `group-${Math.random()}`}>
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
                    <p>{group.name || "Unnamed Group"}</p>
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
                        {groups.slice(maxVisibleBadges).map((group) => (
                          <Badge
                            key={group.id || `group-extra-${Math.random()}`}
                            variant="outline"
                            className="bg-muted"
                          >
                            {group.name || "Unnamed Group"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "savings",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current Savings" />
      ),
      cell: ({ row }) => {
        const savings = row.getValue("savings") || 0;
        return (
          <div className="flex items-center gap-3">
            {savings.toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    // marriage status
    {
      accessorKey: "marriageStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marriage Status" />
      ),
      cell: ({ row }) => {
        const marriageStatus = row.original.marriageStatus || row.original.member?.marriageStatus || '';
        return (
          <div className="flex items-center gap-3">
            {marriageStatus}
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
        const sourceOfIncome = row.original.sourceOfIncome || row.original.member?.sourceOfIncome || '';
        return (
          <div className="flex items-center gap-3">
            {sourceOfIncome}
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
        const country = row.original.country || row.original.member?.country || '';
        return (
          <div className="flex items-center gap-3">
            {country}
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
                  // Make sure to normalize the record before setting it for edit
                  const normalizedRecord = row.original.member 
                    ? { ...row.original.member, id: row.original.member.id } 
                    : row.original;
                  setRecordToEdit(normalizedRecord);
                }}
              >
                Update Member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Make sure to pass the correct ID for deletion
                  const recordId = row.original.member?.id || row.original.id;
                  confirmModal.open({ meta: { ...row.original, id: recordId } });
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

  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([
    {
      id: "createdAt",
      desc: true,
    },
  ]);

  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const newRecordModal = useModalState();
  const confirmModal = useConfirmModal();

  const recordsQuery = useQuery({
    queryKey: [
      "members",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
        isAdmin: user?.isAdmin,
        groupId: user?.group?.id
      },
    ],
    keepPreviousData: true,
    queryFn: async () => {
      // For admins, fetch all members with filters
      if (user?.isAdmin) {
        const { data } = await api.get(`/members`, {
          params: {
            page_size: pageSize,
            page: pageIndex + 1,
            ...(searchText && { search: searchText }),
            filters: [
              ...columnFilters.map((e) => {
                return {
                  field: e.id,
                  operator: "in",
                  value: e.value?.map((e) => e?.value || e),
                };
              }),
            ],
          },
        });
  
        return {
          items: data?.results?.map((member) => {
            const groups =
              member.groupMemberships
                ?.map((gm) => gm.group || null)
                .filter(Boolean) || [];
  
            return {
              ...member,
              branch: member?.branch?.name || "Unknown",
              branchId: member?.branch?.id,
              groups: groups,
              savings: member?.savings || 0,
            };
          }),
          totalPages: data?.totalPages,
        };
      } 
      // For non-admins, fetch only the members from their group
      else if (user?.group?.id) {
        const { data } = await api.get(`/groups/${user.group.id}/members`, {
          params: {
            page_size: pageSize,
            page: pageIndex + 1,
            ...(searchText && { search: searchText }),
          },
        });

        return {
          items: data?.results?.map((item) => {
            // Extract the correct group information
            let groups = [];
            if (item.groups && Array.isArray(item.groups)) {
              groups = item.groups;
            } else if (item.group) {
              groups = [item.group];
            }
            
            // Normalize the data structure for group members
            return {
              ...item,
              // Use member properties if available
              firstName: item.firstName || (item.member && item.member.firstName) || "",
              lastName: item.lastName || (item.member && item.member.lastName) || "",
              phone: item.phone || (item.member && item.member.phone) || "",
              marriageStatus: item.marriageStatus || (item.member && item.member.marriageStatus) || "",
              sourceOfIncome: item.sourceOfIncome || (item.member && item.member.sourceOfIncome) || "",
              country: item.country || (item.member && item.member.country) || "",
              // Handle branch information
              branch: item.branch || (item.branchId ? `${item.branchId === 1 ? "Kigali" : "Unknown"} Branch` : "Unknown"),
              branchId: item.branchId,
              // Default savings
              savings: item.savings || 0,
              // Ensure groups are an array of objects with at least id and name
              groups: groups,
              // Keep the original member object
              member: item.member,
            };
          }),
          totalPages: data?.totalPages || Math.ceil((data?.results?.length || 0) / pageSize),
        };
      }
      // If neither admin nor has group, return empty data
      else {
        return {
          items: [],
          totalPages: 0,
        };
      }
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    const memberId = record.id || record.member?.id;
    
    if (!memberId) {
      toast.error("Unable to identify member to delete");
      confirmModal.setIsLoading(false);
      confirmModal.close();
      return Promise.reject(new Error("Invalid member ID"));
    }
    
    return api
      .delete(`/members/${memberId}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Member deleted successfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message || "Failed to delete member");
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

      <div className="sm:px-2 px-2">
        <div className="flex items-center justify-between space-y-2- my-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Members Management
            </h2>
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                newRecordModal.open();
              }}
              size="sm"
            >
              <UserPlus size={16} className="mr-2" />
              <span>Add new Member</span>
            </Button>
          </div>
        </div>

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
          facets={[]}
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
