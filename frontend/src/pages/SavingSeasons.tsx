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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as z from "zod";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  start: z.string().min(1, "Start date is required"),
  end: z.string().min(1, "End date is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["completed", "active"]),
});

function SeasonForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record || {
      name: "",
      start: "",
      end: "",
      description: "",
      status: "upcoming",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/seasons/${record.id}`, values)
      : api.post("/seasons", values);
    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Circle updated successfully" : "Circle created successfully"
        );
        setIsOpen(false);
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  console.log(form.formState.errors);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="border-b pb-3">
          <DialogTitle>
            {record ? "Update Circle" : "Add New Circle"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 pt-3 px-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Circle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter circle name"
                          error={fieldState?.error?.message}
                          {...field}
                        />
                      </FormControl>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger error={fieldState?.error?.message}>
                              <SelectValue placeholder="Select barcode symbology" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
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
                  name="end"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
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

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter circle description"
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

            <DialogFooter className="mt-6">
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
                disabled={
                  form.formState.disabled || form.formState.isSubmitting
                }
                type="submit"
                size="sm"
              >
                {form.formState.isSubmitting && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                {record ? "Update Circle" : "Add Circle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SavingSeasons() {
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
          <div className="capitalize flex items-center gap-3 truncate">
            {row.getValue("name")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === "active" ? "success" : "outline"}>
            {status as string}
          </Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "start",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="capitalize flex items-center gap-3 truncate">
            {new Date(row.getValue("start")).toLocaleDateString()}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "end",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="capitalize flex items-center gap-3 truncate">
            {new Date(row.getValue("end")).toLocaleDateString()}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "currentAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="capitalize flex items-center gap-3 truncate">
            {(row.getValue("currentAmount") || 0)?.toLocaleString()} FRW
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
                Update Circle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Circle
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
      "saving-seasons",
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
      const { data } = await api.get(`/seasons`, {
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
        items: data?.results?.map((e) => ({
          ...e,
        })),
        totalPages: data?.totalPages,
      };
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/seasons/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Circle deleted successfully");
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
        description={`This will permanently delete the saving circle and cannot be undone.`}
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
              Saving Circles Management
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
              <span>Add new Circle</span>
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

      <SeasonForm
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
