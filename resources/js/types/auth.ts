export type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at: string | null;
  two_factor_enabled_at: string | null;
  locale: 'en' | 'id';
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Auth = {
  user: User | null;
};
