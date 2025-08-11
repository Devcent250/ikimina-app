import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { usePDF } from "react-to-pdf";
import { useQuery, useQueryClient, useMutation } from "react-query";
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
import { useAuth } from "@/context/auth.context";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const formSchema = z.object({
  amount: z.number().min(0, "Amount must be a positive number"),
  groupMemberId: z.number().min(1, "Member is required"),
  groupId: z.number().min(1, "Group is required"),
  loanType: z.number().min(1, "Loan type is required"),
  paymentFrequency: z.enum(["Monthly", "Weekly", "Daily"]),
  interestRate: z.number().min(0, "Interest rate must be a positive number"),
  loanTerms: z.string().min(1, "Loan terms are required"),
  branchId: z.number().min(1, "Branch is required"),
  attachment: z.any(),
});

const loanCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Description is required"),
  defaultAmount: z.string().min(1, "Default amount is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  maxAmount: z.string().optional(),
  minAmount: z.string().optional(),
});

function LoanForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
        ...record,
        branchId: record.branchId ? Number(record.branchId) : undefined,
        groupId: record.groupId ? Number(record.groupId) : undefined,
        groupMemberId: record.groupMemberId ? Number(record.groupMemberId) : undefined,
        loanType: record.loanType ? Number(record.loanType) : undefined,
        amount: record.amount ? Number(record.amount) : 0,
        interestRate: record.interestRate ? Number(record.interestRate) : 0,
      }
      : {
        amount: 0,
        groupMemberId: undefined,
        groupId: undefined,
        loanType: undefined,
        paymentFrequency: "",
        interestRate: 0,
        loanTerms: "",
        branchId: undefined,
        attachment: "",
      },
  });

  const { user } = useAuth();

  // Fetch loan categories from backend
  const { data: loanCategories, isLoading: loadingCategories } = useQuery([
    "loan-categories"
  ], async () => {
    const { data } = await api.get("/loan-categories");
    return data?.data?.results || data?.data || [];
  });

  // Function to auto-fill amount and interest rate based on selected loan category
  const handleLoanTypeChange = (loanTypeId) => {
    const selected = loanCategories?.find(cat => Number(cat.id) === Number(loanTypeId));
    console.log('Selected loan category:', selected);
    if (selected) {
      form.setValue("amount", Number(selected.defaultAmount) || 0);
      form.setValue("interestRate", Number(selected.interestRate) || 0);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Find the selected category by ID
    const selectedCategory = loanCategories?.find(cat => String(cat.id) === String(values.loanType));
    const payload = {
      ...values,
      groupMemberId: Number(values.groupMemberId),
      groupId: Number(values.groupId),
      branchId: Number(values.branchId),
      loanType: selectedCategory ? selectedCategory.name : "", // Send enum name
      amount: Number(values.amount),
      interestRate: Number(values.interestRate),
    };
    const q = record
      ? api.patch(`/loans/${record.id}`, payload)
      : api.post("/loans", { ...payload, createdById: user?.id });
    return q
      .then(() => {
        refetch();
        toast.success(
          record ? "Loan updated successfully" : "Loan created successfully"
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

  const { data: groupMembers = [] } = useQuery(
    [
      "group-members",
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
    <Sheet open={isOpen} onOpenChange={setIsOpen} >
      <SheetContent className="w-full flex flex-col !gap-0  p-0 md:max-w-xl overflow-y-auto" >
        <SheetHeader className="border-b px-4 py-2.5" >
          <SheetTitle className="text-[15px]" >
            {record ? "Update Loan" : "Add New Loan"}
          </SheetTitle>
        </SheetHeader>
        < ScrollArea className="h-full" >
          <Form {...form} >
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 pt-3 pb-4 px-3"
            >
              <div className="space-y-1" >
                <div className="grid grid-cols-2 gap-3" >
                  <div className="col-span-2" >
                    <FormField
                      control={form.control}
                      name="loanType"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Loan Type </FormLabel>
                          < FormControl >
                            <Select
                              onValueChange={value => {
                                const numValue = Number(value);
                                field.onChange(numValue);
                                handleLoanTypeChange(numValue);
                              }}
                              value={field.value !== undefined ? String(field.value) : undefined}
                              disabled={loadingCategories}
                            >
                              <FormControl>
                                <SelectTrigger error={fieldState?.error?.message}>
                                  <SelectValue placeholder={loadingCategories ? "Loading..." : "Select type"} />
                                </SelectTrigger>
                              </FormControl>
                              < SelectContent >
                                {loanCategories && loanCategories.length > 0 ? (
                                  loanCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>
                                    {loadingCategories ? "Loading..." : "No categories found"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          < FormMessage />
                        </FormItem>
                      )
                      }
                    />
                  </div>

                  < FormField
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        < FormControl >
                          <Input
                            type="number"
                            placeholder="Enter Loan Amount"
                            error={fieldState?.error?.message}
                            disabled={Boolean(form.watch("loanType"))}
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  < FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Interest Rate</FormLabel>
                        < FormControl >
                          <Input
                            type="number"
                            placeholder="Enter Interest Rate"
                            error={fieldState?.error?.message}
                            disabled={Boolean(form.watch("loanType"))}
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  < FormField
                    control={form.control}
                    name="paymentFrequency"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency </FormLabel>
                        < FormControl >
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            < SelectContent >
                              <SelectItem value="Monthly" > Monthly </SelectItem>
                              < SelectItem value="Weekly" > Weekly </SelectItem>
                              < SelectItem value="Daily" > Daily </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        < FormMessage />
                      </FormItem>
                    )}
                  />

                  < FormField
                    control={form.control}
                    name="branchId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Branch </FormLabel>
                        < FormControl >
                          <Select
                            onValueChange={value => field.onChange(Number(value))}
                            value={field.value !== undefined ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {
                                branches?.map((e) => (
                                  <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </FormControl>
                        < FormMessage />
                      </FormItem>
                    )}
                  />

                  < FormField
                    control={form.control}
                    name="groupId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Group </FormLabel>
                        < FormControl >
                          <Select
                            disabled={!form.getValues("branchId")}
                            onValueChange={value => field.onChange(Number(value))}
                            value={field.value !== undefined ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger error={fieldState?.error?.message}>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {
                                groups?.map((e) => (
                                  <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </FormControl>
                        < FormMessage />
                      </FormItem>
                    )}
                  />
                  < FormField
                    control={form.control}
                    name="groupMemberId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Member </FormLabel>
                        < SearchSelect
                          disabled={!form.getValues("groupId")}
                          error={fieldState?.error?.message}
                          options={
                            groupMembers.map((e) => {
                              return {
                                label: e.member?.fullNames || "Unknown Member",
                                value: e.id, // Use group member ID (number)
                              };
                            })
                          }
                          value={field.value}
                          setValue={value => field.onChange(Number(value))}
                          placeholder={"Select member"}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  < div className="col-span-2" >
                    <FormField
                      control={form.control}
                      name="loanTerms"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Loan Terms </FormLabel>
                          < FormControl >
                            <Textarea
                              placeholder="Enter Loan Terms"
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

        < SheetFooter className="border-t px-3 py-2.5 " >
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
          < Button
            disabled={form.formState.disabled || form.formState.isSubmitting}
            type="submit"
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
          >
            {
              form.formState.isSubmitting && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )
            }
            {record ? "Update Loan" : "Add Loan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Loan Category Tab Component
function LoanCategoryForm({ isOpen, setIsOpen, refetch, record }) {
  const { user } = useAuth();

  const form = useForm<z.infer<typeof loanCategorySchema>>({
    resolver: zodResolver(loanCategorySchema),
    values: record
      ? {
        name: record.name || "",
        description: record.description || "",
        defaultAmount: record.defaultAmount?.toString() || "",
        interestRate: record.interestRate?.toString() || "",
        maxAmount: record.maxAmount?.toString() || "",
        minAmount: record.minAmount?.toString() || "",
      }
      : {
        name: "",
        description: "",
        defaultAmount: "",
        interestRate: "",
        maxAmount: "",
        minAmount: "",
      },
  });

  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation(
    async (values: z.infer<typeof loanCategorySchema>) => {
      try {
        // Try to get branches, but don't fail if none exist
        let branchId = null;
        try {
          const branchesResponse = await api.get("/branches");
          const branches = branchesResponse.data.data?.results || [];
          branchId = branches.length > 0 ? branches[0].id : null;
          console.log("Available branches:", branches);
        } catch (branchError) {
          console.log("Could not fetch branches:", branchError);
        }

        const requestData = {
          ...values,
          defaultAmount: parseInt(values.defaultAmount),
          interestRate: parseFloat(values.interestRate),
          maxAmount: values.maxAmount ? parseInt(values.maxAmount) : undefined,
          minAmount: values.minAmount ? parseInt(values.minAmount) : undefined,
          branchId: user?.branch?.id || user?.branchId || branchId,
        };

        console.log("Creating loan category with data:", requestData);
        console.log("User data:", user);

        if (record && record.id) {
          // EDIT: send PATCH to /loan-categories/:id
          const response = await api.patch(`/loan-categories/${record.id}`, requestData);
          return response.data;
        } else {
          // CREATE: send POST to /loan-categories
          const response = await api.post("/loan-categories", requestData);
          return response.data;
        }
      } catch (error) {
        console.error("Error in createCategoryMutation:", error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast.success(record ? "Loan category updated successfully" : "Loan category created successfully");
        setIsOpen(false);
        form.reset();
        queryClient.invalidateQueries(["loan-categories"]);
        if (refetch) refetch();
      },
      onError: (error: any) => {
        console.error("Error creating loan category:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Error message:", error.response?.data?.message);
        console.error("Full error response:", JSON.stringify(error.response?.data, null, 2));
        toast.error(`Failed to ${record ? "update" : "create"} loan category: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  function onSubmit(values: z.infer<typeof loanCategorySchema>) {
    createCategoryMutation.mutate(values);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {record ? "Edit Loan Category" : "Add New Loan Category"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category name"
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
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter category description"
                        error={fieldState?.error?.message}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultAmount"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Default Amount (FRW)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter default amount"
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
                  name="interestRate"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter interest rate"
                          error={fieldState?.error?.message}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minAmount"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount (FRW)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter minimum amount"
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
                  name="maxAmount"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Maximum Amount (FRW)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter maximum amount"
                          error={fieldState?.error?.message}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isLoading}
                >
                  {createCategoryMutation.isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      {record ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    record ? "Update Category" : "Create Category"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LoanCategoryTab() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch loan categories from backend
  const { data, isLoading, error, refetch } = useQuery([
    "loan-categories"
  ], async () => {
    const { data } = await api.get("/loan-categories");
    return data?.data?.results || data?.data || [];
  });

  // Delete mutation
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(
    async (id) => {
      await api.delete(`/loan-categories/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["loan-categories"]);
        refetch();
      },
    }
  );

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsAddCategoryOpen(true);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete '${category.name}'?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  // Handler to clear selectedCategory and close form after edit/create
  const handleFormClose = () => {
    setIsAddCategoryOpen(false);
    setSelectedCategory(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Loan Categories</h3>
        <Button
          size="sm"
          onClick={() => {
            setSelectedCategory(null);
            setIsAddCategoryOpen(true);
          }}
        >
          <PlusCircle size={16} className="mr-2" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load categories</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data && data.length > 0 ? (
            data.map((category) => (
              <div key={category.id} className="border rounded-lg p-4 relative">
                {/* 3-dots menu */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(category)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h4 className="font-medium mb-2">{category.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{Number(category.interestRate).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Default Amount:</span>
                    <span className="font-medium">{Number(category.defaultAmount).toLocaleString()} FRW</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div>No loan categories found.</div>
          )}
        </div>
      )}

      <LoanCategoryForm
        isOpen={isAddCategoryOpen}
        setIsOpen={handleFormClose}
        refetch={refetch}
        record={selectedCategory}
      />
    </div>
  );
}

// Loan Request Tab Component
function LoanRequestTab({
  recordsQuery,
  columns,
  sorting,
  setSorting,
  setPagination,
  pageIndex,
  pageSize,
  setColumnFilters,
  columnFilters,
  setSearchText,
  newRecordModal
  // setRecordToEdit
}) {
  const { user } = useAuth();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Loan Requests</h3>
        {(user?.isAdmin || user?.role?.name === "President" || user?.role?.name === "Accountant" || user?.role?.name === "Secretary") && (
          <Button
            onClick={() => newRecordModal.open()}
            size="sm"
          >
            <PlusCircle size={16} className="mr-2" />
            <span>Add new Loan</span>
          </Button>
        )}
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
  );
}

// Reports Tab Component
function ReportsTab() {
  const { toPDF, targetRef } = usePDF({ filename: "loan-reports.pdf" });
  const [isExporting, setIsExporting] = useState(false);
  const { data: loanReports, isLoading, error } = useQuery(
    ["loan-reports"],
    async () => {
      try {
        const { data } = await api.get("/analytics/loan-reports");
        console.log("Loan reports data:", data);
        return data.data;
      } catch (err) {
        console.error("Error fetching loan reports:", err);
        throw err;
      }
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Optionally could fetch additional diagnostics here

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge variant="success">approved</Badge>;
      case "pending":
        return <Badge variant="warning">pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} FRW`;
  };

  const outstandingBalance = (loanReports?.totalAmount || 0) - (loanReports?.totalRepaid || 0);
  // const averageLoan = loanReports?.totalLoans ? Math.round((loanReports.totalAmount || 0) / loanReports.totalLoans) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Loan Reports</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Export PDF</Button>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Loan Reports</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Export PDF
            </Button>
            <Button variant="outline" size="sm" disabled>
              Export Excel
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading loan reports</p>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message || (error as any)?.message || "Please try again later"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      // Allow DOM to re-render without badges
      await new Promise((r) => setTimeout(r, 0));
      await toPDF();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    try {
      const rows = [
        ["Date", "Member", "Loan Type", "Amount (FRW)", "Status"],
        ...(loanReports?.recentLoans || []).map((loan: any) => [
          new Date(loan.createdAt).toLocaleDateString(),
          loan.memberName || "Unknown Member",
          loan.loanType,
          (loan.amount ?? 0).toString(),
          loan.status,
        ]),
      ];

      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `loan-reports-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV export error", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h3 className="text-lg font-semibold">Loan Reports</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={isExporting}>
            Download
          </Button>
        </div>
      </div>

      <div id="loan-report-print" ref={targetRef} className={`space-y-4 bg-white p-4 ${isExporting ? "export-mono" : ""}`}>
        <div className="space-y-4">
          {/* Top header with date and system info - only visible in PDF */}
          <div className={`flex items-start justify-between ${isExporting ? '' : 'hidden'}`}>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
            </div>
            <div className="text-sm text-muted-foreground">
              management system.
            </div>
          </div>

          {/* System branding - only visible in PDF */}
          <div className={`text-center ${isExporting ? '' : 'hidden'}`}>
            <h3 className="text-sm font-medium text-muted-foreground">ikimina | Loans & Payments</h3>
          </div>

          {/* Report title section - only visible in PDF */}
          <div className={`text-center ${isExporting ? '' : 'hidden'}`}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Report Details</h4>
            <h2 className="text-3xl font-bold tracking-tight">LOAN REPORT</h2>
          </div>

          {/* Divider - only visible in PDF */}
          <div className={`border-b ${isExporting ? '' : 'hidden'}`} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-xs font-medium text-muted-foreground">Total Loans</h4>
            <p className="text-lg font-bold">{loanReports?.totalLoans?.toLocaleString() || 0}</p>
            <p className="text-xs text-blue-600">All time loans</p>
          </div>

          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-xs font-medium text-muted-foreground">Active Loans</h4>
            <p className="text-lg font-bold">{loanReports?.activeLoans?.toLocaleString() || 0}</p>
            <p className="text-xs text-blue-600">{loanReports?.activePercentage || 0}% of total</p>
          </div>

          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-xs font-medium text-muted-foreground">Total Amount</h4>
            <p className="text-lg font-bold">{formatAmount(loanReports?.totalAmount || 0)}</p>
            <p className="text-xs text-green-600">Total loaned amount</p>
          </div>

          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-sm font-medium text-muted-foreground">Pending Approval</h4>
            <p className="text-lg font-bold">{loanReports?.pendingLoans?.toLocaleString() || 0}</p>
            <p className="text-xs text-orange-600">Requires attention</p>
          </div>

          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-xs font-medium text-muted-foreground">Total Repaid</h4>
            <p className="text-lg font-bold">{formatAmount(loanReports?.totalRepaid || 0)}</p>
            <p className="text-xs text-green-600">Paid back so far</p>
          </div>

          <div className="border rounded-lg p-3 print:border-0 print:shadow-none">
            <h4 className="text-xs font-medium text-muted-foreground">Outstanding Balance</h4>
            <p className="text-lg font-bold">{formatAmount(outstandingBalance)}</p>
            <p className="text-xs text-muted-foreground">Remaining to be repaid</p>
          </div>
        </div>

        <div className="border rounded-lg p-4 print:border-0 print:shadow-none">
          <h4 className="font-medium mb-4">Recent Loan Activity</h4>
          {loanReports?.recentLoans?.length > 0 ? (
            <table className="report-table w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Date</th>
                  <th>Member</th>
                  <th>Loan Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loanReports.recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                    <td>{loan.memberName || 'Unknown Member'}</td>
                    <td className="capitalize">{loan.loanType}</td>
                    <td>{(loan.amount ?? 0).toLocaleString()} FRW</td>
                    <td>{isExporting ? (loan.status || "") : getStatusBadge(loan.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No recent loan activity</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Member Loan History Component
function MemberLoanHistory({ memberId }: { memberId: number | null }) {
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    loanId: number | null;
    loanAmount: number;
    memberName: string;
    amount: string;
    paymentMethod: string;
    notes: string;
    totalLoanAmount: number;
    outstandingAmount: number;
    totalPaid: number;
    loanType: string;
    showSummary: boolean;
    transactionId: string;
    document: File | null;
  }>({
    isOpen: false,
    loanId: null,
    loanAmount: 0,
    memberName: "",
    amount: "",
    paymentMethod: "",
    notes: "",
    totalLoanAmount: 0,
    outstandingAmount: 0,
    totalPaid: 0,
    loanType: "",
    showSummary: true,
    transactionId: "",
    document: null,
  });

  console.log("MemberLoanHistory component received memberId:", memberId);

  const { data: memberLoans, isLoading } = useQuery(
    ["member-loans", memberId],
    async () => {
      if (!memberId) return [];
      console.log("Fetching loans for memberId:", memberId);

      const { data } = await api.get(`/loans`, {
        params: {
          filters: [
            {
              field: "groupMember.member.id",
              operator: "eq",
              value: memberId,
            },
          ],
        },
      });
      console.log("API response:", data);
      // Filter on client side for debugging
      const allLoans = data?.results || [];
      console.log("All loans:", allLoans);
      if (allLoans.length > 0) {
        console.log("First loan structure:", JSON.stringify(allLoans[0], null, 2));
      }

      const filteredLoans = allLoans.filter(loan => {
        console.log("Processing loan:", loan);
        console.log("Loan member field:", loan?.member);
        console.log("Loan groupMember field:", loan?.groupMember);

        const loanMemberId = loan?.groupMember?.member?.id;
        console.log("Loan memberId:", loanMemberId, "Looking for:", memberId);

        // Try different possible member ID fields
        const possibleMemberId = loan?.member?.id || loan?.groupMember?.member?.id || loan?.groupMemberId;
        console.log("Possible member ID:", possibleMemberId);

        return possibleMemberId === memberId;
      });

      console.log("Filtered loans:", filteredLoans);
      return filteredLoans;
    },
    {
      enabled: Boolean(memberId),
    }
  );

  // Fetch payment methods for the payment modal
  const { data: paymentMethods = [] } = useQuery(
    ["payment-methods"],
    async () => {
      const { data } = await api.get("/payment-methods");
      return data.results || [];
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!memberLoans || memberLoans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No loan history found for this member.
      </div>
    );
  }

  const totalBorrowed = memberLoans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
  const totalRepaid = memberLoans.reduce((sum, loan) => sum + Number(loan.totalPaid || 0), 0);
  const outstandingBalance = totalBorrowed - totalRepaid;
  // const averageLoan = totalBorrowed > 0 ? Math.round(totalBorrowed / memberLoans.length) : 0;

  // const handlePayment = (loan: any) => {
  //   setPaymentModal({
  //     isOpen: true,
  //     loanId: loan.id,
  //     loanAmount: loan.amount,
  //     memberName: loan.memberName || loan.member?.fullNames || "Unknown Member",
  //     amount: "",
  //     paymentMethod: "",
  //     notes: "",
  //     totalLoanAmount: Number(loan.amount || 0),
  //     outstandingAmount: Number(loan.dueAmount ?? loan.amount ?? 0),
  //     totalPaid: Number(loan.totalPaid || 0),
  //     loanType: loan.loanType || "Unknown",
  //     showSummary: true,
  //     transactionId: "",
  //     document: null,
  //   });
  // };

  // Open payment modal for overall outstanding amount (no specific loan selected yet)
  const handlePayAll = () => {
    const firstLoan = memberLoans?.[0];
    const derivedMemberName =
      firstLoan?.member?.fullNames || firstLoan?.memberName || "Unknown Member";
    setPaymentModal({
      isOpen: true,
      loanId: null,
      loanAmount: 0,
      memberName: derivedMemberName,
      amount: "",
      paymentMethod: "",
      notes: "",
      totalLoanAmount: outstandingBalance,
      outstandingAmount: outstandingBalance,
      totalPaid: totalRepaid,
      loanType: "All Loans",
      showSummary: true,
      transactionId: "",
      document: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Borrowed</h4>
          <p className="text-2xl font-bold">{totalBorrowed.toLocaleString()} FRW</p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Repaid</h4>
          <p className="text-2xl font-bold">{totalRepaid.toLocaleString()} FRW</p>
        </div>
        <div className="border rounded-lg p-4 flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Outstanding</h4>
            <p className="text-2xl font-bold">{outstandingBalance.toLocaleString()} FRW</p>
          </div>
          {memberLoans.some(loan => loan.status === 'approved') && (
            <Button size="sm" onClick={handlePayAll}>Pay Loan</Button>
          )}
        </div>
      </div>

      {/* Loan History Table */}
      <div>
        <h4 className="font-medium mb-4">Loan History</h4>
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Date</th>
                <th className="text-left p-3 text-sm font-medium">Loan Type</th>
                <th className="text-left p-3 text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Repaid</th>
                <th className="text-left p-3 text-sm font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {memberLoans.map((loan) => (
                <tr key={loan.id} className="border-b">
                  <td className="p-3 text-sm">
                    {new Date(loan.createdAt).toLocaleDateString()}
                  </td>image.png
                  <td className="p-3 text-sm capitalize">{loan.loanType}</td>
                  <td className="p-3 text-sm font-medium">
                    {loan.amount?.toLocaleString()} FRW
                  </td>
                  <td className="p-3 text-sm">
                    <Badge
                      variant={(
                        {
                          pending: "warning",
                          approved: "success",
                          rejected: "destructive",
                        }[loan.status as "pending" | "approved" | "rejected"] || "outline"
                      ) as "warning" | "success" | "destructive" | "outline"}
                    >
                      {loan.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">
                    {Number(loan.totalPaid || 0).toLocaleString()} FRW
                  </td>
                  <td className="p-3 text-sm font-medium">
                    {Number(loan.dueAmount ?? loan.amount ?? 0).toLocaleString()} FRW
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Payment Modal */}
      <Dialog open={paymentModal.isOpen} onOpenChange={(open) => setPaymentModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Loan Payment</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              Recording payment for {paymentModal.memberName} • {paymentModal.loanType} Loan
            </div>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* When opened from the overall Pay button, require selecting a specific loan */}
            {paymentModal.loanId === null && (
              <div>
                <label className="text-sm font-medium">Select Loan</label>
                <Select
                  value={paymentModal.loanId?.toString() || undefined}
                  onValueChange={(value) => {
                    const selected = memberLoans.find((l) => l.id === Number(value));
                    if (selected) {
                      setPaymentModal((prev) => ({
                        ...prev,
                        loanId: selected.id,
                        loanAmount: selected.amount,
                        totalLoanAmount: selected.amount,
                        outstandingAmount: selected.dueAmount || selected.amount,
                        totalPaid: selected.totalPaid || 0,
                        loanType: selected.loanType || "Unknown",
                        showSummary: true,
                        transactionId: "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a loan to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberLoans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id.toString()}>
                        {new Date(loan.createdAt).toLocaleDateString()} • {loan.loanType} • {loan.amount?.toLocaleString()} FRW
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Member</label>
                <p className="text-sm text-muted-foreground">{paymentModal.memberName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Loan Amount</label>
                <p className="text-sm text-muted-foreground font-semibold">{paymentModal.totalLoanAmount?.toLocaleString()} FRW</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount Already Paid</label>
                <p className="text-sm text-muted-foreground">{paymentModal.totalPaid?.toLocaleString()} FRW</p>
              </div>
              <div>
                <label className="text-sm font-medium">Outstanding Amount</label>
                <p className="text-sm text-muted-foreground font-semibold text-orange-600">{paymentModal.outstandingAmount?.toLocaleString()} FRW</p>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div>
              <label className="text-sm font-medium">Payment Progress</label>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${paymentModal.totalLoanAmount > 0 ? (paymentModal.totalPaid / paymentModal.totalLoanAmount) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{paymentModal.totalPaid?.toLocaleString()} FRW paid</span>
                  <span>{paymentModal.outstandingAmount?.toLocaleString()} FRW remaining</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Amount (FRW)</label>
              <Input
                type="number"
                placeholder="Enter payment amount"
                value={paymentModal.amount}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, amount: e.target.value }))}
                max={paymentModal.outstandingAmount}
                min="0"
                step="1000"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Outstanding: {paymentModal.outstandingAmount?.toLocaleString()} FRW</span>
                <button
                  type="button"
                  onClick={() => setPaymentModal(prev => ({ ...prev, amount: paymentModal.outstandingAmount.toString() }))}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Pay Full Amount
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select
                value={paymentModal.paymentMethod}
                onValueChange={(value) => setPaymentModal(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction ID field - only show for MOMO */}
            {paymentModal.paymentMethod && paymentMethods.find(m => m.id.toString() === paymentModal.paymentMethod)?.name === 'MOMO' && (
              <div>
                <label className="text-sm font-medium">Transaction ID</label>
                <Input
                  placeholder="Enter MoMo transaction ID"
                  value={paymentModal.transactionId || ''}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, transactionId: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Document/Receipt</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setPaymentModal(prev => ({ ...prev, document: e.target.files?.[0] || null }))}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload payment receipt or supporting document (PDF, Word, or Image files)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this payment"
                value={paymentModal.notes}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Payment Summary */}
            {paymentModal.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-900">Payment Summary</h4>
                  <button
                    type="button"
                    onClick={() => setPaymentModal(prev => ({ ...prev, showSummary: !prev.showSummary }))}
                    className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {paymentModal.showSummary ? 'Hide' : 'Show'} Summary
                  </button>
                </div>

                {paymentModal.showSummary && (
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Loan Amount:</span>
                      <span className="font-medium">{paymentModal.totalLoanAmount?.toLocaleString()} FRW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Already Paid:</span>
                      <span className="font-medium">{paymentModal.totalPaid?.toLocaleString()} FRW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Outstanding:</span>
                      <span className="font-medium">{paymentModal.outstandingAmount?.toLocaleString()} FRW</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1">
                      <span>Payment Amount:</span>
                      <span className="font-medium">-{Number(paymentModal.amount).toLocaleString()} FRW</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1">
                      <span className="font-semibold">Remaining After Payment:</span>
                      <span className="font-semibold text-blue-900">
                        {(paymentModal.outstandingAmount - Number(paymentModal.amount)).toLocaleString()} FRW
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const paymentAmount = Number(paymentModal.amount);

                  // Validate payment amount
                  if (paymentAmount <= 0) {
                    toast.error("Payment amount must be greater than 0");
                    return;
                  }

                  if (paymentAmount > paymentModal.outstandingAmount) {
                    toast.error("Payment amount cannot exceed outstanding amount");
                    return;
                  }

                  if (!paymentModal.loanId) {
                    toast.error("Please select a loan to pay");
                    return;
                  }

                  // Validate MOMO transaction ID if MOMO is selected
                  const selectedPaymentMethod = paymentMethods.find(m => m.id.toString() === paymentModal.paymentMethod);
                  if (selectedPaymentMethod?.name === 'MOMO' && !paymentModal.transactionId?.trim()) {
                    toast.error("Transaction ID is required for MOMO payments");
                    return;
                  }

                  await api.post(`/loans/${paymentModal.loanId}/payments`, {
                    amount: paymentAmount,
                    paymentMethodId: Number(paymentModal.paymentMethod),
                    notes: paymentModal.notes,
                    referenceNumber: paymentModal.transactionId || paymentModal.notes, // Use transaction ID as reference for MOMO
                  });

                  toast.success("Payment recorded successfully");
                  setPaymentModal(prev => ({ ...prev, isOpen: false }));
                  // Refetch the member loans data
                  window.location.reload(); // Simple refresh for now
                } catch (error) {
                  toast.error("Failed to record payment");
                  console.error("Payment error:", error);
                }
              }}
              disabled={!paymentModal.amount || !paymentModal.paymentMethod || !paymentModal.loanId}
              className="min-w-[120px]"
            >
              {paymentModal.amount && paymentModal.paymentMethod
                ? `Record ${Number(paymentModal.amount).toLocaleString()} FRW`
                : "Record Payment"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Loans() {
  const [recordToEdit, setRecordToEdit] = useState(undefined);
  const [activeTab, setActiveTab] = useState("loan-request");
  const { user } = useAuth();

  const columns: ColumnDef<any>[] = [
    ...(user?.isAdmin ? [{
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
    }] : []),
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate" >
            {row.getValue("createdAt")}
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
          <div className="flex items-center truncate gap-3" >
            {row.getValue("member")}
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
          <div className="flex items-center truncate gap-3" >
            {row.getValue("amount").toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    // total Paid
    {
      accessorKey: "totalPaid",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Paid" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3" >
            {row.getValue("totalPaid")?.toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    // Due Amount
    {
      accessorKey: "dueAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3" >
            {row.getValue("dueAmount")?.toLocaleString()} FRW
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
        const loan = row.original;

        return (
          <div className="flex flex-col gap-1" >
            {
              row.original?.status && (
                <Badge
                  // @ts-ignore
                  variant={
                    {
                      pending: "warning",
                      approved: "success",
                      rejected: "destructive",
                    }[status as "pending" | "approved" | "rejected"]
                  }
                >
                  {status as string}
                </Badge>
              )
            }
            {
              status === "pending" && (
                <div className="text-xs text-muted-foreground" >
                  {loan.approvals || 0} / 2 approvals
                </div>
              )
            }
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "loanType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Loan Type" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center capitalize gap-3" >
            {row.getValue("loanType")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "paymentFrequency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Frequency" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate" >
            {row.getValue("paymentFrequency")}
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
          <div className="flex items-center gap-3 truncate" >
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
          <div className="flex items-center gap-3 truncate" >
            {row.getValue("createdBy")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      id: "approval",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Approval" />
      ),
      cell: ({ row }) => {
        const loan = row.original;
        const { user } = useAuth();

        // Check if current user is a leader of this loan's group
        const isLeader = user?.role?.name === "President" ||
          user?.role?.name === "Accountant" ||
          user?.role?.name === "Secretary";

        const canApprove = loan.status === "pending" && isLeader;

        return (
          <div className="flex items-center gap-2" >
            {
              canApprove ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleApproveLoan(loan.id, "Approved")
                    }
                  >
                    <CheckCircle size={12} className="mr-1" />
                    Approve
                  </Button>
                  < Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() => handleApproveLoan(loan.id, "Rejected")
                    }
                  >
                    <XCircle size={12} className="mr-1" />
                    Reject
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground" >
                  {loan.status === "pending" ? "Waiting for leaders" : "Processed"}
                </span>
              )}
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
        <div className="flex items-center justify-center mt-1 gap-2" >
          <DropdownMenu>
            <DropdownMenuTrigger asChild >
              <Button variant="ghost" className="h-7 w-8 p-0" >
                <span className="sr-only" > Open menu </span>
                < MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            < DropdownMenuContent align="end" >
              <DropdownMenuLabel>Actions </DropdownMenuLabel>
              < DropdownMenuItem
                onClick={() => {
                  console.log("Row original data:", row.original);
                  console.log("Member ID from row:", row.original.memberId);
                  handleViewMemberDetails(
                    row.original.memberId,
                    row.original.member || row.original.memberName
                  );
                }}
              >

                View Details
              </DropdownMenuItem>
              < DropdownMenuItem
                onClick={() => {
                  setRecordToEdit(row?.original);
                }
                }
              >
                Update Loan
              </DropdownMenuItem>
              < DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Loan
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

  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    loanId: number | null;
    status: "Approved" | "Rejected" | null;
    notes: string;
  }>({
    isOpen: false,
    loanId: null,
    status: null,
    notes: "",
  });

  const [memberDetailsModal, setMemberDetailsModal] = useState<{
    isOpen: boolean;
    memberId: number | null;
    memberName: string;
  }>({
    isOpen: false,
    memberId: null,
    memberName: "",
  });

  const handleApproveLoan = async (loanId: number, status: "Approved" | "Rejected") => {
    setApprovalModal({
      isOpen: true,
      loanId,
      status,
      notes: "",
    });
  };

  const submitApproval = async () => {
    if (!approvalModal.loanId || !approvalModal.status) return;

    console.log("Submitting approval:", {
      loanId: approvalModal.loanId,
      status: approvalModal.status,
      notes: approvalModal.notes
    });

    try {
      const response = await api.post(`/loans/${approvalModal.loanId}/approve`, {
        status: approvalModal.status,
        notes: approvalModal.notes
      });
      console.log("Approval response:", response);
      toast.success(`Loan ${approvalModal.status.toLowerCase()} successfully`);
      recordsQuery.refetch();
      setApprovalModal({
        isOpen: false,
        loanId: null,
        status: null,
        notes: "",
      });
    } catch (error) {
      console.error("Approval error:", error);
      console.error("Error response:", error?.response);
      toast.error(error?.response?.data?.message || "Failed to process loan");
    }
  };

  const recordsQuery = useQuery({
    queryKey: [
      "loans",
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
      const { data } = await api.get(`/loans`, {
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
          console.log("Raw loan record:", e);
          console.log("Member data:", e?.member);
          console.log("GroupMember data:", e?.groupMember);

          // Count approvals and rejections
          const approvals = e?.verifications?.filter(v => v.status === "Approved")?.length || 0;
          const rejections = e?.verifications?.filter(v => v.status === "Rejected")?.length || 0;

          return {
            ...e,
            member: e?.member?.fullNames,
            group: e?.group?.name,
            createdBy: e?.createdBy?.name,
            createdAt: new Date(e?.createdAt).toLocaleDateString(),
            groupId: e?.group?.id,
            groupMemberId: e?.groupMember?.id,
            memberId: e?.member?.id || e?.groupMember?.member?.id,
            branchId: e?.branch?.id,
            totalPaid: Number(e.totalPaid || 0),
            dueAmount: Number(e.dueAmount || 0),
            progressPercent: e.progressPercent,
            approvals,
            rejections,
          };
        }),
        totalPages: data?.totalPages,
        meta: data?.results?.length && {
          createdAt: "TOTAL",
          amount: data?.results?.reduce((a, b) => a + Number(b?.amount || 0), 0),
          totalPaid: data?.results?.reduce(
            (a, b) => a + Number(b?.totalPaid || 0),
            0
          ),
          dueAmount: data?.results?.reduce(
            (a, b) => a + Number(b?.dueAmount || 0),
            0
          ),
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
      .delete(`/loans/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Loan deleted successfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const handleViewMemberDetails = (memberId: number, memberName: string) => {
    console.log("Opening member details for:", { memberId, memberName });
    setMemberDetailsModal({
      isOpen: true,
      memberId,
      memberName,
    });
  };

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`This will permanently delete the loan and cannot be undone.`}
        meta={confirmModal.meta}
        onConfirm={(meta) => {
          handleDelete(meta);
        }}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      {/* Approval Modal */}
      <Sheet open={approvalModal.isOpen} onOpenChange={(open) => setApprovalModal(prev => ({ ...prev, isOpen: open }))}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {approvalModal.status === "Approved" ? "Approve Loan" : "Reject Loan"}
            </SheetTitle>
          </SheetHeader>
          < div className="space-y-4 mt-4" >
            <div>
              <label className="text-sm font-medium" > Notes(Optional) </label>
              < Textarea
                placeholder="Add any notes about your decision..."
                value={approvalModal.notes}
                onChange={(e) => setApprovalModal(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          < SheetFooter className="mt-6" >
            <Button
              onClick={submitApproval}
              variant={approvalModal.status === "Approved" ? "default" : "destructive"}
            >
              {approvalModal.status === "Approved" ? "Approve" : "Reject"} Loan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="sm:px-2 px-2">
        <div className="flex items-center justify-between space-y-2 my-3 print:hidden">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Loans & Payments Management
            </h2>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 print:hidden">
            <TabsTrigger value="loan-category">Loan Category</TabsTrigger>
            <TabsTrigger value="loan-request">Loan Request</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="loan-category" className="mt-6">
            <LoanCategoryTab />
          </TabsContent>

          <TabsContent value="loan-request" className="mt-6">
            <LoanRequestTab
              recordsQuery={recordsQuery}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              setPagination={setPagination}
              pageIndex={pageIndex}
              pageSize={pageSize}
              setColumnFilters={setColumnFilters}
              columnFilters={columnFilters}
              setSearchText={setSearchText}
              newRecordModal={newRecordModal}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>

      < LoanForm
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

      {/* Member Details Modal */}
      <Dialog open={memberDetailsModal.isOpen} onOpenChange={(open) => setMemberDetailsModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="w-full max-w-5xl">
          <DialogHeader>
            <DialogTitle>Member Loan History - {memberDetailsModal.memberName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <MemberLoanHistory memberId={memberDetailsModal.memberId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}