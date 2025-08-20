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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  groupId: z.string().min(1, "Group is required"),
  attendances: z
    .array(z.string())
    .min(1, "At least one member must be selected"),
});

function AttendanceForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? { ...record }
      : {
          date: "",
          groupId: "",
          attendances: [],
        },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const q = record
      ? api.patch(`/attendances/${record.id}`, values)
      : api.post("/attendances", values);
    return q
      .then(() => {
        refetch();
        toast.success(
          record
            ? "Attendance updated successfully"
            : "Attendance created successfully"
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

  const { data: groups } = useQuery(["groups"], async () => {
    const { data } = await api.get("/groups");
    return data.results;
  });

  const { data: members } = useQuery(["members"], async () => {
    const { data } = await api.get("/members");
    return data.results;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full flex flex-col !gap-0 sm:max-w-2xl p-0 md:max-w-3xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b px-4 py-2.5">
          <SheetTitle className="text-[15px]">
            {record ? "Update Attendance" : "Add New Attendance"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 py-3 px-4"
            >
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="Select date"
                            error={fieldState?.error?.message}
                            {...field}
                          />
                        </FormControl>
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups?.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.name}
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
                    name="attendances"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Attendances</FormLabel>
                        <FormControl>
                          <Select
                            multiple
                            onValueChange={field.onChange}
                            // @ts-ignore
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select members" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members?.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.name}
                                </SelectItem>
                              ))}
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
            {record ? "Update Attendance" : "Add Attendance"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function Attendance() {
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
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            {new Date(row.getValue("date")).toLocaleDateString()}
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
      accessorKey: "attendances",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attendances" />
      ),
      cell: ({ row }) => {
        const attendances = row.getValue("attendances") as any[];
        return (
          <div className="flex items-center gap-3">
            {attendances?.map((e) => (
              <Badge key={e} variant="outline">
                {e}
              </Badge>
            ))}
            {!attendances?.length && <span>No attendances</span>}
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
                Update Attendance
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Attendance
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
      "attendances",
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
      const { data } = await api.get(`/attendances`, {
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
        items: data?.results,
        totalPages: data?.totalPages,
      };
    },
  });

  const handleDelete = (record) => {
    confirmModal.setIsLoading(true);
    return api
      .delete(`/attendances/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Attendance deleted successfully");
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
        description={`This will permanently delete the attendance record and cannot be undone.`}
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
              Attendance Management
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
              <span>Add new Attendance</span>
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

      <AttendanceForm
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
