export type UserRole = 'super_admin' | 'owner' | 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  license_plate?: string; // Slipped for internal only, omitted for public
  price: number;
  condition_notes: string;
  description: string;
  location: string;
  status: 'draft' | 'published' | 'sold' | 'archived';
  document_status: 'unverified' | 'verified' | 'rejected';
  verification_checklist?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  photos: VehiclePhoto[];
  visit_photos_published: string[]; // Published visit photo URLs
}

export interface VehiclePhoto {
  id: string;
  vehicle_id: string;
  file_url: string;
  is_cover: boolean;
  sort_order: number;
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  condition: 'new' | 'used';
  price: number;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  photos: SparePartPhoto[];
}

export interface SparePartPhoto {
  id: string;
  spare_part_id: string;
  file_url: string;
  is_cover: boolean;
  sort_order: number;
}

export interface VisitRequest {
  id: string;
  vehicle_id: string;
  customer_id: string;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  scheduled_at?: string;
  location?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number;
    price: number;
  };
  customer?: {
    name: string;
    phone?: string;
  };
  photos?: VisitPhoto[];
}

export interface VisitPhoto {
  id: string;
  visit_request_id: string;
  file_url: string;
  moderation_status: 'pending_review' | 'published' | 'rejected';
  created_at: string;
}

export interface Transaction {
  id: string;
  product_type: 'vehicle' | 'spare_part';
  product_id: string;
  customer_id: string;
  quantity: number;
  status: 'pending_payment' | 'payment_verified' | 'funds_held' | 'released_to_seller' | 'disputed' | 'refunded' | 'cancelled';
  payment_proof_url?: string;
  dispute_reason?: string;
  notes?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  product_details?: {
    name_or_model: string;
    brand_or_category?: string;
    price: number;
  };
  customer?: {
    name: string;
    phone?: string;
  };
}

export interface Lead {
  id: string;
  source: 'contact_form' | 'whatsapp_modal';
  name: string;
  email?: string;
  phone: string;
  message?: string;
  related_product_type?: 'vehicle' | 'spare_part';
  related_product_id?: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  status: 'draft' | 'published';
  seo_title?: string;
  seo_description?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  subject_type?: 'vehicle' | 'spare_part';
  subject_id?: string;
  subject_name?: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    name: string;
    role: UserRole;
  }[];
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  message_type: 'text' | 'image' | 'system';
  media_url?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action_type: string; // 'admin_reset_password', 'verify_document', etc.
  target_entity: string;
  target_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  purpose: 'email_verification' | 'reset_password' | 'other';
  status: 'sent' | 'failed' | 'skipped_limit';
  provider: string;
  provider_message_id?: string;
  error_message?: string;
  related_user_id?: string;
  created_at: string;
}

export interface PlatformSetting {
  key: string;
  value: string;
}
