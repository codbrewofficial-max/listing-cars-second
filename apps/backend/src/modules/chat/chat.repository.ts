import { query, withTransaction } from "../../config/db";

export interface ConversationRow {
  id: string;
  subject_type: "vehicle" | "spare_part" | null;
  subject_id: string | null;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface ParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  participant_type: "customer" | "admin" | "toko";
  joined_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: "text" | "image" | "system";
  content: string;
  media_asset_id: string | null;
  created_at: string;
}

export async function insertConversation(params: {
  subjectType?: string | null;
  subjectId?: string | null;
}): Promise<ConversationRow> {
  const { rows } = await query<ConversationRow>(
    `INSERT INTO conversations (subject_type, subject_id) VALUES ($1, $2) RETURNING *`,
    [params.subjectType ?? null, params.subjectId ?? null]
  );
  return rows[0];
}

export async function findConversationById(id: string): Promise<ConversationRow | null> {
  const { rows } = await query<ConversationRow>(`SELECT * FROM conversations WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function addParticipant(params: {
  conversationId: string;
  userId: string;
  participantType: string;
}): Promise<ParticipantRow> {
  const { rows } = await query<ParticipantRow>(
    `INSERT INTO conversation_participants (conversation_id, user_id, participant_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (conversation_id, user_id) DO UPDATE SET participant_type = EXCLUDED.participant_type
     RETURNING *`,
    [params.conversationId, params.userId, params.participantType]
  );
  return rows[0];
}

export async function listParticipants(conversationId: string): Promise<ParticipantRow[]> {
  const { rows } = await query<ParticipantRow>(
    `SELECT * FROM conversation_participants WHERE conversation_id = $1 ORDER BY joined_at ASC`,
    [conversationId]
  );
  return rows;
}

export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2
     ) as exists`,
    [conversationId, userId]
  );
  return rows[0]?.exists ?? false;
}

export async function hasAdminParticipant(conversationId: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND participant_type = 'admin'
     ) as exists`,
    [conversationId]
  );
  return rows[0]?.exists ?? false;
}

/** Conversation milik customer tertentu (dia salah satu partisipan). */
export async function listConversationsForCustomer(params: {
  customerId: string;
  status?: string;
  limit: number;
  offset: number;
}): Promise<{ data: ConversationRow[]; total: number }> {
  const conditions = [`cp.user_id = $1`];
  const values: unknown[] = [params.customerId];
  let idx = 2;
  if (params.status) {
    conditions.push(`c.status = $${idx++}`);
    values.push(params.status);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT c.id)::text as count
     FROM conversations c JOIN conversation_participants cp ON cp.conversation_id = c.id
     ${where}`,
    values
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<ConversationRow>(
    `SELECT DISTINCT c.*
     FROM conversations c JOIN conversation_participants cp ON cp.conversation_id = c.id
     ${where}
     ORDER BY c.updated_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, params.limit, params.offset]
  );

  return { data: dataRes.rows, total };
}

/**
 * Conversation yang "terlihat" bagi Admin: yang sudah dia ikuti, ATAU yang masih
 * open & belum punya partisipan admin sama sekali (general queue — sesuai keputusan
 * MVP: tanpa auto-assign, admin manapun bisa merespon & jadi assigned).
 */
export async function listConversationsForAdminQueue(params: {
  adminId: string;
  status?: string;
  limit: number;
  offset: number;
}): Promise<{ data: ConversationRow[]; total: number }> {
  const conditions = [
    `(EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = $1)
      OR (c.status = 'open' AND NOT EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.participant_type = 'admin'
          )))`,
  ];
  const values: unknown[] = [params.adminId];
  let idx = 2;
  if (params.status) {
    conditions.push(`c.status = $${idx++}`);
    values.push(params.status);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM conversations c ${where}`, values);
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);

  const dataRes = await query<ConversationRow>(
    `SELECT c.* FROM conversations c ${where} ORDER BY c.updated_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, params.limit, params.offset]
  );

  return { data: dataRes.rows, total };
}

export async function touchConversation(id: string): Promise<void> {
  await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [id]);
}

export async function closeConversation(id: string): Promise<ConversationRow | null> {
  const { rows } = await query<ConversationRow>(
    `UPDATE conversations SET status = 'closed', updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

// ---------- Messages ----------

export async function insertMessage(params: {
  conversationId: string;
  senderId: string;
  messageType: string;
  content: string;
  mediaAssetId?: string | null;
}): Promise<MessageRow> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<MessageRow>(
      `INSERT INTO messages (conversation_id, sender_id, message_type, content, media_asset_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.conversationId, params.senderId, params.messageType, params.content, params.mediaAssetId ?? null]
    );
    await client.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [params.conversationId]);
    return rows[0];
  });
}

export async function listMessages(params: {
  conversationId: string;
  before?: string;
  limit: number;
}): Promise<MessageRow[]> {
  const conditions = [`conversation_id = $1`];
  const values: unknown[] = [params.conversationId];
  let idx = 2;
  if (params.before) {
    conditions.push(`created_at < (SELECT created_at FROM messages WHERE id = $${idx++})`);
    values.push(params.before);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await query<MessageRow>(
    `SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT $${idx++}`,
    [...values, params.limit]
  );
  return rows.reverse(); // kembalikan terlama -> terbaru
}

export async function findMessageById(id: string): Promise<MessageRow | null> {
  const { rows } = await query<MessageRow>(`SELECT * FROM messages WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function markMessagesRead(params: {
  conversationId: string;
  userId: string;
  upToMessageId: string;
}): Promise<void> {
  await query(
    `INSERT INTO message_reads (message_id, user_id, read_at)
     SELECT m.id, $2, now()
     FROM messages m
     WHERE m.conversation_id = $1
       AND m.created_at <= (SELECT created_at FROM messages WHERE id = $3)
     ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = now()`,
    [params.conversationId, params.userId, params.upToMessageId]
  );
}
