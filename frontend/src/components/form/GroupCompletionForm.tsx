import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery } from "react-query";
import { api } from "@/lib/api";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchSelect from "@/components/ui/search-select";

// Group completion schema (all fields optional)
const groupCompletionSchema = z
    .object({
        description: z.string().optional(),
        presidentId: z.number().optional(),
        accountantId: z.number().optional(),
        secretaryId: z.number().optional(),
        presidentEmail: z.string().email().optional().or(z.literal("")),
        accountantEmail: z.string().email().optional().or(z.literal("")),
        secretaryEmail: z.string().email().optional().or(z.literal("")),
        presidentPassword: z.string().optional(),
        accountantPassword: z.string().optional(),
        secretaryPassword: z.string().optional(),
        meetingFrequency: z
            .enum(["Weekly", "Bi-weekly", "Monthly", "Quarterly"])
            .optional(),
        meetingDay: z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]).optional(),
        meetingStartTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
            .optional()
            .or(z.literal("")),
        meetingEndTime: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
            .optional()
            .or(z.literal("")),
        meetingLocation: z.string().optional(),
        meetingLocationDetails: z.string().optional(),
        pricePerShare: z.number().positive().optional(),
        minShares: z.number().min(0).optional(),
        maxShares: z.number().min(1).optional(),
        solidarityAmount: z.number().min(0).optional(),
        additionalNotes: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.meetingStartTime && data.meetingEndTime) {
                const start = new Date(`2000-01-01T${data.meetingStartTime}`);
                const end = new Date(`2000-01-01T${data.meetingEndTime}`);
                return end > start;
            }
            return true;
        },
        {
            message: "End time must be after start time",
            path: ["meetingEndTime"],
        }
    )
    .refine(
        (data) => {
            if (data.minShares !== undefined && data.maxShares !== undefined) {
                return data.maxShares >= data.minShares;
            }
            return true;
        },
        {
            message: "Maximum shares must be greater than or equal to minimum shares",
            path: ["maxShares"],
        }
    );

interface GroupCompletionFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refetch: () => void;
    group: any; // The incomplete group to complete
}

