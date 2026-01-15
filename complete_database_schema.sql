-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.author_payout_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  status text NOT NULL DEFAULT 'requested'::text CHECK (status = ANY (ARRAY['requested'::text, 'approved'::text, 'rejected'::text, 'processing'::text, 'paid'::text])),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  admin_id uuid,
  admin_note text,
  payment_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT author_payout_requests_pkey PRIMARY KEY (id),
  CONSTRAINT author_payout_requests_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT author_payout_requests_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
CREATE TABLE public.author_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name character varying,
  email character varying,
  phone character varying,
  experience_years integer CHECK (experience_years >= 0),
  qualification text,
  subjects ARRAY,
  reason text,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT author_requests_pkey PRIMARY KEY (id),
  CONSTRAINT author_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT author_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject_id uuid,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  enabled boolean DEFAULT true,
  order_index integer,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  pdf_id uuid,
  amount numeric,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text])),
  payment_reference text,
  created_at timestamp with time zone DEFAULT now(),
  payment_id text,
  purchase_type text DEFAULT 'user'::text CHECK (purchase_type = ANY (ARRAY['user'::text, 'guest'::text])),
  guest_email text,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  payment_amount numeric,
  payment_failed_reason text,
  payment_completed_at timestamp with time zone,
  payment_gateway character varying DEFAULT 'razorpay'::character varying CHECK (payment_gateway::text = ANY (ARRAY['razorpay'::character varying, 'stripe'::character varying]::text[])),
  stripe_payment_intent_id text,
  client_secret text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payments_enabled boolean DEFAULT true,
  currency text DEFAULT 'INR'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  razorpay_enabled boolean DEFAULT true,
  stripe_enabled boolean DEFAULT false,
  stripe_secret_key text,
  stripe_publishable_key text,
  razorpay_key_id text,
  razorpay_key_secret text,
  CONSTRAINT payment_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pdfs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0.00,
  pdf_url text NOT NULL,
  preview_image_url text,
  author_id uuid,
  status text NOT NULL DEFAULT 'published'::text,
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  total_earnings numeric DEFAULT 0.00,
  cleared_earnings numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subject_id uuid,
  category_id uuid,
  is_premium boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  original_price numeric,
  CONSTRAINT pdfs_pkey PRIMARY KEY (id),
  CONSTRAINT pdfs_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT pdfs_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT pdfs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'author'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  is_author boolean DEFAULT true,
  email text,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  enabled boolean DEFAULT true,
  order_index integer,
  category_id uuid,
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT subjects_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  full_name character varying,
  avatar_url character varying,
  phone character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);