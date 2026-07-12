import {
  countArticlesByStatus,
  countLeadsBySource,
  countLeadsTotal,
  countTransactionsByStatus,
  leadsReportGroupedByDay,
  leadsReportGroupedBySource,
  listRecentPublishedArticles,
  transactionsReportGroupedByDay,
  transactionsReportGroupedByStatus,
} from "./insights.repository";

/**
 * Tracking Insight (05-api-endpoints-mvp.md §11): endpoint di sini HANYA untuk data
 * internal (leads, transaksi, artikel) yang tersimpan di PostgreSQL. Integrasi GTM/GA4
 * murni client-side (script tag di frontend Next.js), jadi metrik page-view / traffic
 * TIDAK ada di sini — kalau nanti dibutuhkan server-side tagging, itu di luar scope MVP.
 */
export async function getOverviewService(params: { dateFrom?: string; dateTo?: string }) {
  const [totalLeads, leadsBySource, transactionsByStatus, articlesByStatus, recentArticles] = await Promise.all([
    countLeadsTotal(params.dateFrom, params.dateTo),
    countLeadsBySource(params.dateFrom, params.dateTo),
    countTransactionsByStatus(params.dateFrom, params.dateTo),
    countArticlesByStatus(),
    listRecentPublishedArticles(5),
  ]);

  const totalTransactions = transactionsByStatus.reduce((sum, s) => sum + s.count, 0);
  const totalReleasedAmount =
    transactionsByStatus.find((s) => s.status === "released_to_seller")?.total_amount ?? 0;

  return {
    total_leads: totalLeads,
    leads_by_source: leadsBySource,
    total_transactions: totalTransactions,
    transactions_by_status: transactionsByStatus,
    total_released_amount: totalReleasedAmount,
    articles_by_status: articlesByStatus,
    // Proxy sementara untuk "artikel terpopuler" (lihat catatan di insights.repository.ts)
    recent_published_articles: recentArticles,
  };
}

export async function getLeadsReportService(params: {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string;
}) {
  if (params.groupBy === "source") {
    return { group_by: "source", data: await leadsReportGroupedBySource(params.dateFrom, params.dateTo) };
  }
  return { group_by: "day", data: await leadsReportGroupedByDay(params.dateFrom, params.dateTo) };
}

export async function getTransactionsReportService(params: {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string;
}) {
  if (params.groupBy === "status") {
    return { group_by: "status", data: await transactionsReportGroupedByStatus(params.dateFrom, params.dateTo) };
  }
  return { group_by: "day", data: await transactionsReportGroupedByDay(params.dateFrom, params.dateTo) };
}
