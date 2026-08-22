create table if not exists public.birthday_public_settings (
  setting_key varchar(24) primary key check (setting_key = 'public'),
  is_enabled boolean not null default true,
  candle_prompt varchar(120) not null default 'آرزو کن و شمع را فوت کن',
  background_color varchar(7) not null default '#8D1F85' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);

insert into public.birthday_public_settings (setting_key, is_enabled, candle_prompt, background_color)
values ('public', true, 'آرزو کن و شمع را فوت کن', '#8D1F85')
on conflict (setting_key) do nothing;

alter table public.birthday_public_settings enable row level security;
