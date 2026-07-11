exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE user_role AS ENUM (
      'super_admin', 'owner', 'admin', 'customer', 'toko'
    );
    CREATE TYPE seller_type AS ENUM (
      'admin', 'customer', 'toko'
    );
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
    CREATE TYPE document_status AS ENUM ('not_verified', 'verified', 'rejected');
    CREATE TYPE listing_status AS ENUM ('draft', 'published', 'sold', 'archived');
    CREATE TYPE part_condition AS ENUM ('baru', 'bekas');
    CREATE TYPE visit_request_status AS ENUM ('requested', 'scheduled', 'completed', 'cancelled');
    CREATE TYPE photo_moderation_status AS ENUM ('pending_review', 'published', 'rejected');
    CREATE TYPE conversation_status AS ENUM ('open', 'closed');
    CREATE TYPE participant_type AS ENUM ('customer', 'admin', 'toko');
    CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
    CREATE TYPE product_type AS ENUM ('vehicle', 'spare_part');
    CREATE TYPE transaction_status AS ENUM (
      'pending_payment', 'payment_verified', 'funds_held',
      'released_to_seller', 'disputed', 'resolved',
      'cancelled', 'refunded'
    );
    CREATE TYPE lead_source AS ENUM ('contact_form', 'whatsapp_modal');
    CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
    CREATE TYPE doc_type AS ENUM ('ktp', 'stnk', 'bpkb', 'surat_lain', 'foto_kendaraan');
    CREATE TYPE notification_type AS ENUM (
      'chat_message', 'visit_status', 'transaction_status',
      'document_status', 'system'
    );
    -- Enum tambahan dari 02c-addendum-auth-email-brevo.md
    CREATE TYPE email_purpose AS ENUM (
      'email_verification', 'reset_password', 'other'
    );
    CREATE TYPE email_status AS ENUM (
      'sent', 'failed', 'skipped_limit'
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TYPE IF EXISTS email_status;
    DROP TYPE IF EXISTS email_purpose;
    DROP TYPE IF EXISTS notification_type;
    DROP TYPE IF EXISTS doc_type;
    DROP TYPE IF EXISTS article_status;
    DROP TYPE IF EXISTS lead_source;
    DROP TYPE IF EXISTS transaction_status;
    DROP TYPE IF EXISTS product_type;
    DROP TYPE IF EXISTS message_type;
    DROP TYPE IF EXISTS participant_type;
    DROP TYPE IF EXISTS conversation_status;
    DROP TYPE IF EXISTS photo_moderation_status;
    DROP TYPE IF EXISTS visit_request_status;
    DROP TYPE IF EXISTS part_condition;
    DROP TYPE IF EXISTS listing_status;
    DROP TYPE IF EXISTS document_status;
    DROP TYPE IF EXISTS verification_status;
    DROP TYPE IF EXISTS seller_type;
    DROP TYPE IF EXISTS user_role;
  `);
};
