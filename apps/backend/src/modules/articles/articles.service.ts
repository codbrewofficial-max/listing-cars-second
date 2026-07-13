import { ApiError } from "../../utils/ApiError";
import { recordAuditLog } from "../audit-log/audit-log.service";
import { findMediaAssetById, findMediaAssetsByIds } from "../media/media.repository";
import {
  deleteArticle,
  findArticleById,
  findArticleBySlug,
  insertArticle,
  listArticles,
  slugExists,
  updateArticle,
  updateArticleStatus,
  type ArticleRow,
} from "./articles.repository";

/**
 * cover_media_id di tabel `articles` adalah UUID mentah (referensi ke media_assets),
 * BUKAN URL siap pakai. Frontend butuh URL langsung untuk <img src>, jadi setiap
 * response artikel (list maupun detail, publik maupun admin) di-enrich dengan field
 * tambahan `cover_url` hasil lookup ke media_assets. `cover_media_id` tetap
 * dipertahankan di response demi kompatibilitas (mis. form edit admin butuh ID-nya).
 */
type ArticleWithCoverUrl = ArticleRow & { cover_url: string | null };

async function attachCoverUrl(article: ArticleRow): Promise<ArticleWithCoverUrl> {
  if (!article.cover_media_id) return { ...article, cover_url: null };
  const asset = await findMediaAssetById(article.cover_media_id);
  return { ...article, cover_url: asset?.file_url ?? null };
}

async function attachCoverUrlToList(articles: ArticleRow[]): Promise<ArticleWithCoverUrl[]> {
  const ids = [...new Set(articles.map((a) => a.cover_media_id).filter((id): id is string => !!id))];
  if (ids.length === 0) return articles.map((a) => ({ ...a, cover_url: null }));

  const assets = await findMediaAssetsByIds(ids);
  const urlByAssetId = new Map(assets.map((asset) => [asset.id, asset.file_url]));

  return articles.map((a) => ({
    ...a,
    cover_url: a.cover_media_id ? urlByAssetId.get(a.cover_media_id) ?? null : null,
  }));
}

/**
 * Slug SEO-friendly di-generate otomatis dari title kalau tidak dikirim eksplisit
 * (mendukung requirement SEO-friendly di 00-overview-strategi-produk-versi-cepat.md §2).
 * Kalau slug hasil generate sudah dipakai artikel lain, tambahkan suffix angka
 * (mis. "tips-servis-motor-2") supaya tetap unik tanpa gagal request.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 240);
}

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "artikel";
  let candidate = slug;
  let suffix = 2;
  while (await slugExists(candidate, excludeId)) {
    candidate = `${slug}-${suffix++}`;
  }
  return candidate;
}

export async function listPublicArticlesService(filters: {
  category?: string;
  search?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  const { data, total } = await listArticles({ ...filters, publicOnly: true });
  return { data: await attachCoverUrlToList(data), total };
}

export async function listAdminArticlesService(filters: {
  category?: string;
  search?: string;
  status?: string;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}) {
  const { data, total } = await listArticles(filters);
  return { data: await attachCoverUrlToList(data), total };
}

export async function getPublicArticleBySlugService(slug: string): Promise<ArticleWithCoverUrl> {
  const article = await findArticleBySlug(slug);
  if (!article || article.status !== "published") {
    throw ApiError.notFound("Artikel tidak ditemukan");
  }
  return attachCoverUrl(article);
}

export async function getAdminArticleService(id: string): Promise<ArticleWithCoverUrl> {
  const article = await findArticleById(id);
  if (!article) throw ApiError.notFound("Artikel tidak ditemukan");
  return attachCoverUrl(article);
}

export async function createArticleService(params: {
  title: string;
  content: string;
  category?: string;
  seo_title?: string;
  seo_description?: string;
  cover_media_id?: string;
  slug?: string;
  authorId: string;
  actorRole: string;
}): Promise<ArticleRow> {
  if (params.cover_media_id) {
    const asset = await findMediaAssetById(params.cover_media_id);
    if (!asset) throw ApiError.notFound("Media asset (cover) tidak ditemukan");
  }

  const slug = params.slug ? await generateUniqueSlug(params.slug) : await generateUniqueSlug(params.title);

  const article = await insertArticle({
    title: params.title,
    slug,
    content: params.content,
    category: params.category,
    seoTitle: params.seo_title,
    seoDescription: params.seo_description,
    coverMediaId: params.cover_media_id,
    authorId: params.authorId,
  });

  await recordAuditLog({
    actorId: params.authorId,
    actorRole: params.actorRole,
    actionType: "create_article",
    targetEntity: "articles",
    targetId: article.id,
    metadata: { title: article.title, slug: article.slug },
  });

  return article;
}

export async function updateArticleService(
  id: string,
  fields: Partial<{
    title: string;
    content: string;
    category: string;
    seo_title: string;
    seo_description: string;
    cover_media_id: string | null;
    slug: string;
  }>,
  actor: { id: string; role: string }
): Promise<ArticleRow> {
  const existing = await findArticleById(id);
  if (!existing) throw ApiError.notFound("Artikel tidak ditemukan");

  if (fields.cover_media_id) {
    const asset = await findMediaAssetById(fields.cover_media_id);
    if (!asset) throw ApiError.notFound("Media asset (cover) tidak ditemukan");
  }

  let slug: string | undefined;
  if (fields.slug) {
    slug = await generateUniqueSlug(fields.slug, id);
  }

  const updated = await updateArticle(id, { ...fields, slug });
  if (!updated) throw ApiError.notFound("Artikel tidak ditemukan");

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_article",
    targetEntity: "articles",
    targetId: id,
    metadata: { fields: Object.keys(fields) },
  });

  return updated;
}

export async function updateArticleStatusService(
  id: string,
  status: string,
  actor: { id: string; role: string }
): Promise<ArticleRow> {
  const existing = await findArticleById(id);
  if (!existing) throw ApiError.notFound("Artikel tidak ditemukan");

  const updated = await updateArticleStatus(id, status);
  if (!updated) throw ApiError.notFound("Artikel tidak ditemukan");

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "update_article_status",
    targetEntity: "articles",
    targetId: id,
    metadata: { from: existing.status, to: status },
  });

  return updated;
}

export async function deleteArticleService(id: string, actor: { id: string; role: string }) {
  const existing = await findArticleById(id);
  if (!existing) throw ApiError.notFound("Artikel tidak ditemukan");

  await deleteArticle(id);

  await recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actionType: "delete_article",
    targetEntity: "articles",
    targetId: id,
    metadata: { title: existing.title, slug: existing.slug },
  });

  return { message: "Artikel berhasil dihapus" };
}
