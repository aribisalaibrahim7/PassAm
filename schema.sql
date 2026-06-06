-- Drop existing tables to recreate them cleanly
drop table if exists public.chat_sessions cascade;
drop table if exists public.upcoming_events cascade;
drop table if exists public.recent_sessions cascade;
drop table if exists public.quiz_attempts cascade;

-- SQL script to run in Supabase SQL Editor to create dedicated database tables.
-- Enables Row Level Security (RLS) so users can only access their own data.

-- 1. Table for Quiz Attempts
create table public.quiz_attempts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    course text not null,
    title text not null,
    grade text not null,
    score integer not null,
    total integer not null,
    time timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_attempts enable row level security;

create policy "Users can perform all actions on their own quiz attempts" 
on public.quiz_attempts 
for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);


-- 2. Table for Recent Sessions
create table public.recent_sessions (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    course text not null,
    title text not null,
    detail text not null,
    time text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recent_sessions enable row level security;

create policy "Users can perform all actions on their own recent sessions" 
on public.recent_sessions 
for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_recent_sessions_user_id on public.recent_sessions(user_id);


-- 3. Table for Upcoming Events
create table public.upcoming_events (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    type text not null,
    time timestamp with time zone not null,
    duration integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.upcoming_events enable row level security;

create policy "Users can perform all actions on their own upcoming events" 
on public.upcoming_events 
for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_upcoming_events_user_id on public.upcoming_events(user_id);


-- 4. Table for Chat Sessions
create table public.chat_sessions (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    messages jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_sessions enable row level security;

create policy "Users can perform all actions on their own chat sessions" 
on public.chat_sessions 
for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
