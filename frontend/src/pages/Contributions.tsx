import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Loader, MoreVertical, PlusCircle } from "lucide-react";
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
  depositAmount: z.string().min(0, "depositAmount must be a positive number"),
  groupMemberId: z.number().min(1, "Member is required"),
  groupId: z.string().min(1, "Group is required"),
  contributionType: z.enum(["solidarity", "saving"]),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  branchId: z.string().min(1, "Branch is required"),
});

function ContributionForm({ isOpen, setIsOpen, refetch, record }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: record
      ? {
          depositAmount: record.depositAmount?.toString(),
          groupMemberId: record.groupMemberId,
          groupId: record.groupId?.toString(),
          contributionType: record.contributionType,
          paymentMethodId: record.paymentMethodId?.toString(),
          branchId: record.branchId?.toString(),
        }
      : {
          depositAmount: "0",
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
  // Calculate shares when deposit amount or selected group changes
  useEffect(() => {
    if (
      selectedGroup &&
      form.watch("contributionType") === "saving" &&
      form.watch("depositAmount")
    ) {
      const depositAmount = parseFloat(form.watch("depositAmount") || "0");
      const pricePerShare = selectedGroup.pricePerShare;

      if (pricePerShare > 0) {
        const shares = Math.floor(depositAmount / pricePerShare);
        setNumberOfShares(shares);
      }
    }
  }, [
    form.watch("depositAmount"),
    selectedGroup,
    form.watch("contributionType"),
  ]);

  // Fetch all members for search
  const { data: allMembers = [] } = useQuery(["all-members"], async () => {
    const { data } = await api.get(`/members`);
    return data.results;
  });

  // When a member is selected, update form values for branch and group
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
    const groupId = form.watch("groupId");
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
    const groupId = form.watch("groupId");
    if (groupId) {
      api
        .get(`/groups/${groupId}`)
        .then(({ data }) => {
          setSelectedGroup(data.data);

          // If contribution type is already set, apply appropriate values
          const contributionType = form.watch("contributionType");
          if (contributionType === "solidarity") {
            form.setValue(
              "depositAmount",
              data.data.solidarityAmount.toString()
            );
          } else if (
            contributionType === "saving" &&
            form.watch("depositAmount") === "0"
          ) {
            // For saving, set to minimum shares amount as default
            form.setValue(
              "depositAmount",
              (data.data.pricePerShare * data.data.minShares).toString()
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching group details:", err);
        });
    }
  }, [form.watch("groupId")]);

  // Handle contribution type change
  useEffect(() => {
    const contributionType = form.watch("contributionType");

    if (selectedGroup && contributionType) {
      if (contributionType === "solidarity") {
        form.setValue(
          "depositAmount",
          selectedGroup.solidarityAmount.toString()
        );
      } else if (
        contributionType === "saving" &&
        form.watch("depositAmount") === "0"
      ) {
        // Default to minimum shares for new saving entries
        form.setValue(
          "depositAmount",
          (selectedGroup.pricePerShare * selectedGroup.minShares).toString()
        );
      }
    }
  }, [form.watch("contributionType"), selectedGroup]);

  useEffect(() => {
    if (record && allMembers.length > 0) {
      // Find and set the selected member from allMembers
      const member = allMembers.find(m => record.member && m.fullNames === record.member);
      if (member) {
        setSelectedMember(member);
      }
      
      // Set the selected group
      if (record.groupId) {
        api.get(`/groups/${record.groupId}`)
          .then(({ data }) => {
            setSelectedGroup(data.data);
          })
          .catch(err => console.error("Error fetching group details:", err));
      }
      
      // If we have a groupMemberId, populate availableGroupMembers
      if (record.groupMemberId) {
        api.get(`/members/${record.member?.id || member?.id}`)
          .then(({ data }) => {
            if (data.data.groupMemberships && data.data.groupMemberships.length > 0) {
              setAvailableGroupMembers(data.data.groupMemberships);
            }
          })
          .catch(err => console.error("Error fetching member details:", err));
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
      const shares = Math.floor(depositAmount / pricePerShare);

      if (shares < selectedGroup.minShares) {
        toast.error(
          `Minimum ${selectedGroup.minShares} shares required (${
            selectedGroup.minShares * pricePerShare
          } deposit)`
        );
        return;
      }

      if (shares > selectedGroup.maxShares) {
        toast.error(
          `Maximum ${selectedGroup.maxShares} shares allowed (${
            selectedGroup.maxShares * pricePerShare
          } deposit)`
        );
        return;
      }
    }

    console.log("Submitting contribution data:", values);

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

  // Check if deposit amount is valid based on contribution type
  const getShareValidationInfo = () => {
    if (!selectedGroup || form.watch("contributionType") !== "saving")
      return null;

    const depositAmount = parseFloat(form.watch("depositAmount") || "0");
    const pricePerShare = selectedGroup.pricePerShare;
    const shares = Math.floor(depositAmount / pricePerShare);

    if (shares < selectedGroup.minShares) {
      return {
        isValid: false,
        message: `Minimum ${selectedGroup.minShares} shares required`,
      };
    }

    if (shares > selectedGroup.maxShares) {
      return {
        isValid: false,
        message: `Maximum ${selectedGroup.maxShares} shares allowed`,
      };
    }

    return {
      isValid: true,
      message: `${shares} shares at ${pricePerShare} per share`,
    };
  };

  const shareValidation = getShareValidationInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle className="text-[15px]">
            {record ? "Update Contribution" : "Add New Contribution"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-3 pb-4 px-3"
            >
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
                      <FormLabel>Branch</FormLabel>
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset contribution type and amount when group changes
                            form.setValue("contributionType", undefined);
                            form.setValue("depositAmount", "0");

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
                                  gm.group?.id.toString() ===
                                  group.id.toString()
                              );
                              return (
                                <SelectItem
                                  key={group.id}
                                  value={group.id.toString()}
                                  className={isMemberGroup ? "text-green-500" : ""}
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
                                  value={groupMember?.id.toString()|| ""}
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

              {/* Contribution details */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="contributionType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Contribution Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Set default amount based on type if group is selected
                            if (selectedGroup) {
                              if (value === "solidarity") {
                                form.setValue(
                                  "depositAmount",
                                  selectedGroup.solidarityAmount.toString()
                                );
                              } else if (value === "saving") {
                                // Default to minimum shares for saving
                                const minSharesAmount =
                                  selectedGroup.pricePerShare *
                                  selectedGroup.minShares;
                                form.setValue(
                                  "depositAmount",
                                  minSharesAmount.toString()
                                );
                              }
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger error={fieldState?.error?.message}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solidarity">
                              Solidarity
                            </SelectItem>
                            <SelectItem value="saving">
                              Saving (Shares)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Deposit Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter Deposit Amount"
                          error={fieldState?.error?.message}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Share info display - only shown for saving contribution type */}
                {form.watch("contributionType") === "saving" &&
                  selectedGroup && (
                    <div className="col-span-2 bg-gray-50 p-2 rounded border">
                      <div className="text-sm">
                        <span className="font-medium">Share Information:</span>
                        <ul className="mt-1">
                          <div className="flex text-gray-700 justify-between bg-gray-100 py-2 px-1">
                          <li>
                            Price per share: {selectedGroup.pricePerShare}
                          </li>
                          <li>
                            Allowed shares: {selectedGroup.minShares} to{" "}
                            {selectedGroup.maxShares} shares
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

              {/* Group member status information */}
              {/* {form.watch("groupId") && (
                <div className="bg-blue-50 p-2 rounded border text-xs">
                  <div className="font-bold mb-1">Selection Status:</div>
                  <div>
                    {selectedMember && (
                      <div>• Member: {selectedMember.fullNames}</div>
                    )}
                    {form.watch("groupId") && (
                      <div>
                        • Group: {selectedGroup?.name || form.watch("groupId")}
                      </div>
                    )}
                    {form.watch("groupMemberId") ? (
                      <div className="text-green-600">
                        • Group Member ID: #{form.watch("groupMemberId")} (valid
                        selection)
                      </div>
                    ) : (
                      <div className="text-red-600">
                        • No valid member-group relationship selected
                      </div>
                    )}
                  </div>
                </div>
              )} */}
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="border-t px-3 py-2.5">
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
              form.formState.disabled ||
              form.formState.isSubmitting ||
              !form.watch("groupMemberId") ||
              (form.watch("contributionType") === "saving" &&
                shareValidation &&
                !shareValidation.isValid)
            }
            type="submit"
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
          >
            {form.formState.isSubmitting && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            {record ? "Update Contribution" : "Add Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Contributions() {
  const [recordToEdit, setRecordToEdit] = useState(undefined);
  const { user } = useAuth();
  console.log("user===",user)
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
      accessorKey: "depositAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Deposit Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center truncate gap-3">
            {row.getValue("depositAmount").toLocaleString()} FRW
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
      accessorKey: "contributionType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contribution Type" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center capitalize gap-3">
            {row.getValue("contributionType")}
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
          <div className="flex items-center gap-3 truncate">
            {row.getValue("paymentMethod")}
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
      accessorKey: "receivedBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Received By" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 truncate">
            {row.getValue("receivedBy")}
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
      const { data } = await api.get(`/contributions`, {
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
            group: e?.group?.name,
            paymentMethod: e?.paymentMethod?.name,
            receivedBy: e?.receivedBy?.name,
            createdAt: new Date(e?.createdAt).toLocaleDateString(),
            groupId: e?.group?.id,
            groupMemberId: e?.groupMember?.id,
            paymentMethodId: e?.paymentMethod?.id,
            branchId: e?.branch?.id,
          };
        }),
        totalPages: data?.totalPages,
        meta: data?.results?.length && {
          createdAt: "TOTAL",
          depositAmount: data?.results?.reduce(
            (a, b) => a + b?.depositAmount,
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

  return (
    <>
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

      <div className="sm:px-2 px-2">
        <div className="flex items-center justify-between space-y-2- my-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-[16px] font-semibold tracking-tight">
              Contributions Management
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
              <span>Add new Contribution</span>
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
    </>
  );
}
