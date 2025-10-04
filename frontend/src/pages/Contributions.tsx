import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useForm } from 'react-hook-form';
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import {
  MoreVertical,
  PlusCircle,
  Calendar as CalendarIcon,
  Loader,
  Download,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth.context";
import useModalState from "@/hooks/useModalState";
import useConfirmModal from "@/hooks/useConfirmModal";
import { useQuery } from "react-query";
import { usePDF } from "react-to-pdf";
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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import format from "date-fns/format";
import { DateRange } from "react-day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// Define interfaces
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
  totalAmount?: number;
  documentReceipt?: string;
  transactionId?: string;
  meta?: {
    isFooter: boolean;
  };
}

// Mock data for missing variables (replace with actual API calls or props as needed)
const members = [
  { label: "John Doe", value: "1" },
  { label: "Jane Smith", value: "2" },
];
const groups = [
  { label: "Group A", value: "1" },
  { label: "Group B", value: "2" },
];
const paymentMethods = [
  { id: "1", name: "Bank" },
  { id: "2", name: "MoMo" },
];
const users = [
  { label: "Admin", value: "1" },
  { label: "User", value: "2" },
];

// Form schema for ContributionForm
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
  documentReceipt: z.any().optional(),
  transactionId: z.string().optional(),
});


// MemberContributionsTable component
function MemberContributionsTable({
  memberId,
  onOpenContribution,
}: { memberId: number; onOpenContribution: (contribution: any) => void }) {
  const [isExporting, setIsExporting] = useState(false);

  const { data: memberContributions = [], isLoading } = useQuery(
    ["member-contributions", memberId],
    async () => {
      const { data } = await api.get(`/contributions`, {
        params: {
          page_size: 1000,
          page: 1,
          filters: [
            {
              field: "member",
              operator: "in",
              value: [memberId],
            },
          ],
          sortBy: "createdAt",
          order: "DESC",
        },
      });
      const results = data?.results || [];
      return Array.isArray(results)
        ? results.filter((c) => c?.member?.id === memberId)
        : [];
    },
    { enabled: !!memberId }
  );

  const { toPDF, targetRef } = usePDF({
    filename: `contributions_${memberContributions?.[0]?.member?.fullNames?.replace(/\s+/g, '_') || 'member'}_${new Date().toISOString().split('T')[0]}.pdf`,
  });

  const downloadReport = async () => {
    if (memberContributions.length === 0) return;
    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 0));
      await toPDF();
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {memberContributions.length} contribution{memberContributions.length !== 1 ? 's' : ''} found
        </div>
        <Button
          onClick={downloadReport}
          disabled={memberContributions.length === 0 || isExporting}
          size="sm"
          variant="outline"
        >
          {isExporting ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? "Generating PDF..." : "Download Report"}
        </Button>
      </div>
      <div ref={targetRef} className={`space-y-4 bg-white p-4 ${isExporting ? "export-mono" : ""}`}>
        <div className={`space-y-4 ${isExporting ? '' : 'hidden'}`}>
          <div className="flex items-start justify-between">
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
            </div>
            <div className="text-sm text-muted-foreground">
              ikimina management system.
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground">ikimina | Contributions & Payments</h3>
          </div>
          <div className="text-center">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Member Contributions Report</h4>
            <h2 className="text-3xl font-bold tracking-tight">
              {memberContributions[0]?.member?.fullNames?.toUpperCase() || 'MEMBER'} CONTRIBUTIONS
            </h2>
          </div>
          <div className="border-b" />
        </div>
        {/* Add total amount and total solidarity above the table */}
        <div className="mb-2 flex justify-end gap-8">
          <div className="text-right">
            <span className="font-semibold">Total Amount: </span>
            <span>
              {memberContributions.reduce((total, c) =>
                total + Number(c.depositAmount || 0) + Number(c.solidarityAmount || 0), 0
              ).toLocaleString()} FRW
            </span>
          </div>
          <div className="text-right">
            <span className="font-semibold">Total Solidarity: </span>
            <span>
              {memberContributions.reduce((total, c) =>
                total + Number(c.solidarityAmount || 0), 0
              ).toLocaleString()} FRW
            </span>
          </div>
        </div>
        <div className="border rounded-md">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px] font-semibold">ID</TableHead>
                <TableHead className="w-[120px] font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Group</TableHead>
                <TableHead className="font-semibold">Payment Method</TableHead>
                <TableHead className="text-right w-[160px] font-semibold">Amount</TableHead>
                <TableHead className="text-right w-[160px] font-semibold">Total Solidarity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberContributions.map((c, index) => (
                <TableRow
                  key={c.id}
                  className={`cursor-pointer ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                  onClick={() => onOpenContribution(c)}
                >
                  <TableCell className="w-[80px] font-medium">#{c.id}</TableCell>
                  <TableCell className="w-[140px]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{c.group?.name || "-"}</TableCell>
                  <TableCell>{c.paymentMethod?.name || "-"}</TableCell>
                  <TableCell className="text-right w-[160px] font-medium">
                    {Number(c.depositAmount || 0).toLocaleString()} FRW
                  </TableCell>
                  <TableCell className="text-right w-[160px] font-medium">
                    {Number(c.solidarityAmount || 0).toLocaleString()} FRW
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className={`space-y-4 ${isExporting ? '' : 'hidden'}`}>
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Contributions:</p>
                <p className="text-muted-foreground">{memberContributions.length}</p>
              </div>
              <div>
                <p className="font-medium">Total Amount:</p>
                <p className="text-muted-foreground">
                  {memberContributions.reduce((total, c) =>
                    total + Number(c.depositAmount || 0) + Number(c.solidarityAmount || 0), 0
                  ).toLocaleString()} FRW
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Deposit Amount:</p>
                <p className="text-muted-foreground">
                  {memberContributions.reduce((total, c) =>
                    total + Number(c.depositAmount || 0), 0
                  ).toLocaleString()} FRW
                </p>
              </div>
              <div>
                <p className="font-medium">Total Solidarity Amount:</p>
                <p className="text-muted-foreground">
                  {memberContributions.reduce((total, c) =>
                    total + Number(c.solidarityAmount || 0), 0
                  ).toLocaleString()} FRW
                </p>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ContributionForm component
function ContributionForm({ isOpen, setIsOpen, refetch, record }) {
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: record
      ? {
        ...record,
        totalAmount: (
          Number(record.depositAmount || 0) + Number(record.solidarityAmount || 0)
        ).toString(),
        depositAmount: record.depositAmount?.toString() || "0",
        solidarityAmount: record.solidarityAmount?.toString() || "0",
        groupMemberId: record.groupMemberId,
        groupId: record.groupId?.toString() || "",
        paymentMethodId: record.paymentMethodId?.toString() || "",
        branchId: record.branchId?.toString() || "",
        contributionType: record.depositAmount > 0 ? "saving" : "solidarity",
        documentReceipt: record.documentReceipt || null,
        transactionId: record.transactionId || "",
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
        documentReceipt: null,
        transactionId: ""
      }
    });

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [numberOfShares, setNumberOfShares] = useState(0);
  const [availableGroupMembers, setAvailableGroupMembers] = useState([]);

  useEffect(() => {
    if (selectedGroup && form.watch("totalAmount")) {
      const totalAmount = parseFloat(form.watch("totalAmount") || "0");
      const solidarityAmount = selectedGroup.solidarityAmount;
      const pricePerShare = selectedGroup.pricePerShare;
      form.setValue("solidarityAmount", solidarityAmount.toString());
      const remainingAmount = totalAmount - solidarityAmount;
      if (remainingAmount > 0) {
        form.setValue("depositAmount", remainingAmount.toString());
        if (pricePerShare > 0) {
          const shares = Math.floor(remainingAmount / pricePerShare);
          setNumberOfShares(shares);
        }
      } else {
        form.setValue("solidarityAmount", totalAmount.toString());
        form.setValue("depositAmount", "0");
        setNumberOfShares(0);
      }
    }
  }, [form.watch("totalAmount"), selectedGroup]);

  const { data: allMembers = [] } = useQuery(["all-members"], async () => {
    const { data } = await api.get(`/members`);
    return data.results;
  });

  useEffect(() => {
    if (selectedMember) {
      if (selectedMember.branch?.id) {
        form.setValue("branchId", selectedMember.branch.id.toString());
      }
      form.setValue("groupId", "");
      form.setValue("groupMemberId", undefined);
      api
        .get(`/members/${selectedMember.id}`)
        .then(({ data }) => {
          if (data.data.groupMemberships && data.data.groupMemberships.length > 0) {
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

  const { data: groups = [] } = useQuery(
    ["groups", { branch: form.watch("branchId") }],
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
    { enabled: Boolean(form.watch("branchId")) }
  );

  useEffect(() => {
    const groupId = form.getValues("groupId");
    if (groupId && selectedMember && availableGroupMembers.length > 0) {
      const groupMember = availableGroupMembers.find(
        (gm) => gm.group?.id.toString() === groupId
      );
      if (groupMember) {
        form.setValue("groupMemberId", groupMember.id);
      } else {
        form.setValue("groupMemberId", undefined);
        toast.warning("This member is not part of the selected group.");
      }
    }
  }, [form.watch("groupId"), selectedMember, availableGroupMembers]);

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

  useEffect(() => {
    const contributionType = form.getValues("contributionType");
    if (selectedGroup && contributionType) {
      if (contributionType === "solidarity") {
        form.setValue("depositAmount", "0");
        form.setValue("solidarityAmount", selectedGroup.solidarityAmount.toString());
      } else if (contributionType === "saving") {
        form.setValue("solidarityAmount", "0");
        if (form.getValues("depositAmount") === "0") {
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
      const member = allMembers.find(
        (m) => record.member && m.fullNames === record.member
      );
      if (member) {
        setSelectedMember(member);
      }
      if (record.groupId) {
        api
          .get(`/groups/${record.groupId}`)
          .then(({ data }) => {
            setSelectedGroup(data.data);
          })
          .catch((err) => console.error("Error fetching group details:", err));
      }
      if (record.groupMemberId) {
        api
          .get(`/members/${record.member?.id || member?.id}`)
          .then(({ data }) => {
            if (data.data.groupMemberships && data.data.groupMemberships.length > 0) {
              setAvailableGroupMembers(data.data.groupMemberships);
            }
          })
          .catch((err) => console.error("Error fetching member details:", err));
      }
    }
  }, [record, allMembers]);

  const { data: branches } = useQuery(["branches"], async () => {
    const { data } = await api.get("/branches");
    return data.results;
  });

  const { data: paymentMethods } = useQuery(["payment-methods"], async () => {
    const { data } = await api.get("/payment-methods");
    return data.results;
  });

  const handleMemberSelect = (memberId) => {
    const member = allMembers.find((m) => m.id === memberId);
    setSelectedMember(member);
  };

  const fetchGroupMembers = (groupId) => {
    if (!groupId) return;
    api
      .get(`/groups/${groupId}/members`)
      .then(({ data }) => {
        const mappedMembers = data.results.map((item) => item.groupMember);
        setAvailableGroupMembers(mappedMembers || []);
      })
      .catch((err) => {
        console.error("Error fetching group members:", err);
      });
  };

  useEffect(() => {
    const groupId = form.watch("groupId");
    if (groupId && !selectedMember) {
      fetchGroupMembers(groupId);
    }
  }, [form.watch("groupId")]);

  useEffect(() => {
    if (selectedGroup && form.watch("contributionType") === "saving") {
      const depositAmount = parseFloat(form.watch("depositAmount") || "0");
      const pricePerShare = selectedGroup.pricePerShare;
      const minShares = selectedGroup.minShares;
      const maxShares = 10;
      if (pricePerShare > 0) {
        let shares = Math.floor(depositAmount / pricePerShare);
        if (shares > maxShares) {
          shares = maxShares;
          form.setValue("depositAmount", (maxShares * pricePerShare).toString());
        }
        if (shares < minShares) {
          toast.error(`Minimum ${minShares} shares required (${minShares * pricePerShare} deposit)`);
        }
        setNumberOfShares(shares);
      }
    }
  }, [form.watch("depositAmount"), selectedGroup, form.watch("contributionType")]);

  const getShareValidationInfo = () => {
    if (!selectedGroup || form.watch("contributionType") !== "saving") {
      return null;
    }
    const depositAmount = parseFloat(form.watch("depositAmount") || "0");
    const pricePerShare = selectedGroup.pricePerShare;
    const minShares = selectedGroup.minShares;
    const maxShares = 10;
    const shares = Math.floor(depositAmount / pricePerShare);
    if (shares < minShares) {
      return {
        isValid: false,
        message: `Minimum ${minShares} shares required (${minShares * pricePerShare} deposit)`,
      };
    }
    if (shares > maxShares) {
      return {
        isValid: false,
        message: `Maximum ${maxShares} shares allowed (${maxShares * pricePerShare} deposit)`,
      };
    }
    return {
      isValid: true,
      message: `${shares} shares at ${pricePerShare} per share`,
    };
  };

  const shareValidation = getShareValidationInfo();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.groupMemberId) {
      toast.error("Invalid member-group relationship.");
      return;
    }
    if (values.contributionType === "saving" && selectedGroup) {
      const depositAmount = parseFloat(values.depositAmount);
      const pricePerShare = selectedGroup.pricePerShare;
      const minShares = selectedGroup.minShares;
      const maxShares = 10;
      const shares = Math.floor(depositAmount / pricePerShare);
      if (shares < minShares) {
        toast.error(`Minimum ${minShares} shares required (${minShares * pricePerShare} deposit)`);
        return;
      }
      if (shares > maxShares) {
        toast.error(`Maximum ${maxShares} shares allowed (${maxShares * pricePerShare} deposit)`);
        return;
      }
    }
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key === 'documentReceipt' && values[key] instanceof File) {
        formData.append('documentReceipt', values[key]);
      } else if (values[key] !== null && values[key] !== undefined) {
        formData.append(key, values[key].toString());
      }
    });
    if (!record) {
      formData.append('receivedById', user?.id?.toString() || '');
    }
    const q = record
      ? api.patch(`/contributions/${record.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      : api.post("/contributions", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return q
      .then(() => {
        refetch();
        toast.success(record ? "Contribution updated successfully" : "Contribution created successfully");
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
          form.setError(field, { message: errors[field] });
        });
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-2">
              <FormItem>
                <FormLabel>Search Member</FormLabel>
                <SearchSelect
                  options={allMembers.map((member) => ({
                    label: `${member.fullNames} (${member.idNumber})`,
                    value: member.id,
                  }))}
                  value={selectedMember?.id}
                  setValue={(value) => handleMemberSelect(value)}
                  placeholder="Search for a member by name or ID"
                />
              </FormItem>
            </div>
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
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedGroup && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="mb-2">
                  <span className="text-sm font-medium">Summary</span>
                </div>
                <div className="space-y-1 text-sm font-medium">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="text-primary">{form.watch("totalAmount")} FRW</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span>Amount per share:</span>
                    <span className="text-primary">{selectedGroup?.pricePerShare ? selectedGroup.pricePerShare + " FRW" : "-"}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span>Solidarity:</span>
                    <span className="text-primary">{form.watch("solidarityAmount")} FRW</span>
                  </div>
                  <hr />
                  {selectedGroup?.pricePerShare > 0 && (
                    <div className="flex justify-between">
                      <span>Shares:</span>
                      <span className="text-primary">{numberOfShares}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Select
                        disabled={Boolean(selectedMember)}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("groupId", "");
                          form.setValue("groupMemberId", undefined);
                          setSelectedGroup(null);
                          setAvailableGroupMembers([]);
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger error={fieldState?.error?.message}>
                            <SelectValue placeholder="Select Sector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches?.map((e) => (
                            <SelectItem key={e.id} value={e.id?.toString() || "0"}>
                              {e.name || "Unnamed Branch"}
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
                          form.setValue("contributionType", undefined);
                          form.setValue("depositAmount", "0");
                          form.setValue("solidarityAmount", "0");
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
                              (gm) => gm.group?.id.toString() === group.id.toString()
                            );
                            return (
                              <SelectItem
                                key={group.id}
                                value={group.id?.toString() || "0"}
                                className={isMemberGroup ? "text-green-500" : ""}
                              >
                                {group.name || "Unnamed Group"} {isMemberGroup ? "(Member)" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {form.watch("groupMemberId") === undefined && form.watch("groupId") && (
                      <div className="mt-1 text-xs text-red-500">
                        Selected member is not part of this group
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!selectedMember && form.watch("groupId") && availableGroupMembers.length > 0 && (
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
                          const selectedGroupMember = availableGroupMembers.find(
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
                              value={groupMember?.id?.toString() || "0"}
                            >
                              {groupMember?.member?.fullNames || "Unknown Member"}
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
            {form.watch("contributionType") === "saving" && selectedGroup && (
              <div className="col-span-2 bg-gray-50 p-2 rounded border">
                <div className="text-sm">
                  <span className="font-medium">Share Information:</span>
                  <ul className="mt-1">
                    <div className="flex text-gray-700 justify-between bg-gray-100 py-2 px-1">
                      <li>Price per share: {selectedGroup.pricePerShare}</li>
                      <li className={`${shareValidation?.isValid ? "text-green-500" : "text-red-600"}`}>
                        Allowed shares: {selectedGroup.minShares} to 10 shares
                      </li>
                    </div>
                    <li className={`${shareValidation?.isValid ? "text-green-500" : "text-red-600"}`}>
                      Current selection: {numberOfShares} shares ({shareValidation?.message})
                    </li>
                  </ul>
                </div>
              </div>
            )}
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
                            <SelectItem key={e.id} value={e.id?.toString() || "0"}>
                              {e.name || "Unnamed Payment Method"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(() => {
                const selectedPaymentMethod = paymentMethods?.find(
                  (method) => method.id?.toString() === form.watch("paymentMethodId")
                );
                const isBank = selectedPaymentMethod?.name?.toLowerCase().includes("bank");
                const isMoMo = selectedPaymentMethod?.name?.toLowerCase().includes("momo");
                return (
                  <>
                    {isBank && (
                      <FormField
                        control={form.control}
                        name="documentReceipt"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Document/Receipt</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    field.onChange(file);
                                  }}
                                  className="cursor-pointer"
                                />
                                {field.value && (
                                  <div className="text-sm text-muted-foreground">
                                    Selected file: {field.value.name}
                                  </div>
                                )}
                                {record?.documentReceipt && !field.value && (
                                  <div className="text-sm text-muted-foreground">
                                    Current file: {record.documentReceipt}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {isMoMo && (
                      <FormField
                        control={form.control}
                        name="transactionId"
                        render={({ field, fieldState }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Transaction ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter MoMo transaction ID"
                                error={fieldState?.error?.message}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                );
              })()}
            </div>
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
                  (form.watch("contributionType") === "saving" && shareValidation && !shareValidation.isValid)
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

// Main Contributions component
export default function Contributions() {
  const { user } = useAuth();
  const newRecordModal = useModalState();
  const confirmModal = useConfirmModal();
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [allGroupMemberships, setAllGroupMemberships] = useState<any[]>([]);
  // Fetch all members for mapping Excel rows
  const { data: allMembers = [] } = useQuery(["all-members"], async () => {
    const { data } = await api.get(`/members`);
    return data.results;
  });
  // All hooks should be declared at the top
  const [isExcelDialogOpen, setExcelDialogOpen] = useState(false);
  useEffect(() => {
    if (isExcelDialogOpen) {
      api.get('/members?limit=10000').then(({ data }) => {
        const all = [];
        (data.results || []).forEach(member => {
          if (member.groupMemberships && member.groupMemberships.length > 0) {
            member.groupMemberships.forEach(gm => {
              all.push({ ...gm, member });
            });
          }
        });
        setAllGroupMemberships(all);
      }).catch(err => {
        setAllGroupMemberships([]);
        console.error('Failed to fetch all group memberships', err);
      });
    }
  }, [isExcelDialogOpen]);
  // Helper: Map Excel row to backend payload
  function mapExcelRowToPayload(row) {
    // Find member by name
    // Improved matching: ignore case, trim, allow partial match
    const excelName = (row.Member || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const member = allMembers?.find(m => {
      const dbName = (m.fullNames || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return dbName === excelName || dbName.includes(excelName) || excelName.includes(dbName);
    });
    if (!member) return { error: `Member not found: ${row.Member}` };

    // Find group by name
    // Improved matching: ignore case, trim, allow partial match
    const excelGroup = (row.Group || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const group = groups?.find(g => {
      const dbGroup = (g.label || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return dbGroup === excelGroup || dbGroup.includes(excelGroup) || excelGroup.includes(dbGroup);
    });
    if (!group) return { error: `Group not found: ${row.Group}` };

    // Find group membership for this member and group from allGroupMemberships
    const groupMember = allGroupMemberships?.find(gm =>
      gm.member?.id === member.id && gm.group?.id?.toString() === group.value
    );
    if (!groupMember) return { error: `Group membership not found for member ${row.Member} in group ${row.Group}` };

    // Find branch (from member)
    const branchId = member.branch?.id || '';
    if (!branchId) return { error: `Branch not found for member: ${row.Member}` };

    // Find payment method by name
    const paymentMethod = paymentMethods?.find(pm => (pm.name || '').trim().toLowerCase() === (row.PaymentMethod || '').trim().toLowerCase());
    if (!paymentMethod) return { error: `Payment method not found: ${row.PaymentMethod}` };

    // Split totalAmount if needed
    const depositAmount = row['Total Amount'] || row.Amount || '0';
    const solidarityAmount = '0'; // Adjust if you have solidarity in Excel

    return {
      groupMemberId: groupMember.id,
      depositAmount,
      solidarityAmount,
      paymentMethodId: paymentMethod.id,
      branchId,
      receivedById: user?.id || null,
      transactionId: row.TransactionId || '',
      documentReceipt: row.DocumentReceipt || '',
    };
  }
  const [recordToEdit, setRecordToEdit] = useState(undefined);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const debounceTimeout = useRef(null);
  const [columnFilters, setColumnFilters] = useState([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<Member | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  const { pageIndex, pageSize } = pagination;

  // Debounce searchText changes
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms debounce
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchText]);

  const recordsQuery = useQuery({
    queryKey: [
      "contributions",
      { search: debouncedSearchText, filter: columnFilters, sort: sorting, pageIndex, pageSize },
    ],
    keepPreviousData: true,
    queryFn: async () => {
      // Build params for API
      const params: any = {
        page_size: pageSize,
        page: pageIndex + 1,
        sortBy: sorting[0]?.id || "createdAt",
        order: sorting[0]?.desc ? "DESC" : "ASC",
      };
      if (searchText) params.search = searchText;
      if (columnFilters.length > 0) {
        params.filters = columnFilters.map((filter) => {
          const fieldMap = {
            member: "member",
            group: "group.name",
            paymentMethod: "paymentMethod.name",
            receivedBy: "receivedBy.name",
            createdAt: "createdAt",
          };
          if (filter.id === "createdAt" && filter.value?.length === 2) {
            const [startDate, endDate] = filter.value;
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            return {
              field: fieldMap[filter.id],
              operator: "between",
              value: [new Date(startDate).toISOString(), endOfDay.toISOString()],
            };
          }
          if (filter.id === "member") {
            return {
              field: "member",
              operator: "in",
              value: Array.isArray(filter.value)
                ? filter.value.map((v) => (typeof v === "object" ? v.value : v))
                : [filter.value],
            };
          }
          return {
            field: fieldMap[filter.id] || filter.id,
            operator: "in",
            value: Array.isArray(filter.value)
              ? filter.value.map((v) => (typeof v === "object" ? v.value : v))
              : [filter.value],
          };
        });
      }

      // Debug
      console.log("Final API params:", params);
      const { data } = await api.get(`/contributions`, { params });
      console.log("API Response:", data);
      if (!data?.results || data.results.length === 0) {
        console.log("No data returned from API");
        return { items: [], totalPages: 0, meta: null };
      }
      return {
        items: data.results,
        totalPages: data?.totalPages || 1,
        meta: data.results.length && {
          id: "TOTAL",
          totalAmount: data.results.reduce((a, b) => a + Number(b.totalAmount || 0), 0),
          meta: { isFooter: true },
        },
      };
    },
  });

  const contributionDetailsQuery = useQuery(
    ["contribution-details", selectedContribution?.id],
    async () => {
      if (!selectedContribution?.id) return null;
      const { data } = await api.get(`/contributions/${selectedContribution.id}`);
      return data.data;
    },
    { enabled: !!selectedContribution?.id }
  );

  const handleDelete = () => {
    confirmModal.setIsLoading(true);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((f) => f.id !== "createdAt");
        return [
          ...otherFilters,
          { id: "createdAt", value: [range.from, range.to] },
        ];
      });
    } else {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "createdAt"));
    }
  };

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
                setSelectedMemberForDetails(member);
                setIsMemberDialogOpen(true);
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
        const group = row.getValue("group");
        // If group is an object, show its name; coerce to string for ReactNode
        const groupName: string =
          typeof group === "object" && group !== null && (group as any).name
            ? String((group as any).name)
            : String(group ?? "-");
        return (
          <div className="flex items-center gap-3 truncate">
            {groupName}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "depositAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("depositAmount");
        if (row.original.meta?.isFooter) {
          return (
            <div className="flex items-center truncate gap-3 font-semibold">
              {Number(amount || 0).toLocaleString()} FRW
            </div>
          );
        }
        return (
          <div className="flex items-center truncate gap-3">
            {Number(amount || 0).toLocaleString()} FRW
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
        const value = row.getValue("paymentMethod") as any;
        return (
          <div className="flex items-center gap-3 truncate">
            {String((value as any)?.name ?? value ?? "-")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "documentReceipt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Document/Receipt" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return null;
        }
        const value = row.getValue("documentReceipt") as string;
        if (!value) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-3 truncate">
            <a
              href={`/uploads/${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Document
            </a>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "transactionId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transaction ID" />
      ),
      cell: ({ row }) => {
        if (row.original.meta?.isFooter) {
          return null;
        }
        const value = row.getValue("transactionId") as string;
        if (!value) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-3 truncate">
            {String(value)}
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
        const value = row.getValue("receivedBy") as any;
        return (
          <div className="flex items-center gap-3 truncate">
            {String((value as any)?.name ?? value ?? "-")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "solidarityAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Solidarity" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("solidarityAmount");
        if (row.original.meta?.isFooter) {
          return (
            <div className="flex items-center truncate gap-3 font-semibold">
              {Number(amount || 0).toLocaleString()} FRW
            </div>
          );
        }
        return (
          <div className="flex items-center truncate gap-3">
            {Number(amount || 0).toLocaleString()} FRW
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
                  const member = row.original.member as Member;
                  setSelectedMemberForDetails(member);
                  setIsMemberDialogOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  useEffect(() => {
    console.log("Current pagination:", { pageIndex, pageSize });
    console.log("Current filters:", columnFilters);
  }, [pageIndex, pageSize, columnFilters]);

  return (
    <div className="container mx-auto py-10">
      <Dialog open={isExcelDialogOpen} onOpenChange={setExcelDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review & Add Uploaded Contributions</DialogTitle>
          </DialogHeader>
          {excelRows.length > 0 ? (
            <ScrollArea className="max-h-[60vh]">
              {excelRows.map((row, idx) => (
                <form
                  key={idx}
                  className="flex gap-2 mb-2 items-center"
                  onSubmit={async e => {
                    e.preventDefault();
                    const payload = mapExcelRowToPayload(row);
                    if (payload.error) {
                      toast.error(payload.error);
                      return;
                    }
                    try {
                      console.log('Sending contribution payload:', payload);
                      await api.post('/contributions', payload);
                      toast.success(`Contribution for ${row.Member || row['Member']} added!`);
                      setExcelRows(prev => prev.filter((_, i) => i !== idx));
                      if (typeof recordsQuery?.refetch === 'function') recordsQuery.refetch();
                    } catch (err) {
                      const message = err?.response?.data?.message || err?.message || 'Failed to add contribution';
                      toast.error(message);
                      console.error('Add contribution error:', err);
                    }
                  }}
                >
                  <input className="border px-2 py-1 rounded w-16" value={row.ID || ''} onChange={e => {
                    const updated = [...excelRows]; updated[idx].ID = e.target.value; setExcelRows(updated);
                  }} placeholder="ID" />
                  <input className="border px-2 py-1 rounded w-24" value={row.Date || ''} onChange={e => {
                    const updated = [...excelRows]; updated[idx].Date = e.target.value; setExcelRows(updated);
                  }} placeholder="Date" />
                  <input className="border px-2 py-1 rounded w-40" value={row.Member || ''} onChange={e => {
                    const updated = [...excelRows]; updated[idx].Member = e.target.value; setExcelRows(updated);
                  }} placeholder="Member" />
                  <input className="border px-2 py-1 rounded w-32" value={row.Group || ''} onChange={e => {
                    const updated = [...excelRows]; updated[idx].Group = e.target.value; setExcelRows(updated);
                  }} placeholder="Group" />
                  <input className="border px-2 py-1 rounded w-32" value={row['Total Amount'] || ''} onChange={e => {
                    const updated = [...excelRows]; updated[idx]['Total Amount'] = e.target.value; setExcelRows(updated);
                  }} placeholder="Total Amount" />
                  <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Add</button>
                </form>
              ))}
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground">No data found in Excel file.</div>
          )}
          {excelRows.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                className="px-6 py-2 rounded font-semibold text-white" style={{ background: '#1A56DB' }}
                onClick={async () => {
                  if (excelRows.length === 0) return;
                  let successCount = 0;
                  let errorCount = 0;
                  for (let idx = 0; idx < excelRows.length; idx++) {
                    const row = excelRows[idx];
                    const payload = mapExcelRowToPayload(row);
                    if (payload.error) {
                      errorCount++;
                      toast.error(`Row ${row.ID || idx + 1}: ${payload.error}`);
                      continue;
                    }
                    try {
                      await api.post('/contributions', payload);
                      successCount++;
                    } catch (err) {
                      errorCount++;
                      const message = err?.response?.data?.message || err?.message || 'Failed to add contribution';
                      toast.error(`Row ${row.ID || idx + 1}: ${message}`);
                      console.error('Bulk add error for row:', row, err);
                    }
                  }
                  if (successCount > 0) toast.success(`${successCount} contributions added!`);
                  if (errorCount > 0) toast.error(`${errorCount} contributions failed.`);
                  setExcelRows([]);
                  if (typeof recordsQuery?.refetch === 'function') recordsQuery.refetch();
                }}
                disabled={excelRows.length === 0}
              >
                Add All
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Contributions</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
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
          {(user?.isAdmin || user?.role?.name === "President" || user?.role?.name === "Accountant" || user?.role?.name === "Secretary") && (
            <Button onClick={() => newRecordModal.open()}>
              <PlusCircle size={16} className="mr-2" />
              Add Contribution
            </Button>
          )}
          <div className="ml-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                document.getElementById('excel-upload')?.click();
              }}
            >
              Upload Excel
            </Button>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  toast.success(`Selected file: ${file.name}`);
                  try {
                    const XLSX = await import('xlsx');
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const result = evt.target?.result;
                      let data;
                      if (result instanceof ArrayBuffer) {
                        data = new Uint8Array(result);
                      }
                      const workbook = XLSX.read(data, { type: 'array' });
                      const sheetName = workbook.SheetNames[0];
                      const worksheet = workbook.Sheets[sheetName];
                      const json = XLSX.utils.sheet_to_json(worksheet);
                      setExcelRows(json);
                      setExcelDialogOpen(true);
                    };
                    reader.readAsArrayBuffer(file);
                  } catch (err) {
                    toast.error('Failed to parse Excel file');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className="mb-6">
        {/* Search bar removed as requested */}
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
            options: paymentMethods?.map((method) => ({
              label: method.name || "Unnamed Payment Method",
              value: method.name || "Unnamed Payment Method",
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
        defaultColumnVisibility={{
          paymentMethod: false,
          documentReceipt: false,
          transactionId: false,
          receivedBy: false,
        }}
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
        title="Are you sure you want to delete?"
        description="This will permanently delete the contribution and cannot be undone."
        meta={confirmModal.meta}
        onConfirm={() => handleDelete()}
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
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMemberForDetails
                ? `${selectedMemberForDetails.fullNames}'s Contributions`
                : "Contributions"}
            </DialogTitle>
          </DialogHeader>
          {selectedMemberForDetails ? (
            <MemberContributionsTable
              memberId={selectedMemberForDetails.id}
              onOpenContribution={(c) => {
                setSelectedContribution(c);
                setIsViewDialogOpen(true);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
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
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16 md:h-20 md:w-20">
                        <AvatarImage src={contributionDetailsQuery.data.member?.avatar} />
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
                          <p className="text-sm text-muted-foreground">Deposit Amount</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.depositAmount || 0).toLocaleString()} FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Solidarity Amount</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.solidarityAmount || 0).toLocaleString()} FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Savings</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.currentSavingAmount || 0).toLocaleString()} FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Solidarity</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.currentSolidalityAmount || 0).toLocaleString()} FRW
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">Payment Information</h3>
                    <Table className="w-full">
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-sm text-muted-foreground w-[170px]">Payment Method</TableCell>
                          <TableCell className="font-medium">
                            {contributionDetailsQuery.data.paymentMethod?.name || "-"}
                          </TableCell>
                        </TableRow>
                        {contributionDetailsQuery.data.paymentMethod?.accountNumber && (
                          <TableRow>
                            <TableCell className="text-sm text-muted-foreground">Account Number</TableCell>
                            <TableCell className="font-medium">
                              {contributionDetailsQuery.data.paymentMethod.accountNumber}
                            </TableCell>
                          </TableRow>
                        )}
                        {contributionDetailsQuery.data.documentReceipt && (
                          <TableRow>
                            <TableCell className="text-sm text-muted-foreground">Document/Receipt</TableCell>
                            <TableCell className="font-medium">
                              <a
                                href={`/uploads/${contributionDetailsQuery.data.documentReceipt}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View Document
                              </a>
                            </TableCell>
                          </TableRow>
                        )}
                        {contributionDetailsQuery.data.transactionId && (
                          <TableRow>
                            <TableCell className="text-sm text-muted-foreground">Transaction ID</TableCell>
                            <TableCell className="font-medium">
                              {contributionDetailsQuery.data.transactionId}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell className="text-sm text-muted-foreground">Received By</TableCell>
                          <TableCell className="font-medium">
                            {contributionDetailsQuery.data.receivedBy?.name || "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm text-muted-foreground">Date</TableCell>
                          <TableCell className="font-medium">
                            {new Date(contributionDetailsQuery.data.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">Group Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Group Name</p>
                        <p className="font-medium">{contributionDetailsQuery.data.group?.name}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Meeting Day</p>
                          <p className="font-medium">{contributionDetailsQuery.data.group?.meetingDay}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Meeting Time</p>
                          <p className="font-medium">
                            {contributionDetailsQuery.data.group?.meetingStartTime} - {contributionDetailsQuery.data.group?.meetingEndTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price Per Share</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.group?.pricePerShare || 0).toLocaleString()} FRW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Solidarity Amount</p>
                          <p className="font-medium">
                            {(contributionDetailsQuery.data.group?.solidarityAmount || 0).toLocaleString()} FRW
                          </p>
                        </div>
                      </div>
                      {contributionDetailsQuery.data.group?.meetingLocation && (
                        <div>
                          <p className="text-sm text-muted-foreground">Meeting Location</p>
                          <p className="font-medium">{contributionDetailsQuery.data.group.meetingLocation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h3 className="text-base font-semibold mb-4">Season Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Season Name</p>
                        <p className="font-medium">{contributionDetailsQuery.data.season?.name}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{new Date(contributionDetailsQuery.data.season?.start).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium">{new Date(contributionDetailsQuery.data.season?.end).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={contributionDetailsQuery.data.season?.status === "active" ? "default" : "secondary"}
                          className={`${contributionDetailsQuery.data.season?.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} shadow-none`}
                        >
                          {contributionDetailsQuery.data.season?.status}
                        </Badge>
                      </div>
                      {contributionDetailsQuery.data.season?.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm">{contributionDetailsQuery.data.season.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {contributionDetailsQuery.data.fines?.length > 0 && (
                    <div className="bg-card rounded-lg border p-4 md:p-6">
                      <h3 className="text-base font-semibold mb-4">Fines</h3>

                      <div className="space-y-3">
                        {contributionDetailsQuery.data.fines.map((fine, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Amount</p>
                                <p className="font-medium">{(fine.amount || 0).toLocaleString()} FRW</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Reason</p>
                                <p className="font-medium">{fine.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
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
    </div >
  );
}