
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle } from "lucide-react";
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
} from "@/components/ui/form";
import * as z from "zod";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth.context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Available resources and actions for permissions
const AVAILABLE_RESOURCES = [
  "users",
  "roles",
  "branches",
  "groups",
  "members",
  "contributions"
];

const AVAILABLE_ACTIONS = ["create", "read", "update", "delete"];

// Updated schema with permissions
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())).optional(),
});

function RoleForm({ isOpen, setIsOpen, refetch, record }) {
  // Initialize form with default values or existing record
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
          ...record,
        }
      : {
          name: "",
          description: "",
          permissions: {},
        },
  });

  const { user } = useAuth();

  // Get the current permissions value
  const watchedPermissions = form.watch("permissions") || {};

  // Handle checkbox changes for permissions
  const handlePermissionChange = (resource, action, checked) => {
    const currentPermissions = { ...watchedPermissions };
    
    // Initialize the resource array if it doesn't exist
    if (!currentPermissions[resource]) {
      currentPermissions[resource] = [];
    }
    
    // Add or remove the action
    if (checked) {
      if (!currentPermissions[resource].includes(action)) {
        currentPermissions[resource] = [...currentPermissions[resource], action];
      }
    } else {
      currentPermissions[resource] = currentPermissions[resource].filter(
        (a) => a !== action
      );
      
      // Remove empty resource arrays
      if (currentPermissions[resource].length === 0) {
        delete currentPermissions[resource];
      }
    }
    
    form.setValue("permissions", currentPermissions);
  };

  // Check if an action is selected for a resource
  const isActionSelected = (resource, action) => {
    return watchedPermissions[resource]?.includes(action) || false;
  };

  // Toggle all actions for a resource
  const toggleAllActions = (resource, checked) => {
    const currentPermissions = { ...watchedPermissions };
    
    if (checked) {
      currentPermissions[resource] = [...AVAILABLE_ACTIONS];
    } else {
      delete currentPermissions[resource];
    }
    
    form.setValue("permissions", currentPermissions);
  };

  // Check if all actions are selected for a resource
  const areAllActionsSelected = (resource) => {
    const resourceActions = watchedPermissions[resource] || [];
    return (
      resourceActions.length === AVAILABLE_ACTIONS.length &&
      AVAILABLE_ACTIONS.every((action) => resourceActions.includes(action))
    );
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/roles/${record.id}`, values)
      : api.post("/roles", { ...values, createdById: user?.id });
    
    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Role updated successfully" : "Role created successfully"
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle className="text-[15px]">
            {record ? "Update Role" : "Add New Role"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pt-3 pb-4 px-3"
            >
              <div className="space-y-3">
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter Role Name"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter Description"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-3">
                <FormLabel>Permissions</FormLabel>
                <Accordion type="multiple" className="w-full">
                  {AVAILABLE_RESOURCES.map((resource) => (
                    <AccordionItem key={resource} value={resource}>
                      <AccordionTrigger className="py-2 px-3 hover:bg-slate-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={areAllActionsSelected(resource)}
                            onCheckedChange={(checked) => {
                              toggleAllActions(resource, !!checked);
                              // Stop event propagation to prevent accordion from toggling
                              event.stopPropagation();
                            }}
                            className="mr-2"
                          />
                          <span className="capitalize">{resource}</span>
                          
                          {/* Show badges for enabled permissions */}
                          {watchedPermissions[resource]?.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {watchedPermissions[resource]?.length} actions
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-3 p-2">
                          {AVAILABLE_ACTIONS.map((action) => (
                            <div
                              key={`${resource}-${action}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`${resource}-${action}`}
                                checked={isActionSelected(resource, action)}
                                onCheckedChange={(checked) => {
                                  handlePermissionChange(
                                    resource,
                                    action,
                                    !!checked
                                  );
                                }}
                              />
                              <label
                                htmlFor={`${resource}-${action}`}
                                className="text-sm capitalize cursor-pointer"
                              >
                                {action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="border-t px-3 py-2.5 ">
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
            {record ? "Update Role" : "Add Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function RolesPermissions() {
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
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3">
            {row.getValue("name")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3">
            {row.getValue("description")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "Permissions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Permissions" />
      ),
      cell: ({ row }) => {
        const permissions = row.original.permissions || {};
        
        return (
          <div className="flex flex-wrap items-center gap-1 max-w-xs">
            {Object.keys(permissions).map((resource,i) => (
              <div key={i} className="text-xs bg-slate-100 rounded px-2 py-1">
                {resource}
              </div>
            ))}
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
                  setRecordToEdit(row?.original);
                }}
              >
                Update Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Role
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
      id: "date",
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
      "roles",
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
      const { data } = await api.get(`/roles`, {
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
        items: data?.results?.map((e) => {
          return {
            ...e,
            description: e?.description || "N.A",
            permissions:e.permissions || []
          };
        }),
        totalPages: data?.totalPages,
      };
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/roles/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Role deleted successfully");
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
        description={`This will permanently delete the role and cannot be undone.`}
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
              Roles & Permissions Management
            </h2>
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                newRecordModal.open();
              }}
              size="sm"
            >
              <PlusCircle size={16} className="mr-2" />
              <span>Add new Role</span>
            </Button>
          </div>
        </div>

        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{}}
          isLoading={recordsQuery.status === "loading"}
          data={[...(recordsQuery?.data?.items || [])]?.filter((e) => e) || []}
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

      <RoleForm
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
