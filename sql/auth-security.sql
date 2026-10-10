create table if not exists public.oauth_login_codes (
  id uuid primary key default gen_random_uuid(),
  "codeHash" varchar(64) not null unique,
  profile jsonb not null,
  "expiresAt" timestamptz not null,
  "consumedAt" timestamptz null,
  "createdAt" timestamptz not null default now()
);

create index if not exists oauth_login_codes_expires_at_idx
  on public.oauth_login_codes ("expiresAt");

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.users(id) on delete cascade,
  "tokenHash" varchar(64) not null unique,
  "expiresAt" timestamptz not null,
  "consumedAt" timestamptz null,
  "createdAt" timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens ("userId");

create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens ("expiresAt");
