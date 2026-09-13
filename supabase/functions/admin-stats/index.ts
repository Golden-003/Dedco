// GET /admin-stats — admin uniquement
// Agrégats pour le dashboard admin. Utilise `head: true, count: "exact"` pour
// éviter de rapatrier les lignes quand seul le total importe.

import { json, withErrorHandling } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/supabase.ts";

Deno.serve(
  withErrorHandling(async (req) => {
    const { admin } = await requireAdmin(req);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      pendingKyc,
      openDisputes,
      activeProducts,
      monthlyOrders,
      usersByRole,
    ] = await Promise.all([
      admin.from("kyc_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("disputes").select("id", { count: "exact", head: true }).in("status", ["OPEN", "WAITING_ARTISAN", "WAITING_CLIENT", "UNDER_REVIEW"]),
      admin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin.from("orders").select("total").gte("created_at", startOfMonth.toISOString()).eq("status", "payé"),
      admin.from("profiles").select("role"),
    ]);

    const monthlyRevenue = (monthlyOrders.data ?? []).reduce(
      (sum: number, o: { total: number }) => sum + o.total,
      0,
    );
    const roleCounts: Record<string, number> = {};
    for (const p of (usersByRole.data ?? []) as { role: string }[]) {
      roleCounts[p.role] = (roleCounts[p.role] ?? 0) + 1;
    }

    return json({
      pendingKyc: pendingKyc.count ?? 0,
      openDisputes: openDisputes.count ?? 0,
      activeProducts: activeProducts.count ?? 0,
      monthlyOrdersCount: monthlyOrders.data?.length ?? 0,
      monthlyRevenue,
      usersByRole: roleCounts,
    });
  }),
);
