export type UserRole = 'client' | 'agent' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: UserRole;
  bio: string;
  created_at: string;
  updated_at: string;
}

export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold';
export type PropertyType = 'house' | 'apartment' | 'villa' | 'land' | 'commercial';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  status: PropertyStatus;
  type: PropertyType;
  beds: number;
  baths: number;
  area: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  features: string[];
  agent_id: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  agent?: Profile | null;
  property_images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export type InquiryStatus = 'new' | 'read' | 'replied' | 'closed';

export interface Inquiry {
  id: string;
  property_id: string;
  user_id: string;
  agent_id: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export type TourStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Tour {
  id: string;
  property_id: string;
  user_id: string;
  agent_id: string | null;
  name: string;
  email: string;
  phone: string;
  scheduled_at: string;
  status: TourStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  author_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export type TeamMemberStatus = 'pending' | 'active';

export interface TeamMember {
  id: string;
  email: string;
  role: UserRole;
  status: TeamMemberStatus;
  full_name: string;
  created_at: string;
  updated_at: string;
}
