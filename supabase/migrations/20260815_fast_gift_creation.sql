alter table public.gifts
  add column if not exists creator_token_hash varchar(128),
  add column if not exists creator_token_expires_at timestamptz;

create index if not exists gifts_creator_token_expiry_idx
  on public.gifts (creator_token_expires_at)
  where creator_token_expires_at is not null;
