import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth.context";

const approvalSchema = z.object({
    notes: z.string().optional(),
});

interface LoanApprovalModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    loanId: number;
}

interface VerificationStatus {
    president: {
        member: any;
        verification: any;
        required: boolean;
    };
    accountant: {
        member: any;
        verification: any;
        required: boolean;
    };
    secretary: {
        member: any;
        verification: any;
        required: boolean;
    };
}

export default function LoanApprovalModal({
    isOpen,
    setIsOpen,
    loanId,
}: LoanApprovalModalProps) {
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const form = useForm<z.infer<typeof approvalSchema>>({
        resolver: zodResolver(approvalSchema),
        defaultValues: {
            notes: "",
        },
    });

    // Fetch loan verification status
    const { data: verificationData, isLoading, error } = useQuery({
        queryKey: ["loan-verifications", loanId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/loans/${loanId}/verifications`);
                console.log("Verification data:", data); // Debug log
                console.log("Loan amount:", data?.data?.loan?.amount); // Debug loan amount specifically
                return data.data;
            } catch (error) {
                console.error("Error fetching loan verification:", error);
                throw error;
            }
        },
        enabled: isOpen && !!loanId,
    });

    // Check if user has already approved and close modal immediately if so
    React.useEffect(() => {
        if (verificationData && user && canUserApprove() && isOpen) {
            const hasApproved = hasUserApproved();
            if (hasApproved) {
                setIsOpen(false);
                toast.info("You have already approved this loan");
            }
        }
    }, [verificationData, user, isOpen]);

    // Submit verification
    const verificationMutation = useMutation({
        mutationFn: async (data: { status: string; notes?: string }) => {
            return api.post(`/loans/${loanId}/verify`, data);
        },
        onSuccess: () => {
            toast.success("Loan verification submitted successfully");
            queryClient.invalidateQueries(["loan-verifications", loanId]);
            queryClient.invalidateQueries(["loans"]);
            setIsOpen(false);
            setApprovalAction(null);
            form.reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to submit verification");
        },
    });

    const handleSubmit = (values: z.infer<typeof approvalSchema>) => {
        if (!approvalAction) return;

        verificationMutation.mutate({
            status: approvalAction === "approve" ? "Approved" : "Rejected",
            notes: values.notes,
        });
    };



    // Helper function to check if current user can approve
    const canUserApprove = () => {
        if (!user) return false;

        // Admin users cannot approve loans
        if (user.isAdmin) return false;

        // Check if user is a group leader (president, accountant, or secretary)
        // This is a simplified check - in a real implementation, you'd check against the specific group
        return user.role?.name === "President" ||
            user.role?.name === "Accountant" ||
            user.role?.name === "Secretary";
    };

    // Helper function to get current user's role name
    const getUserRoleName = () => {
        if (!user) return null;
        // If user is admin, they cannot approve, so return null
        if (user.isAdmin) return null;
        return user.role?.name;
    };

    // Helper function to check if user has already approved
    const hasUserApproved = () => {
        if (!user || !verificationData?.verifications) return false;

        const userRole = getUserRoleName();
        if (!userRole) return false;

        // Check if user has already submitted a verification
        return verificationData.verifications.some((verification: any) => {
            // This is a simplified check - in a real implementation, you'd match by user ID
            return verification.member?.fullNames === user.name;
        });
    };

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (error) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="text-red-500">Error loading loan data: {(error as any)?.message || 'Unknown error'}</div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const verificationStatus: VerificationStatus = verificationData?.verificationStatus;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Loan Approval</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Loan Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Loan Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Amount:</span> {verificationData?.loan?.amount !== null && verificationData?.loan?.amount !== undefined ? (typeof verificationData.loan.amount === 'number' ? verificationData.loan.amount.toLocaleString() : verificationData.loan.amount.toString()) : 'Loading...'} FRW
                            </div>
                            <div>
                                <span className="font-medium">Type:</span> {verificationData?.loan?.loanType || 'Loading...'}
                            </div>
                            <div>
                                <span className="font-medium">Member:</span> {verificationData?.loan?.member?.fullNames || 'Loading...'}
                            </div>
                            <div>
                                <span className="font-medium">Group:</span> {verificationData?.loan?.group?.name || 'Loading...'}
                            </div>
                        </div>
                    </div>

                    {/* Approval Status - Only show current user's role if they can approve */}
                    {canUserApprove() && (
                        <div>
                            <h3 className="font-semibold mb-3">Your Approval Status</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                You are logged in as: <strong>{getUserRoleName()}</strong>
                            </p>

                            {/* Show only current user's approval status */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">{getUserRoleName()}</div>
                                            <div className="text-sm text-gray-600">
                                                {user?.name || 'You'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasUserApproved() ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <Badge variant="default" className="bg-green-500">Approved</Badge>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <Badge variant="secondary">Pending</Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Approval Summary */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-blue-800">
                                    <strong>Approval Progress:</strong>
                                    {(() => {
                                        const totalLeaders = [verificationStatus?.president, verificationStatus?.accountant, verificationStatus?.secretary].filter(Boolean).length;
                                        const approvedCount = [verificationStatus?.president?.verification, verificationStatus?.accountant?.verification, verificationStatus?.secretary?.verification].filter(v => v?.status === "Approved").length;
                                        const rejectedCount = [verificationStatus?.president?.verification, verificationStatus?.accountant?.verification, verificationStatus?.secretary?.verification].filter(v => v?.status === "Rejected").length;

                                        if (rejectedCount > 0) {
                                            return ` ❌ Loan rejected (${rejectedCount} rejection${rejectedCount > 1 ? 's' : ''})`;
                                        } else if (approvedCount === totalLeaders && totalLeaders > 0) {
                                            return ` ✅ Loan approved (${approvedCount}/${totalLeaders} approvals)`;
                                        } else {
                                            return ` ⏳ Pending approval (${approvedCount}/${totalLeaders} approvals)`;
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show message for non-leaders or admins */}
                    {!canUserApprove() && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-sm text-yellow-800">
                                <strong>Access Restricted:</strong> {user?.isAdmin
                                    ? "Admin users cannot approve loans. Only group leaders (President, Accountant, Secretary) can approve loans."
                                    : "Only group leaders (President, Accountant, Secretary) can approve loans."
                                }
                            </div>
                        </div>
                    )}

                    {/* Approval Actions - Only show if user can approve and hasn't already approved */}
                    {canUserApprove() && !hasUserApproved() && (
                        <div>
                            <h3 className="font-semibold mb-3">Your Decision</h3>
                            <div className="flex gap-3 mb-4">
                                <Button
                                    type="button"
                                    variant={approvalAction === "approve" ? "default" : "outline"}
                                    onClick={() => setApprovalAction("approve")}
                                    className="flex-1"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    type="button"
                                    variant={approvalAction === "reject" ? "destructive" : "outline"}
                                    onClick={() => setApprovalAction("reject")}
                                    className="flex-1"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </div>

                            {approvalAction && (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Notes (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Add any comments or notes about your decision..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex gap-3">
                                            <Button
                                                type="submit"
                                                disabled={verificationMutation.isLoading}
                                                className="flex-1"
                                            >
                                                {verificationMutation.isLoading ? "Submitting..." : "Submit Decision"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setApprovalAction(null);
                                                    form.reset();
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            )}
                        </div>
                    )}

                    {/* Show message if user has already approved */}
                    {canUserApprove() && hasUserApproved() && (
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-800">
                                <strong>Already Approved:</strong> You have already submitted your approval for this loan.
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 