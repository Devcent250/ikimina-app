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

const formSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  description: z.string().min(2, "Description must be at least 2 characters"),
  presidentId: z.number().min(1, "President is required"),
  accountantId: z.number().min(1, "Accountant is required"),
  secretaryId: z.number().min(1, "Secretary is required"),
  meetingFrequency: z.enum(["Weekly", "Bi-weekly", "Monthly", "Quarterly"]),
  location: z.string().min(2, "Location must be at least 2 characters"),
  pricePerShare: z.string().min(0, "Price per share must be a positive number"),
  minShares: z.string().min(1, "Minimum shares must be at least 1"),
  maxShares: z.string().min(1, "Maximum shares must be at least 1"),
  solidarityAmount: z
    .string()
    .min(0, "Solidarity Amount must be a positive number"),
  branchId: z.string().min(1, "Branch is required"),
});

function GroupForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
          ...record,
          pricePerShare: record.pricePerShare?.toString(),
          minShares: record.minShares?.toString(),
          maxShares: record.maxShares?.toString(),
          solidarityAmount: record.solidarityAmount?.toString(),
          branchId: record.branchId?.toString(),
        }
      : {
          name: "",
          description: "",
          presidentId: "",
          accountantId: "",
          secretaryId: "",
          branchId: "",
          meetingFrequency: "",
          location: "",
          pricePerShare: "",
          minShares: "",
          maxShares: "",
          solidarityAmount: "",
        },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/groups/${record.id}`, values)
      : api.post("/groups", values);
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
          console.log(field, errors[field]);
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

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full flex flex-col !gap-0 sm:max-w-2xl p-0 md:max-w-3xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b px-4 py-2.5">
          <SheetTitle
            onClick={() => console.log(form.getValues())}
            className="text-[15px]"
          >
            {record ? "Update Group" : "Add New Group"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 py-3 px-4"
            >
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter group name"
                          error={fieldState?.error?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="presidentId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>President</FormLabel>
                        <FormControl>
                          <SearchSelect
                            error={fieldState?.error?.message}
                            options={members.map((e) => {
                              return {
                                label: e.fullNames,
                                value: e.id,
                              };
                            })}
                            value={field?.value}
                            setValue={(value) => {
                              field.onChange(value);
                            }}
                            placeholder={"Select president"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountantId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Accountant</FormLabel>
                        <FormControl>
                          <SearchSelect
                            error={fieldState?.error?.message}
                            options={members.map((e) => {
                              return {
                                label: e.fullNames,
                                value: e.id,
                              };
                            })}
                            value={field?.value}
                            setValue={(value) => {
                              field.onChange(value);
                            }}
                            placeholder={"Select accountant"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secretaryId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Secretary</FormLabel>
                        <FormControl>
                          <SearchSelect
                            error={fieldState?.error?.message}
                            options={members.map((e) => {
                              return {
                                label: e.fullNames,
                                value: e.id,
                              };
                            })}
                            value={field?.value}
                            setValue={(value) => {
                              field.onChange(value);
                            }}
                            placeholder={"Select secretary"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetingFrequency"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Meeting Frequency</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Bi-weekly">
                                Bi-weekly
                              </SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">
                                Quarterly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter location"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerShare"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Price Per Share</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price per share"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minShares"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Minimum Shares</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter minimum shares"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxShares"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Maximum Shares</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter maximum shares"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solidarityAmount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Solidarity Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter solidarity amount"
                            error={fieldState?.error?.message}
                            {...field}
                          />
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
                            defaultValue={field?.value?.toString()}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description"
                            error={fieldState?.error?.message}
                            {...field}
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

        <SheetFooter className="mt-6 border-t px-3 py-2.5 ">
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
            {record ? "Update Group" : "Add Group"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function Groups() {
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
        <DataTableColumnHeader column={column} title="Group Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <a href="#" className="font-medium hover:underline">
              {row.original.name}
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
        <DataTableColumnHeader column={column} title="President" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("president")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "accountant",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Accountant" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("accountant")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "secretary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Secretary" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("secretary")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "pricePerShare",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price Per Share" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("pricePerShare").toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "solidarityAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Solidarity Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("solidarityAmount").toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "members",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Members" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("members").toLocaleString()}
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
                Update Group
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Group
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
      const { data } = await api.get(`/groups`, {
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
            president: e.president?.fullNames,
            accountant: e.accountant?.fullNames,
            secretary: e.secretary?.fullNames,
            members: e.groupMembers?.length,
            presidentId: e.president?.id,
            accountantId: e.accountant?.id,
            secretaryId: e.secretary?.id,
            branchId: e.branch?.id,
          };
        }),
        totalPages: data?.totalPages,
      };
    },
  });

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

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`This will permanently delete the group and cannot be undone.`}
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
              Groups Management
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
              <span>Add new Group</span>
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

      <GroupForm
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
