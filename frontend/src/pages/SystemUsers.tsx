import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, UserPlus } from "lucide-react";
import { useState } from "react";
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

import * as z from "zod";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").optional(),
  role: z.string().min(1, "Role is required"),
  branchId: z.string().min(1, "Branch is required"),
  groupId: z.string().min(1, "Group is required"),
  status: z.enum(["active", "inactive"]),
  isAdmin: z.boolean().default(false),
  profileUrl: z.string().optional(),
});

function UserForm({ isOpen, setIsOpen, refetch, record }) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
        ...record,
        role: record.role?.toString() || (record.role?.id?.toString() || ""),
        branchId: record.branchId?.toString() || (record.branch?.id?.toString() || ""),
        groupId: record.groupId?.toString() || (record.group?.id?.toString() || ""),
        password: ""
      }
      : {
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        role: "",
        branchId: "",
        groupId: "",
        status: "active",
        isAdmin: false,
        profileUrl: "",
      },
  });

  const watchBranchId = form.watch("branchId");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (record && !values.password) {
      delete values.password;
    }

    const q = record
      ? api.patch(`/users/${record.id}`, values)
      : api.post("/users", values);

    try {
      await q;
      refetch();
      toast.success(
        record ? "User updated successfully" : "User created successfully"
      );
      setIsOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
      const errors = e?.response?.data?.meta?.errors || {};
      Object.keys(errors)?.forEach((field: any) => {
        form.setError(field, {
          message: errors[field],
        });
      });
    }
  }

  const { data: roles } = useQuery(["roles"], async () => {
    const { data } = await api.get("/roles");
    return data.results;
  });

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  const { data: groups } = useQuery(
    ["groups", { branchId: watchBranchId }],
    async () => {
      if (!watchBranchId) return [];
      const { data } = await api.get("/groups", {
        params: {
          filters: [
            {
              field: "branchId",
              operator: "eq",
              value: watchBranchId,
            },
          ],
        },
      });
      return data.results;
    },
    {
      enabled: Boolean(watchBranchId),
    }
  );


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle className="text-[15px]">
            {record ? "Update User" : "Add New User"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4 px-4"
            >

              {/* User Information Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter full name"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Account Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Account Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{record ? "New Password" : "Password"}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={record ? "Leave blank to keep current" : "Enter password"}
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
                    name="status"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Permissions and Assignment */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Permissions & Assignment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
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
                              {roles?.map((role) => (
                                <SelectItem
                                  key={role.id}
                                  value={role.id?.toString()}
                                >
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md pt-6">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={field.value}
                            onChange={field.onChange}
                            id="is-admin"
                          />
                        </FormControl>
                        <FormLabel htmlFor="is-admin" className="text-sm font-normal">
                          Administrator Access
                        </FormLabel>
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
                              form.setValue("groupId", "");
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {branches?.map((branch) => (
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="groupId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!watchBranchId}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder={watchBranchId ? "Select group" : "Select branch first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups?.map((group) => (
                                <SelectItem
                                  key={group.id}
                                  value={group.id?.toString()}
                                >
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="border-t px-4 py-3">
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
            disabled={form.formState.isSubmitting}
            type="submit"
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
          >
            {form.formState.isSubmitting && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            {record ? "Update User" : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function SystemUsers() {
  const [recordToEdit, setRecordToEdit] = useState(undefined);

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
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
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.profileUrl} />
              <AvatarFallback>{row.original.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <a href="#" className="font-medium hover:underline">
                {row.original.name}
              </a>
              <span className="text-xs text-gray-500">
                {row.original.first_name} {row.original.last_name}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="text-sm">{row.original.email}</span>
            <span className="text-xs text-gray-500">{row.original.phone || "—"}</span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "branch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Branch" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            {row.original.branch?.name || "—"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Group" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            {row.original.group?.name || "—"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        // Use displayRole if present, otherwise fallback
        const displayRole = row.original.displayRole;
        const role = displayRole || row.original.role?.name || row.getValue("role");
        const isAdmin = row.original.isAdmin;

        return (
          <div className="flex items-center gap-2">
            {role ? (
              <Badge variant="outline" className="font-normal">
                {role}
              </Badge>
            ) : (
              <span>—</span>
            )}
            {isAdmin && (
              <Badge variant="secondary" className="ml-1">
                Admin
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.original?.status && (
              <Badge
                variant={
                  {
                    inactive: "destructive",
                    active: "success",
                  }[row.original?.status]
                }
                className="capitalize"
              >
                {row.original?.status}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        // Format date nicely
        const date = new Date(row.original.createdAt);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date);

        return <div className="text-sm">{formattedDate}</div>;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-end mt-1 gap-2">
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
                  setRecordToEdit(row?.original);
                }}
              >
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
                className="text-red-600"
              >
                Delete User
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

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const newRecordModal = useModalState();
  const confirmModal = useConfirmModal();

  const recordsQuery = useQuery({
    queryKey: [
      "users",
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
      const { data } = await api.get(`/users`, {
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
        items: data?.results.map((e) => {
          return {
            ...e,
            role: e.role?.name,
            roleId: e.role?.id,
          };
        }),
        totalPages: data?.totalPages,
      };
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/users/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("User deleted successfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete this user?"}
        description={`This will permanently delete ${confirmModal.meta?.name || 'this user'} and cannot be undone.`}
        meta={confirmModal.meta}
        onConfirm={(meta) => {
          handleDelete(meta);
        }}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      <div className="sm:px-2 px-2">
        <div className="flex items-center justify-between space-y-2 my-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Users Management
            </h2>
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                newRecordModal.open();
              }}
              size="sm"
              className="shadow-sm"
            >
              <UserPlus size={16} className="mr-2" />
              <span>Add new User</span>
            </Button>
          </div>
        </div>

        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            createdAt: false,
          }}
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
              accessorKey: "status",
              title: "Status",
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
            {
              accessorKey: "role",
              title: "Role",
              options: recordsQuery?.data?.items
                ?.map((user) => user.role)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map((role) => ({
                  label: role,
                  value: role,
                })) || [],
            },
            {
              accessorKey: "branch.name",
              title: "Branch",
              options: recordsQuery?.data?.items
                ?.map((user) => user.branch?.name)
                .filter(Boolean)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map((branch) => ({
                  label: branch,
                  value: branch,
                })) || [],
            },
          ]}
        />
      </div>

      <UserForm
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
