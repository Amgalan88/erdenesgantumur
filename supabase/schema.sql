-- =====================================================================
--  ЭРДЭНЭС ГАН ТӨМӨР — Дотоод ERP өгөгдлийн сан (Supabase / Postgres)
--  Энэ файлыг Supabase Dashboard → SQL Editor → New query руу бүхэлд нь
--  хуулж тавиад RUN дарна. Дахин ажиллуулж болохуйц (idempotent) бичсэн.
-- =====================================================================

-- ---------- 1. Хэрэглэгчийн төрөл (роль) ----------
do $$ begin
  create type public.user_role as enum ('superadmin', 'director', 'staff');
exception when duplicate_object then null; end $$;

-- ---------- 2. Хэрэглэгчийн профайл ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       public.user_role not null default 'staff',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. Модуль тус бүрийн эрх ----------
-- module: 'documents' (ирсэн/явсан бичиг), 'files' (бичиг баримт)
create table if not exists public.module_permissions (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  module     text not null,
  can_view   boolean not null default false,
  can_create boolean not null default false,
  can_edit   boolean not null default false,
  primary key (user_id, module)
);

-- ---------- 4. Ирсэн / явсан бичиг ----------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  direction    text not null check (direction in ('in','out')), -- in=ирсэн, out=явсан
  doc_number   text,
  doc_date     date,
  title        text not null,
  counterparty text,           -- илгээгч (ирсэн) эсвэл хүлээн авагч (явсан)
  notes        text,
  file_path    text,           -- хавсралт файлын storage зам (заавал биш)
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 5. Бичиг баримт (файл сан) ----------
create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  storage_path text not null,
  size_bytes   bigint,
  uploaded_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

-- ---------- 6. Үйлдлийн бүртгэл (audit log) ----------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  user_email text,
  action     text not null,       -- INSERT / UPDATE / DELETE
  table_name text not null,
  record_id  text,
  details    jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
--  Туслах функцууд (эрх шалгах)
-- =====================================================================
create or replace function public.is_superadmin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin' and p.is_active
  );
$$;

create or replace function public.my_role()
returns public.user_role language sql security definer stable
set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- _module: 'documents' | 'files',  _action: 'view' | 'create' | 'edit'
create or replace function public.has_perm(_module text, _action text)
returns boolean language sql security definer stable
set search_path = public as $$
  select case
    when public.is_superadmin() then true
    when _action = 'view' and public.my_role() = 'director' then true
    else exists (
      select 1 from public.module_permissions mp
      where mp.user_id = auth.uid() and mp.module = _module and (
            (_action = 'view'   and mp.can_view) or
            (_action = 'create' and mp.can_create) or
            (_action = 'edit'   and mp.can_edit))
    )
  end;
$$;

-- =====================================================================
--  Шинэ auth хэрэглэгч үүсэхэд профайл автоматаар үүсгэх
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'staff')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  Үйлдлийн бүртгэл (audit) ба updated_at триггерүүд
-- =====================================================================
create or replace function public.log_audit()
returns trigger language plpgsql security definer
set search_path = public as $$
declare _email text;
begin
  select email into _email from public.profiles where id = auth.uid();
  insert into public.audit_log (user_id, user_email, action, table_name, record_id, details)
  values (
    auth.uid(), _email, tg_op, tg_table_name,
    coalesce(new.id::text, old.id::text),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end; $$;

drop trigger if exists audit_documents on public.documents;
create trigger audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.log_audit();

drop trigger if exists audit_files on public.files;
create trigger audit_files
  after insert or update or delete on public.files
  for each row execute function public.log_audit();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch
  before update on public.documents
  for each row execute function public.touch_updated_at();

-- =====================================================================
--  Row Level Security (RLS) — эрхийн хяналт
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.module_permissions enable row level security;
alter table public.documents          enable row level security;
alter table public.files              enable row level security;
alter table public.audit_log          enable row level security;

-- --- profiles ---
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.is_superadmin() or public.my_role() = 'director'
);
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- --- module_permissions ---
drop policy if exists perms_select on public.module_permissions;
create policy perms_select on public.module_permissions for select using (
  user_id = auth.uid() or public.is_superadmin() or public.my_role() = 'director'
);
drop policy if exists perms_admin_write on public.module_permissions;
create policy perms_admin_write on public.module_permissions for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- --- documents ---
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select
  using (public.has_perm('documents','view'));
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert
  with check (public.has_perm('documents','create'));
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update
  using (public.has_perm('documents','edit')) with check (public.has_perm('documents','edit'));
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete
  using (public.is_superadmin());

-- --- files ---
drop policy if exists files_select on public.files;
create policy files_select on public.files for select
  using (public.has_perm('files','view'));
drop policy if exists files_insert on public.files;
create policy files_insert on public.files for insert
  with check (public.has_perm('files','create'));
drop policy if exists files_update on public.files;
create policy files_update on public.files for update
  using (public.has_perm('files','edit')) with check (public.has_perm('files','edit'));
drop policy if exists files_delete on public.files;
create policy files_delete on public.files for delete
  using (public.is_superadmin());

-- --- audit_log (зөвхөн superadmin/director үзнэ; бичилт зөвхөн триггерээр) ---
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select
  using (public.is_superadmin() or public.my_role() = 'director');

-- =====================================================================
--  Storage bucket (бичиг баримтын файлд) — private
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('docs', 'docs', false)
on conflict (id) do nothing;

drop policy if exists docs_read on storage.objects;
create policy docs_read on storage.objects for select
  using (bucket_id = 'docs' and (public.has_perm('files','view') or public.has_perm('documents','view')));
drop policy if exists docs_write on storage.objects;
create policy docs_write on storage.objects for insert
  with check (bucket_id = 'docs' and (public.has_perm('files','create') or public.has_perm('documents','create')));
drop policy if exists docs_update on storage.objects;
create policy docs_update on storage.objects for update
  using (bucket_id = 'docs' and public.is_superadmin());
drop policy if exists docs_delete on storage.objects;
create policy docs_delete on storage.objects for delete
  using (bucket_id = 'docs' and public.is_superadmin());

-- =====================================================================
--  ДУУСЛАА. Дараа нь эхний superadmin-ээ заана:
--  1) Authentication → Users → Add user (и-мэйл+нууц үг)
--  2) Доорх мөрийг и-мэйлээ тавьж RUN дарна:
--     update public.profiles set role='superadmin' where email='ТАНЫ@MAIL';
-- =====================================================================
