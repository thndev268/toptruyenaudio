-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create ENUM types matching the frontend
create type user_role as enum ('USER', 'CREATOR', 'PARTNER', 'REVIEWER', 'ADMIN');
create type user_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED');
create type membership_tier as enum ('FREE', 'PREMIUM');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text unique not null check (char_length(username) >= 3 and char_length(username) <= 30),
  email text not null,
  avatar_url text,
  bio text,
  role user_role default 'USER'::user_role not null,
  membership_tier membership_tier default 'FREE'::membership_tier not null,
  status user_status default 'ACTIVE'::user_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create trigger function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for updated_at
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _username text;
  _full_name text;
begin
  -- Generate a basic username from email if not provided in raw_user_meta_data
  _username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
  );
  
  _full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    _username,
    _full_name,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to automatically create profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
