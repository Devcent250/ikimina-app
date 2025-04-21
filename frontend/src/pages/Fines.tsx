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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { useAuth } from "@/context/auth.context";

const formSchema = z.object({
  amount: z.string().min(0, "Amount must be a positive number"),
  groupMemberId: z.number().min(1, "Member is required"),
  reason: z.string().min(1, "Reason is required"),
  branchId: z.string().min(1, "Branch is required"),
  groupId: z.string().min(1, "Group is required"),
  notes: z.string().optional(),
});

function FineForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
          ...record,
          branchId: record.branchId?.toString(),
          amount: record.amount?.toString(),
          groupMemberId: record.groupMemberId?.toString(),
          groupId: record.groupId?.toString(),
        }
      : {
          amount: "0",
          groupMemberId: undefined,
          reason: "",
          branchId: "",
          groupId: "",
          notes: "",
        },
  });

  const { user } = useAuth();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/fines/${record.id}`, values)
      : api.post("/fines", { ...values, createdById: user?.id });
    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Fine updated successfully" : "Fine created successfully"
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

  const { data: members = [] } = useQuery(
    [
      "members",
      {
        groupId: form.watch("groupId"),
      },
    ],
    async () => {
      const { data } = await api.get(
        `/groups/${form.watch("groupId")}/members`
      );
      return data.results;
    },
    {
      enabled: Boolean(form.watch("groupId")),
    }
  );

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
      enabled: Boolean(form.watch("branchId")),
    }
  );

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle className="text-[15px]">
            {record ? "Update Fine" : "Add New Fine"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 pt-3 pb-4 px-3"
            >
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter Fine Amount"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Late Contribution">
                                Late Contribution
                              </SelectItem>
                              <SelectItem value="Absenteeism">
                                Absenteeism
                              </SelectItem>{" "}
                              <SelectItem value="Loan Default">
                                Loan Default
                              </SelectItem>{" "}
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
                            onValueChange={field.onChange}
                            value={field.value?.toString()}
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
                    name="groupId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <Select
                            disabled={!form.getValues("branchId")}
                            onValueChange={field.onChange}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups?.map((e) => (
                                <SelectItem key={e.id} value={e.id.toString()}>
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
                  <div className="col-span-2 mb-2">
                    <FormField
                      control={form.control}
                      name="groupMemberId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Member</FormLabel>
                          <SearchSelect
                            disabled={!form.getValues("groupId")}
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
                            placeholder={"Select member"}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 mb-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Enter notes here</FormLabel>
                          <Textarea
                            error={fieldState?.error?.message}
                            value={field?.value}
                            onChange={field.onChange}
                            placeholder={"Enter notes"}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
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
            {record ? "Update Fine" : "Add Fine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Fines() {
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
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("createdAt")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3">
            {row.getValue("amount").toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "member",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3">
            {row.getValue("member")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reason" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center capitalize gap-3">
            {row.getValue("reason")}
          </div>
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
          <div className="flex items-center gap-3 truncate">
            {row.getValue("branch")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Group" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("group")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("createdBy")}
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
                Update Fine
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Fine
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
      "fines",
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
      const { data } = await api.get(`/fines`, {
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
            member: e?.member?.fullNames,
            branch: e?.branch?.name,
            group: e?.group?.name,
            createdBy: e?.createdBy?.name,
            createdAt: new Date(e?.createdAt).toLocaleDateString(),
            memberId: e?.member?.id,
            branchId: e?.branch?.id,
          };
        }),
        totalPages: data?.totalPages,
        meta: data?.results?.length && {
          createdAt: "TOTAL",
          amount: data?.results?.reduce((a, b) => a + b?.amount, 0),
          meta: {
            isFooter: true,
          },
        },
      };
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/fines/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Fine deleted successfully");
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
        description={`This will permanently delete the fine and cannot be undone.`}
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
              Fines Management
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
              <span>Add new Fine</span>
            </Button>
          </div>
        </div>

        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{}}
          isLoading={recordsQuery.status === "loading"}
          data={
            [
              ...(recordsQuery?.data?.items || []),
              recordsQuery?.data?.meta,
            ]?.filter((e) => e) || []
          }
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

      <FineForm
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
