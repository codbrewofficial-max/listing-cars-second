import { ApiError } from "../../utils/ApiError";
import { findLeadById, insertLead, listLeads, type LeadRow } from "./leads.repository";

/**
 * Leads System (05-api-endpoints-mvp.md §7). Endpoint submit bersifat Public
 * (dari Contact Form / pop-up WhatsApp) — sengaja tidak butuh recordAuditLog
 * karena bukan aksi krusial oleh Admin/Owner/Super Admin (03-rbac-alur-admin.md §4
 * hanya mewajibkan pencatatan aksi staff), melainkan aktivitas Customer/Public biasa.
 */
export async function submitLeadService(params: {
  source: string;
  name: string;
  email?: string;
  phone: string;
  message?: string;
  relatedProductType?: string;
  relatedProductId?: string;
}): Promise<LeadRow> {
  return insertLead(params);
}

export async function listLeadsService(filters: {
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit: number;
  offset: number;
}) {
  return listLeads(filters);
}

export async function getLeadDetailService(id: string): Promise<LeadRow> {
  const lead = await findLeadById(id);
  if (!lead) throw ApiError.notFound("Lead tidak ditemukan");
  return lead;
}
