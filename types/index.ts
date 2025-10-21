export type UserRole = 'startup' | 'investor';

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type StartupProfile = {
  id: string;
  user_id: string;
  company_name: string;
  sector: string;
  location: string;
  stage: string;
  funding_goal: number;
  description: string;
  logo_url?: string;
  pitch_deck_url?: string;
  website?: string;
  team_size?: number;
  founded_year?: number;
  created_at: string;
  updated_at: string;
};

export type InvestorProfile = {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  investor_type: string;
  location: string;
  investment_range_min?: number;
  investment_range_max?: number;
  sectors_of_interest: string[];
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export type ProfileView = {
  id: string;
  startup_id: string;
  viewer_id: string;
  viewed_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  tier: 'basic' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
};

export type MediaType = 'image' | 'video' | 'document';

export type StartupMedia = {
  id: string;
  startup_id: string;
  media_type: MediaType;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};
