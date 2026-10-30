create table if not exists public.erika_birthday_content (
  id smallint primary key check (id = 1),
  hero_image_key varchar(512) not null,
  final_letter_image_key varchar(512) not null,
  music_key varchar(512) not null,
  letters jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.erika_birthday_content (id, hero_image_key, final_letter_image_key, music_key, letters)
values (1, '/erika/erika-banner.png', '/erika/letter.png', '/erika/music.mp3', '[]'::jsonb)
on conflict (id) do nothing;

alter table public.erika_birthday_content enable row level security;
revoke all on table public.erika_birthday_content from anon, authenticated;
