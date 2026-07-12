import { query } from "../../config/db";

export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  status: "draft" | "published" | "archived";
  cover_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleFilters {
  status?: string;
  category?: string;
  search?: string;
  publicOnly?: boolean;
  limit: number;
  offset: number;
  sortColumn: string;
  sortDirection: "ASC" | "DESC";
}

function buildFilterConditions(filters: ArticleFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.publicOnly) {
    conditions.push(`status = 'published'`);
  } else if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.category) {
    conditions.push(`category ILIKE $${idx++}`);
    params.push(`%${filters.category}%`);
  }
  if (filters.search) {
    conditions.push(`(title ILIKE $${idx} OR content ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params, nextIdx: idx };
}

export async function listArticles(filters: ArticleFilters): Promise<{ data: ArticleRow[]; total: number }> {
  const { where, params, nextIdx } = buildFilterConditions(filters);

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM articles ${where}`, params);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<ArticleRow>(
    `SELECT * FROM articles ${where}
     ORDER BY ${filters.sortColumn} ${filters.sortDirection}
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, filters.limit, filters.offset]
  );
  return { data: dataRes.rows, total };
}

export async function findArticleById(id: string): Promise<ArticleRow | null> {
  const { rows } = await query<ArticleRow>(`SELECT * FROM articles WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findArticleBySlug(slug: string): Promise<ArticleRow | null> {
  const { rows } = await query<ArticleRow>(`SELECT * FROM articles WHERE slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM articles WHERE slug = $1 AND ($2::uuid IS NULL OR id != $2)) as exists`,
    [slug, excludeId ?? null]
  );
  return rows[0]?.exists ?? false;
}

export async function insertArticle(params: {
  title: string;
  slug: string;
  content: string;
  category?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverMediaId?: string | null;
  authorId: string;
}): Promise<ArticleRow> {
  const { rows } = await query<ArticleRow>(
    `INSERT INTO articles (title, slug, content, category, seo_title, seo_description, cover_media_id, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      params.title,
      params.slug,
      params.content,
      params.category ?? null,
      params.seoTitle ?? null,
      params.seoDescription ?? null,
      params.coverMediaId ?? null,
      params.authorId,
    ]
  );
  return rows[0];
}

export async function updateArticle(
  id: string,
  fields: Partial<{
    title: string;
    slug: string;
    content: string;
    category: string | null;
    seo_title: string | null;
    seo_description: string | null;
    cover_media_id: string | null;
  }>
): Promise<ArticleRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (sets.length === 0) return findArticleById(id);
  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await query<ArticleRow>(
    `UPDATE articles SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function updateArticleStatus(id: string, status: string): Promise<ArticleRow | null> {
  const publishedAtClause = status === "published" ? `, published_at = COALESCE(published_at, now())` : "";
  const { rows } = await query<ArticleRow>(
    `UPDATE articles SET status = $1, updated_at = now() ${publishedAtClause} WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function deleteArticle(id: string): Promise<void> {
  await query(`DELETE FROM articles WHERE id = $1`, [id]);
}
