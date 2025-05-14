import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import {
  MoreVertical,
  PlusCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
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
import * as z from "zod";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { useAuth } from "@/context/auth.context";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  fullNames: string;
}

interface ContributionData {
  id: number;
  member: Member;
  group: string;
  paymentMethod: string;
  receivedBy: string;
  createdAt: string;
  groupId: number;
  groupMemberId: number;
  paymentMethodId: number;
  receivedById: number;
  memberId: number;
  branchId: number;
  solidarityAmount: string;
  depositAmount: string;
  meta?: {
    isFooter: boolean;
  };
}

const formSchema = z.object({
  totalAmount: z.string().min(0, "Total amount must be a positive number"),
  depositAmount: z.string().min(0, "Deposit amount must be a positive number"),
  solidarityAmount: z
    .string()
    .min(0, "Solidarity amount must be a positive number"),
  groupMemberId: z.number().min(1, "Member is required"),
  groupId: z.string().min(1, "Group is required"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  branchId: z.string().min(1, "Branch is required"),
  contributionType: z.enum(["saving", "solidarity"]).optional(),
});

function ContributionForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
          ...record,
          totalAmount: (
            Number(record.depositAmount) + Number(record.solidarityAmount)
          ).toString(),
          depositAmount: record.depositAmount?.toString(),
          solidarityAmount: record.solidarityAmount?.toString(),
          groupMemberId: record.groupMemberId,
          groupId: record.groupId?.toString(),
          paymentMethodId: record.paymentMethodId?.toString(),
          branchId: record.branchId?.toString(),
          contributionType: record.depositAmount > 0 ? "saving" : "solidarity",
        }
      : {
          totalAmount: "0",
          depositAmount: "0",
          solidarityAmount: "0",
          groupMemberId: undefined,
          groupId: "",
          paymentMethodId: "",
          branchId: "",
          contributionType: undefined,
        },
  });

  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [numberOfShares, setNumberOfShares] = useState(0);
  const [availableGroupMembers, setAvailableGroupMembers] = useState([]);

  // Calculate shares and distribute amounts when total amount changes
  useEffect(() => {
    if (selectedGroup && form.watch("totalAmount")) {
      const totalAmount = parseFloat(form.watch("totalAmount") || "0");
      const solidarityAmount = selectedGroup.solidarityAmount;
      const pricePerShare = selectedGroup.pricePerShare;

      // Always set solidarity amount first
      form.setValue("solidarityAmount", solidarityAmount.toString());

      // Calculate remaining amount for shares
      const remainingAmount = totalAmount - solidarityAmount;

      // If remaining amount is positive, use it for shares
      if (remainingAmount > 0) {
        form.setValue("depositAmount", remainingAmount.toString());

        // Calculate shares
        if (pricePerShare > 0) {
          const shares = Math.floor(remainingAmount / pricePerShare);
          setNumberOfShares(shares);
        }
      } else {
        // If total amount is less than solidarity, put it all in solidarity
        form.setValue("solidarityAmount", totalAmount.toString());
        form.setValue("depositAmount", "0");
        setNumberOfShares(0);
      }
    }
  }, [form.watch("totalAmount"), selectedGroup]);

  // Fetch all members for search
  const { data: allMembers = [] } = useQuery(["all-members"], async () => {
    const { data } = await api.get(`/members`);
    return data.results;
  });

  // When a member is selected, update form values for branch and group
  useEffect(() => {
    if (selectedMember) {
      // Set branch directly from the member data
      if (selectedMember.branch?.id) {
        form.setValue("branchId", selectedMember.branch.id.toString());
      }

      // Reset groupId and groupMemberId when member changes
      form.setValue("groupId", "");
      form.setValue("groupMemberId", undefined);

      // Fetch the complete member data including group memberships
      api
        .get(`/members/${selectedMember.id}`)
        .then(({ data }) => {
          // Check if the member has group memberships
          if (
            data.data.groupMemberships &&
            data.data.groupMemberships.length > 0
          ) {
            // Store the group memberships for later use
            setAvailableGroupMembers(data.data.groupMemberships);
          } else {
            setAvailableGroupMembers([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching member details:", err);
          setAvailableGroupMembers([]);
        });
    }
  }, [selectedMember]);

  // Fetch groups for the selected branch
  const { data: groups = [] } = useQuery(
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

  // Handle group selection - find the correct groupMember record
  useEffect(() => {
    const groupId = form.getValues("groupId");
    if (groupId && selectedMember && availableGroupMembers.length > 0) {
      // Find the GroupMember that links this member with this group
      const groupMember = availableGroupMembers.find(
        (gm) => gm.group?.id.toString() === groupId
      );

      if (groupMember) {
        // Set the correct groupMemberId
        form.setValue("groupMemberId", groupMember.id);
      } else {
        // Clear groupMemberId if this member is not in this group
        form.setValue("groupMemberId", undefined);
        toast.warning(
          "This member is not part of the selected group. Please select a group this member belongs to."
        );
      }
    }
  }, [form.watch("groupId"), selectedMember, availableGroupMembers]);

  // Fetch detailed group info when a group is selected
  useEffect(() => {
    const groupId = form.getValues("groupId");
    if (groupId) {
      api
        .get(`/groups/${groupId}`)
        .then(({ data }) => {
          setSelectedGroup(data.data);
        })
        .catch((err) => {
          console.error("Error fetching group details:", err);
        });
    }
  }, [form.watch("groupId")]);

  // Handle contribution type change
  useEffect(() => {
    const contributionType = form.getValues("contributionType");

    if (selectedGroup && contributionType) {
      if (contributionType === "solidarity") {
        form.setValue("depositAmount", "0");
        form.setValue(
          "solidarityAmount",
          selectedGroup.solidarityAmount.toString()
        );
      } else if (contributionType === "saving") {
        form.setValue("solidarityAmount", "0");
        if (form.getValues("depositAmount") === "0") {
          // Calculate default amount based on minimum shares, but cap at 10 shares
          const defaultShares = Math.min(selectedGroup.minShares, 10);
          form.setValue(
            "depositAmount",
            (selectedGroup.pricePerShare * defaultShares).toString()
          );
        }
      }
    }
  }, [form.watch("contributionType"), selectedGroup]);

  useEffect(() => {
    if (record && allMembers.length > 0) {
      // Find and set the selected member from allMembers
      const member = allMembers.find(
        (m) => record.member && m.fullNames === record.member
      );
      if (member) {
        setSelectedMember(member);
      }

      // Set the selected group
      if (record.groupId) {
        api
          .get(`/groups/${record.groupId}`)
          .then(({ data }) => {
            setSelectedGroup(data.data);
          })
          .catch((err) => console.error("Error fetching group details:", err));
      }

      // If we have a groupMemberId, populate availableGroupMembers
      if (record.groupMemberId) {
        api
          .get(`/members/${record.member?.id || member?.id}`)
          .then(({ data }) => {
            if (
              data.data.groupMemberships &&
              data.data.groupMemberships.length > 0
            ) {
              setAvailableGroupMembers(data.data.groupMemberships);
            }
          })
          .catch((err) => console.error("Error fetching member details:", err));
      }
    }
  }, [record, allMembers]);

  // Fetch branches for dropdown
  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery(["payment-methods"], async () => {
    const { data } = await api.get("/payment-methods");
    return data.results;
  });

  // Function to handle member selection
  const handleMemberSelect = (memberId) => {
    const member = allMembers.find((m) => m.id === memberId);
    setSelectedMember(member);
    // Note: We don't set groupMemberId here anymore - it will be set when a group is selected
  };

  // Added: Function to fetch members for a specific group with proper handling of the API response structure
  const fetchGroupMembers = (groupId) => {
    if (!groupId) return;

    api
      .get(`/groups/${groupId}/members`)
      .then(({ data }) => {
        // Handle the nested structure correctly
        const mappedMembers = data.results.map((item) => item.groupMember);
        setAvailableGroupMembers(mappedMembers || []);
      })
      .catch((err) => {
        console.error("Error fetching group members:", err);
      });
  };

  // Added: Effect to fetch group members when switching to a new group without a selected member
  useEffect(() => {
    const groupId = form.watch("groupId");
    if (groupId && !selectedMember) {
      fetchGroupMembers(groupId);
    }
  }, [form.watch("groupId")]);

  // Update the useEffect for deposit amount changes
  useEffect(() => {
    if (selectedGroup && form.watch("contributionType") === "saving") {
      const depositAmount = parseFloat(form.watch("depositAmount") || "0");
      const pricePerShare = selectedGroup.pricePerShare;
      const minShares = selectedGroup.minShares;
      const maxShares = 10; // Hard limit of 10 shares

      if (pricePerShare > 0) {
        let shares = Math.floor(depositAmount / pricePerShare);

        // Enforce maximum shares
        if (shares > maxShares) {
          shares = maxShares;
          // Update deposit amount to match max shares
          form.setValue(
            "depositAmount",
            (maxShares * pricePerShare).toString()
          );
        }

        // Show validation for minimum shares
        if (shares < minShares) {
          toast.error(
            `Minimum ${minShares} shares required (${
              minShares * pricePerShare
            } deposit)`
          );
        }

        setNumberOfShares(shares);
      }
    }
  }, [
    form.watch("depositAmount"),
    selectedGroup,
    form.watch("contributionType"),
  ]);

  // Update the getShareValidationInfo function
  const getShareValidationInfo = () => {
    if (!selectedGroup || form.watch("contributionType") !== "saving") {
      return null;
    }

    const depositAmount = parseFloat(form.watch("depositAmount") || "0");
    const pricePerShare = selectedGroup.pricePerShare;
    const minShares = selectedGroup.minShares;
    const maxShares = 10; // Hard limit of 10 shares
    const shares = Math.floor(depositAmount / pricePerShare);

    if (shares < minShares) {
      return {
        isValid: false,
        message: `Minimum ${minShares} shares required (${
          minShares * pricePerShare
        } deposit)`,
      };
    }

    if (shares > maxShares) {
      return {
        isValid: false,
        message: `Maximum ${maxShares} shares allowed (${
          maxShares * pricePerShare
        } deposit)`,
      };
    }

    return {
      isValid: true,
      message: `${shares} shares at ${pricePerShare} per share`,
    };
  };

  const shareValidation = getShareValidationInfo();

  // Update the onSubmit function
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate that we have a proper groupMemberId
    if (!values.groupMemberId) {
      toast.error(
        "Invalid member-group relationship. Please ensure the member belongs to the selected group."
      );
      return;
    }

    // Check share limits if this is a saving contribution
    if (values.contributionType === "saving" && selectedGroup) {
      const depositAmount = parseFloat(values.depositAmount);
      const pricePerShare = selectedGroup.pricePerShare;
      const minShares = selectedGroup.minShares;
      const maxShares = 10; // Hard limit of 10 shares
      const shares = Math.floor(depositAmount / pricePerShare);

      if (shares < minShares) {
        toast.error(
          `Minimum ${minShares} shares required (${
            minShares * pricePerShare
          } deposit)`
        );
        return;
      }

      if (shares > maxShares) {
        toast.error(
          `Maximum ${maxShares} shares allowed (${
            maxShares * pricePerShare
          } deposit)`
        );
        return;
      }
    }

    const q = record
      ? api.patch(`/contributions/${record.id}`, values)
      : api.post("/contributions", { ...values, receivedById: user?.id });

    return q
      .then(() => {
        refetch();
        toast.success(
          record
            ? "Contribution updated successfully"
            : "Contribution created successfully"
        );
        setIsOpen(false);
        form.reset();
        setSelectedMember(null);
        setSelectedGroup(null);
        setAvailableGroupMembers([]);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedGroup && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex justify-between text-sm">
                  <span>Solidarity Amount:</span>
                  <span className="font-medium">
                    {form.watch("solidarityAmount")} FRW
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Deposit Amount:</span>
                  <span className="font-medium">
                    {form.watch("depositAmount")} FRW
                  </span>
                </div>
                {form.watch("depositAmount") !== "0" && (
                  <div className="flex justify-between text-sm">
                    <span>Number of Shares:</span>
                    <span className="font-medium">{numberOfShares} shares</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>{form.watch("totalAmount")} FRW</span>
                </div>
              </div>
            )}

            {/* Member search first */}
            <div className="mb-2">
              <FormItem>
                <FormLabel>Search Member</FormLabel>
                <SearchSelect
                  options={allMembers.map((member) => ({
                    label: `${member.fullNames} (${member.idNumber})`,
                    value: member.id,
                  }))}
                  value={selectedMember?.id}
                  setValue={(value) => {
                    handleMemberSelect(value);
                  }}
                  placeholder="Search for a member by name or ID"
                />
              </FormItem>
            </div>

            {/* Branch field - readonly when member is selected */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <FormControl>
                      <Select
                        disabled={Boolean(selectedMember)} // Disabled when member is selected
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear group when branch changes
                          form.setValue("groupId", "");
                          form.setValue("groupMemberId", undefined);
                          setSelectedGroup(null);
                          setAvailableGroupMembers([]);
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger error={fieldState?.error?.message}>
                            <SelectValue placeholder="Select Zone" />
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset contribution type and amount when group changes
                          form.setValue("contributionType", undefined);
                          form.setValue("depositAmount", "0");
                          form.setValue("solidarityAmount", "0");

                          // If we have no selected member yet, fetch all group members for this group
                          if (!selectedMember) {
                            fetchGroupMembers(value);
                          }
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger error={fieldState?.error?.message}>
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups?.map((group) => {
                            const isMemberGroup = availableGroupMembers.some(
                              (gm) =>
                                gm.group?.id.toString() === group.id.toString()
                            );
                            return (
                              <SelectItem
                                key={group.id}
                                value={group.id.toString()}
                                className={
                                  isMemberGroup ? "text-green-500" : ""
                                }
                              >
                                {group.name} {isMemberGroup ? "(Member)" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {form.watch("groupMemberId") === undefined &&
                      form.watch("groupId") && (
                        <div className="mt-1 text-xs text-red-500">
                          Selected member is not part of this group
                        </div>
                      )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Member selection when group is selected first */}
            {!selectedMember &&
              form.watch("groupId") &&
              availableGroupMembers.length > 0 && (
                <div className="mb-2">
                  <FormField
                    control={form.control}
                    name="groupMemberId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Select Member from Group</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            const selectedGroupMember =
                              availableGroupMembers.find(
                                (gm) => gm.id === parseInt(value)
                              );
                            if (selectedGroupMember?.member) {
                              setSelectedMember(selectedGroupMember.member);
                            }
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger error={fieldState?.error?.message}>
                              <SelectValue placeholder="Select member from group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableGroupMembers.map((groupMember) => (
                              <SelectItem
                                key={groupMember?.id}
                                value={groupMember?.id.toString() || ""}
                              >
                                {groupMember?.member?.fullNames || undefined}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

            {/* Add share info display for saving contributions */}
            {form.watch("contributionType") === "saving" && selectedGroup && (
              <div className="col-span-2 bg-gray-50 p-2 rounded border">
                <div className="text-sm">
                  <span className="font-medium">Share Information:</span>
                  <ul className="mt-1">
                    <div className="flex text-gray-700 justify-between bg-gray-100 py-2 px-1">
                      <li>Price per share: {selectedGroup.pricePerShare}</li>
                      <li>
                        Allowed shares: {selectedGroup.minShares} to 10 shares
                      </li>
                    </div>
                    <li
                      className={`${
                        shareValidation?.isValid
                          ? "text-green-500"
                          : "text-red-600"
                      }`}
                    >
                      Current selection: {numberOfShares} shares (
                      {shareValidation?.message})
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Contribution details */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field, fieldState }) => (
                  <FormItem className="col-span-2">
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
            </div>

            {/* Add the submit button */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                  setSelectedMember(null);
                  setSelectedGroup(null);
                  setAvailableGroupMembers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  form.formState.isSubmitting ||
                  !form.watch("groupMemberId") ||
                  (form.watch("contributionType") === "saving" &&
                    shareValidation &&
                    !shareValidation.isValid)
                }
                type="submit"
                size="sm"
              >
                {form.formState.isSubmitting && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                {record ? "Update Contribution" : "Add Contribution"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Contributions() {
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

  // Add separate queries for filter options
  const { data: members = [] } = useQuery(["members"], async () => {
    const { data } = await api.get("/members");
    console.log("Members data:", data); // Debug to see structure
    return data.results.map((member) => ({
      // Make sure these properties match what's available in your API response
      label: member.fullNames,
      value: member.id,
    }));
  });

  const { data: groups = [] } = useQuery(["groups"], async () => {
    const { data } = await api.get("/groups");
    return data.results.map((group) => ({
      label: group.name,
      value: group.name,
    }));
  });

  const { data: paymentMethods = [] } = useQuery(
    ["payment-methods"],
    async () => {
      const { data } = await api.get("/payment-methods");
      return data.results;
    }
  );

  const { data: users = [] } = useQuery(["users"], async () => {
    const { data } = await api.get("/users");
    return data.results.map((user) => ({
      label: user.name,
      value: user.name,
    }));
  });

  const recordsQuery = useQuery({
    queryKey: [
      "contributions",
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
              member: "member", // Just use "member" instead of "member.id"
              group: "group.name",
              paymentMethod: "paymentMethod.name",
              receivedBy: "receivedBy.name",
              createdAt: "createdAt",
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
                  endOfDay.toISOString(),
                ],
              };
            }

            // For member filter specifically
            if (filter.id === "member") {
              return {
                field: "member", // Just use "member" instead of "member.id"
                operator: "in",
                value: Array.isArray(filter.value)
                  ? filter.value.map((v) =>
                      typeof v === "object" ? v.value : v
                    )
                  : [filter.value],
              };
            }

            // For other filters
            return {
              field: fieldMap[filter.id] || filter.id,
              operator: "in",
              value: Array.isArray(filter.value)
                ? filter.value.map((v) => (typeof v === "object" ? v.value : v))
                : [filter.value],
            };
          }),
        }),
        sortBy: sorting[0]?.id || "createdAt",
        order: sorting[0]?.desc ? "DESC" : "ASC",
      };

      console.log("Final API params:", params);

      const { data } = await api.get(`/contributions`, { params });
      console.log("API Response:", data);

      // Verify if data.results exists and has content
      if (!data?.results || data.results.length === 0) {
        console.log("No data returned from API");
        return {
          items: [],
          totalPages: 0,
          meta: null,
        };
      }

      const totalDepositAmount = data?.results?.reduce(
        (a, b) => a + Number(b?.depositAmount || 0),
        0
      );
      const totalSolidarityAmount = data?.results?.reduce(
        (a, b) => a + Number(b?.solidarityAmount || 0),
        0
      );

      // Transform the API results into the format expected by the DataTable
      return {
        items: data?.results?.map((e) => ({
          ...e,
          member: e?.member, // Make sure member object is passed correctly
          group: e?.group?.name,
          paymentMethod: e?.paymentMethod?.name,
          receivedBy: e?.receivedBy?.name,
          createdAt: e?.createdAt,
          groupId: e?.group?.id,
          groupMemberId: e?.groupMember?.id,
          paymentMethodId: e?.paymentMethod?.id,
          receivedById: e?.receivedBy?.id,
          memberId: e?.member?.id,
          branchId: e?.branch?.id,
          solidarityAmount: e?.solidarityAmount || "0",
          depositAmount: e?.depositAmount || "0",
        })),
        totalPages: data?.totalPages,
        meta: data?.results?.length && {
          id: "TOTAL",
          depositAmount: totalDepositAmount,
          solidarityAmount: totalSolidarityAmount,
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
      .delete(`/contributions/${record.id}`)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Contribution deleted successfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const [selectedContribution, setSelectedContribution] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Add query for contribution details
  const contributionDetailsQuery = useQuery(
    ["contribution-details", selectedContribution?.id],
    async () => {
      if (!selectedContribution?.id) return null;
      const { data } = await api.get(
        `/contributions/${selectedContribution.id}`
      );
      return data.data;
    },
    {
      enabled: !!selectedContribution?.id,
    }
  );

  const columns: ColumnDef<ContributionData, unknown>[] = [
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
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return <div className="font-medium">TOTAL</div>;
        }
        return (
          <div className="flex items-center gap-3 truncate">
            #{row.getValue("id")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return null;
        }
        return (
          <div className="flex items-center gap-3 truncate">
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "member",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        const member = row.getValue("member") as Member;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member?.avatar} />
              <AvatarFallback>
                {member?.firstName?.[0]}
                {member?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => {
                setSelectedContribution(row.original);
                setIsViewDialogOpen(true);
              }}
              className="font-medium hover:underline"
            >
              {member?.firstName} {member?.lastName}
            </button>
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
        if (row.original.meta?.isFooter) {
          return null;
        }
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("group")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "depositAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Shares Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("depositAmount");
        return (
          <div className="flex items-center truncate gap-3">
            {Number(amount).toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "solidarityAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Solidarity Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("solidarityAmount");
        return (
          <div className="flex items-center truncate gap-3">
            {Number(amount).toLocaleString()} FRW
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Method" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return null;
        }
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("paymentMethod")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "receivedBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Received By" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return null;
        }
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("receivedBy")}
          </div>
        );
      },
      enableSorting: true,
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
                  setSelectedContribution(row.original);
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
                Update Contribution
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  confirmModal.open({ meta: row?.original });
                }}
              >
                Delete Contribution
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  React.useEffect(() => {
    console.log("Current pagination:", { pageIndex, pageSize });
    console.log("Current filters:", columnFilters);
  }, [pageIndex, pageSize, columnFilters]);

  // Add a function to handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((f) => f.id !== "createdAt");
        return [
          ...otherFilters,
          {
            id: "createdAt",
            value: [range.from, range.to],
          },
        ];
      });
    } else {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "createdAt"));
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Contributions</h1>
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
            Add Contribution
          </Button>
        </div>
      </div>

      <DataTable
        title="Contributions List"
        columns={columns}
        data={recordsQuery.data?.items || []}
        facets={[
          {
            name: "member",
            title: "Member",
            type: "select",
            options: members,
          },
          {
            name: "group",
            title: "Group",
            type: "select",
            options: groups,
          },
          {
            name: "paymentMethod",
            title: "Payment Method",
            type: "select",
            options:
              paymentMethods?.map((method) => ({
                label: method.name,
                value: method.name,
              })) || [],
          },
          {
            name: "receivedBy",
            title: "Received By",
            type: "select",
            options: users,
          },
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

      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`This will permanently delete the contribution and cannot be undone.`}
        meta={confirmModal.meta}
        onConfirm={(meta) => {
          handleDelete(meta);
        }}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      <ContributionForm
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl h-[90vh] md:h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">
              Contribution Details
            </DialogTitle>
          </DialogHeader>
          {contributionDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : contributionDetailsQuery.data ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
                {/* Left Column - Contribution Info */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Contribution Summary */}
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16 md:h-20 md:w-20">
                        <AvatarImage
                          src={contributionDetailsQuery.data.member?.avatar}
                        />
                        <AvatarFallback className="text-lg">
                          {contributionDetailsQuery.data.member?.firstName?.[0]}
                          {contributionDetailsQuery.data.member?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {contributionDetailsQuery.data.member?.fullNames}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Contribution ID: #{contributionDetailsQuery.data.id}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Deposit Amount
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data.depositAmount || 0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Solidarity Amount
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data.solidarityAmount ||
                              0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Current Savings
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data
                                .currentSavingAmount || 0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Current Solidarity
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data
                                .currentSolidalityAmount || 0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">
                      Payment Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payment Method
                        </p>
                        <p className="font-medium">
                          {contributionDetailsQuery.data.paymentMethod?.name}
                        </p>
                      </div>
                      {contributionDetailsQuery.data.paymentMethod
                        ?.accountNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Account Number
                          </p>
                          <p className="font-medium">
                            {
                              contributionDetailsQuery.data.paymentMethod
                                .accountNumber
                            }
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Received By
                        </p>
                        <p className="font-medium">
                          {contributionDetailsQuery.data.receivedBy?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {new Date(
                            contributionDetailsQuery.data.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Group & Season Info */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Group Information */}
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">
                      Group Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Group Name
                        </p>
                        <p className="font-medium">
                          {contributionDetailsQuery.data.group?.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Meeting Day
                          </p>
                          <p className="font-medium">
                            {contributionDetailsQuery.data.group?.meetingDay}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Meeting Time
                          </p>
                          <p className="font-medium">
                            {
                              contributionDetailsQuery.data.group
                                ?.meetingStartTime
                            }{" "}
                            -{" "}
                            {
                              contributionDetailsQuery.data.group
                                ?.meetingEndTime
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Price Per Share
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data.group
                                ?.pricePerShare || 0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Solidarity Amount
                          </p>
                          <p className="font-medium">
                            {(
                              contributionDetailsQuery.data.group
                                ?.solidarityAmount || 0
                            ).toLocaleString()}{" "}
                            FRW
                          </p>
                        </div>
                      </div>
                      {contributionDetailsQuery.data.group?.meetingLocation && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Meeting Location
                          </p>
                          <p className="font-medium">
                            {
                              contributionDetailsQuery.data.group
                                .meetingLocation
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Season Information */}
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">
                      Season Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Season Name
                        </p>
                        <p className="font-medium">
                          {contributionDetailsQuery.data.season?.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Date
                          </p>
                          <p className="font-medium">
                            {new Date(
                              contributionDetailsQuery.data.season?.start
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            End Date
                          </p>
                          <p className="font-medium">
                            {new Date(
                              contributionDetailsQuery.data.season?.end
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            contributionDetailsQuery.data.season?.status ===
                            "active"
                              ? "default"
                              : "secondary"
                          }
                          className={`${
                            contributionDetailsQuery.data.season?.status ===
                            "active"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          } shadow-none`}
                        >
                          {contributionDetailsQuery.data.season?.status}
                        </Badge>
                      </div>
                      {contributionDetailsQuery.data.season?.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Description
                          </p>
                          <p className="text-sm">
                            {contributionDetailsQuery.data.season.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fines Section */}
                  {contributionDetailsQuery.data.fines?.length > 0 && (
                    <div className="bg-card rounded-lg border p-4 md:p-6">
                      <h3 className="text-base font-semibold mb-4">Fines</h3>
                      <div className="space-y-4">
                        {contributionDetailsQuery.data.fines.map(
                          (fine, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Amount
                                  </p>
                                  <p className="font-medium">
                                    {(fine.amount || 0).toLocaleString()} FRW
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Reason
                                  </p>
                                  <p className="font-medium">{fine.reason}</p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No contribution details available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
