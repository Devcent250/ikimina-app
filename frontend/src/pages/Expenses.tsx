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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.string().min(0, "Amount must be a positive number"),
  groupId: z.string().min(1, "Group is required"),
  expenseCategoryId: z.string().min(1, "Expense category is required"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  attachment: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  notes: z.string().optional(),
});

function ExpenseForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
        ...record,
        groupId: record.groupId?.toString(),
        expenseCategoryId: record.expenseCategoryId?.toString(),
        paymentMethodId: record.paymentMethodId?.toString(),
        branchId: record.branchId?.toString(),
        amount: record.amount?.toString(),
      }
      : {
        name: "",
        amount: 0,
        groupId: "",
        seasonId: "",
        expenseCategoryId: "",
        paymentMethodId: "",
        branchId: "",
        notes: "",
        attachment: "",
      },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/expenses/${record.id}`, values)
      : api.post("/expenses", values);
    return q
      .then(() => {
        refetch();
        toast.success(
          record
            ? "Expense updated successfully"
            : "Expense created successfully"
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

  const { data: expenseCategories } = useQuery(
    ["expenseCategories"],
    async () => {
      const { data } = await api.get("/expense-categories");
      return data.results;
    }
  );

  const { data: paymentMethods } = useQuery(["paymentMethods"], async () => {
    const { data } = await api.get("/payment-methods");
    return data.results;
  });

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  console.log(form.formState.errors);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl p-0 gap-0">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle className="text-[15px]">
            {record ? "Update Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 py-3 px-3"
            >
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter name"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter amount"
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
                            onValueChange={field.onChange}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups?.map((e) => (
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
                    name="expenseCategoryId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Expense Category</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select expense category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories?.map((e) => (
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
                    name="paymentMethodId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods?.map((e) => (
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

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter notes"
                              error={fieldState?.error?.message}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="mt-6 border-t px-3 py-2.5 ">
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
            {record ? "Update Expense" : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Expenses() {
  const [recordToEdit, setRecordToEdit] = useState(undefined);

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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <>
            {row?.original?.id ? (
              <div className="flex items-center gap-3">
                <div>
                  <a href="#" className="font-medium hover:underline">
                    {row.original.name}
                  </a>
                </div>
              </div>
            ) : (
              "TOTAL"
            )}
          </>
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
          <div className="flex items-center gap-3">
            {row.getValue("amount")?.toLocaleString() + " FRW"}
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
          <div className="flex items-center gap-3">{row.getValue("group")}</div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "season",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Season" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("season")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "expenseCategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expense Category" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("expenseCategory")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Method" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {row.getValue("paymentMethod")}
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
        const createdBy = row.original.createdBy;
        if (!createdBy) {
          return (
            <div className="flex items-center gap-3">
              N/A
            </div>
          );
        }

        const roleName = createdBy.role?.name || "Unknown Role";
        const groupName = createdBy.group?.name;

        const displayText = groupName
          ? `${roleName} (${groupName})`
          : roleName;

        return (
          <div className="flex items-center gap-3">
            {displayText}
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
                Update Expense
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Expense
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
      "expenses",
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
      const { data } = await api.get(`/expenses`, {
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
            amount: e.amount,
            group: e.group?.name,
            season: e.season?.name,
            expenseCategory: e.expenseCategory?.name,
            paymentMethod: e.paymentMethod?.name,
            createdBy: e.createdBy,
            groupId: e.group?.id,
            seasonId: e.season?.id,
            expenseCategoryId: e.expenseCategory?.id,
            paymentMethodId: e.paymentMethod?.id,
            branchId: e.branch?.id,
          };
        }),
        totalPages: data?.totalPages,
        meta: data?.results?.length && {
          name: "TOTAL",
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
      .delete(`/expenses/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Expense deleted successfully");
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
        description={`This will permanently delete the expense and cannot be undone.`}
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
              Expenses Management
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
              <span>Add new Expense</span>
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

      <ExpenseForm
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
