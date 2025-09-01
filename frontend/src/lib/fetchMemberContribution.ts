// Utility to fetch total contribution for a member
import { api } from "./api";

// Fetch total contribution for a member by summing depositAmount and solidarityAmount from /contributions endpoint
export async function fetchMemberContribution(memberId) {
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
    // Only sum for the correct member
    const filtered = Array.isArray(results)
        ? results.filter((c) => c?.member?.id === memberId)
        : [];
    return filtered.reduce((total, c) =>
        total + Number(c.depositAmount || 0) + Number(c.solidarityAmount || 0), 0
    );
}
