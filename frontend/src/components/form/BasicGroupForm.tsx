import { useState } from "react";
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

// Basic group creation schema (only essential fields)
const basicGroupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    branchId: z.number().min(1, "Branch is required"),
    additionalNotes: z.string().optional(),
});

interface BasicGroupFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refetch: () => void;
}

export default function BasicGroupForm({ isOpen, setIsOpen, refetch }: BasicGroupFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

    const form = useForm<z.infer<typeof basicGroupSchema>>({
        resolver: zodResolver(basicGroupSchema),
        defaultValues: {
            name: "",
            description: "",
            branchId: 0,
            additionalNotes: "",
        },
    });

    // Fetch districts
    const { data: districts } = useQuery({
        queryKey: ["districts"],
        queryFn: async () => {
            const { data } = await api.get("/districts");
            return data.results;
        },
    });

    // Fetch branches for selected district
    const { data: branches = [] } = useQuery({
        queryKey: ["district-branches", selectedDistrict],
        queryFn: async () => {
            if (!selectedDistrict) return [];
            const { data } = await api.get(`/districts/${selectedDistrict}`);
            return data.branches || [];
        },
        enabled: !!selectedDistrict,
    });

    async function onSubmit(values: z.infer<typeof basicGroupSchema>) {
        setIsSubmitting(true);

        try {
            await api.post("/groups/basic", values);
            toast.success("Basic group created successfully! You can now add members and assign a group leader.");
            form.reset();
            setIsOpen(false);
            refetch();
        } catch (error: any) {
            console.error("Error creating basic group:", error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((field: any) => {
                    form.setError(field, {
                        message: errors[field],
                    });
                });
            } else {
                toast.error(error.response?.data?.message || "Failed to create group");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleClose = () => {
        form.reset();
        setSelectedDistrict(null);
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[600px]">
                <SheetHeader>
                    <SheetTitle>Create Basic Group</SheetTitle>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        {/* Group Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter group name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter group description (optional)"
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* District Selection */}
                        <div>
                            <FormLabel>District *</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    setSelectedDistrict(parseInt(value));
                                    form.setValue("branchId", 0); // Reset branch selection
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select district" />
                                </SelectTrigger>
                                <SelectContent>
                                    {districts?.map((district: any) => (
                                        <SelectItem key={district.id} value={district.id.toString()}>
                                            {district.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch Selection */}
                        <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch *</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            disabled={!selectedDistrict || branches.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch: any) => (
                                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Additional Notes */}
                        <FormField
                            control={form.control}
                            name="additionalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any additional notes about the group (optional)"
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                Create Basic Group
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