export default function GroupCompletionForm({
    isOpen,
    setIsOpen,
    refetch,
    group
}: GroupCompletionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof groupCompletionSchema>>({
        resolver: zodResolver(groupCompletionSchema),
        defaultValues: {
            description: "",
            presidentEmail: "",
            accountantEmail: "",
            secretaryEmail: "",
            presidentPassword: "",
            accountantPassword: "",
            secretaryPassword: "",
            meetingStartTime: "",
            meetingEndTime: "",
            meetingLocation: "",
            meetingLocationDetails: "",
            additionalNotes: "",
        },
    });

    // Populate form with existing group data
    useEffect(() => {
        if (group && isOpen) {
            form.reset({
                description: group.description || "",
                presidentId: group.president?.id,
                accountantId: group.accountant?.id,
                secretaryId: group.secretary?.id,
                meetingFrequency: group.meetingFrequency,
                meetingDay: group.meetingDay,
                meetingStartTime: group.meetingStartTime || "",
                meetingEndTime: group.meetingEndTime || "",
                meetingLocation: group.meetingLocation || "",
                meetingLocationDetails: group.meetingLocationDetails || "",
                pricePerShare: group.pricePerShare,
                minShares: group.minShares,
                maxShares: group.maxShares,
                solidarityAmount: group.solidarityAmount,
                additionalNotes: group.additionalNotes || "",
            });
        }
    }, [group, isOpen, form]);

    // Fetch members for leader selection
    const { data: members } = useQuery(["members"], async () => {
        const { data } = await api.get("/members");
        return data.results;
    });

    async function onSubmit(values: z.infer<typeof groupCompletionSchema>) {
        setIsSubmitting(true);

        try {
            // Clean up empty string values
            const cleanedValues = Object.fromEntries(
                Object.entries(values).filter(([_, value]) => value !== "" && value !== undefined)
            );

            await api.patch(`/groups/${group.id}/complete`, cleanedValues);
            toast.success("Group setup completed successfully!");
            form.reset();
            setIsOpen(false);
            refetch();
        } catch (error: any) {
            console.error("Error completing group setup:", error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((field: any) => {
                    form.setError(field, {
                        message: errors[field],
                    });
                });
            } else {
                toast.error(error.response?.data?.message || "Failed to complete group setup");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleClose = () => {
        form.reset();
        setIsOpen(false);
    };

    // Helper to check if a field has data
    const hasData = (field: string) => {
        const value = group?.[field];
        return value !== null && value !== undefined && value !== "";
    };

    // Calculate completion percentage
    const totalFields = 12; // Key fields to track
    const completedFields = [
        hasData('description'),
        hasData('president'),
        hasData('accountant'),
        hasData('secretary'),
        hasData('meetingDay'),
        hasData('meetingStartTime'),
        hasData('meetingEndTime'),
        hasData('meetingLocation'),
        hasData('pricePerShare'),
        hasData('minShares'),
        hasData('maxShares'),
        hasData('solidarityAmount'),
    ].filter(Boolean).length;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[700px]">
                <SheetHeader>
                    <SheetTitle>Complete Group Setup: {group?.name}</SheetTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                            {completionPercentage}% Complete
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {completedFields} of {totalFields} fields completed
                        </span>
                    </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Basic Information</h3>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Description {hasData('description') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter group description"
                                                    className="min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Group Officers */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Group Officers</h3>

                                {/* President */}
                                <div className="space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="presidentId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    President {hasData('president') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <SearchSelect
                                                        placeholder="Select president"
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                                                        options={members?.map((member: any) => ({
                                                            value: member.id.toString(),
                                                            label: `${member.firstName} ${member.lastName}`,
                                                        })) || []}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("presidentId") && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="presidentEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>President Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="president@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="presidentPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>President Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="Password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Accountant */}
                                <div className="space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="accountantId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Accountant {hasData('accountant') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <SearchSelect
                                                        placeholder="Select accountant"
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                                                        options={members?.map((member: any) => ({
                                                            value: member.id.toString(),
                                                            label: `${member.firstName} ${member.lastName}`,
                                                        })) || []}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("accountantId") && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="accountantEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Accountant Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="accountant@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="accountantPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Accountant Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="Password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Secretary */}
                                <div className="space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="secretaryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Secretary {hasData('secretary') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <SearchSelect
                                                        placeholder="Select secretary"
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                                                        options={members?.map((member: any) => ({
                                                            value: member.id.toString(),
                                                            label: `${member.firstName} ${member.lastName}`,
                                                        })) || []}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("secretaryId") && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="secretaryEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Secretary Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="secretary@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="secretaryPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Secretary Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="Password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meeting Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Meeting Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="meetingFrequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meeting Frequency</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select frequency" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                                            <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="meetingDay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Meeting Day {hasData('meetingDay') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select day" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                                                <SelectItem key={day} value={day}>{day}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="meetingStartTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Start Time {hasData('meetingStartTime') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="meetingEndTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    End Time {hasData('meetingEndTime') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="meetingLocation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Meeting Location {hasData('meetingLocation') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter meeting location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="meetingLocationDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location Details</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional location details (optional)"
                                                    className="min-h-[60px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Financial Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Financial Settings</h3>

                                <FormField
                                    control={form.control}
                                    name="pricePerShare"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Price per Share (FRW) {hasData('pricePerShare') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter price per share"
                                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="minShares"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Minimum Shares {hasData('minShares') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Min shares"
                                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="maxShares"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Maximum Shares {hasData('maxShares') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Max shares"
                                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="solidarityAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Solidarity Amount (FRW) {hasData('solidarityAmount') && <Badge variant="outline" className="ml-2">✓</Badge>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter solidarity amount"
                                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Amount for solidarity fund contributions
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Additional Notes */}
                            <FormField
                                control={form.control}
                                name="additionalNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Additional Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Any additional notes about the group"
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </ScrollArea>

                <SheetFooter className="gap-2 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Update Group Setup
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
