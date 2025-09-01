// Utility to fetch allowed loan amount for a member
import { api } from "@/lib/api";

export async function fetchAllowedLoanAmount(groupMemberId) {
    if (!groupMemberId) return 0;
    try {
        const { data } = await api.get(`/group-members/${groupMemberId}/allowed-loan-amount`);
        return data?.allowedLoanAmount || 0;
    } catch (e) {
        return 0;
    }
}
