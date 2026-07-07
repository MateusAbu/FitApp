-- Habilitar a extensão uuid-ossp caso não esteja ativa
create extension if not exists "uuid-ossp";

-- 1. Criação do Enum para perfis de acesso (Roles)
create type user_role as enum ('personal', 'student');

-- 2. Tabela de Perfis (Profiles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role not null default 'student',
  full_name text,
  personal_id uuid references public.profiles(id) on delete set null,
  invite_code text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Configurações de Marca / Tema do Personal (White-label)
create table public.personal_themes (
  personal_id uuid references public.profiles(id) on delete cascade primary key,
  brand_name text not null,
  logo_url text,
  primary_color varchar(7) not null default '#007AFF',
  secondary_color varchar(7) not null default '#5856D6',
  background_color varchar(7) not null default '#FFFFFF',
  text_color varchar(7) not null default '#1C1C1E',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Exercícios (Exercises)
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  video_url text,
  category text, -- Peito, Costas, Pernas, etc.
  personal_id uuid references public.profiles(id) on delete cascade, -- Nulo se for exercício global padrão
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Fichas de Treino (Workouts)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  name text not null, -- Ex: Ficha Hipertrofia A
  division char(1) not null default 'A', -- A, B, C, D, etc.
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabela de Relacionamento/Detalhes de Exercício no Treino (Workout Exercises)
create table public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sets integer not null default 3,
  reps varchar(20) not null default '12',
  load numeric(6, 2), -- Carga em kg
  rest_seconds integer not null default 60,
  advanced_notes text,
  sequence_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabela de Evoluções e Histórico (Student Progress / Evolution)
create table public.student_progress (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete set null,
  workout_id uuid references public.workouts(id) on delete set null,
  load numeric(6, 2),
  notes text,
  photo_url text,
  feedback_personal text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.personal_themes enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.student_progress enable row level security;

-- POLÍTICAS DE SEGURANÇA (RLS)

-- Perfis:
-- Qualquer usuário autenticado pode ler perfis (para verificar convites e carregar temas)
create policy "Allow read access to profiles for authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Apenas o próprio usuário pode alterar seu próprio perfil
create policy "Allow update for users own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Temas:
-- Qualquer usuário autenticado pode ler temas
create policy "Allow read access to themes for authenticated users"
  on public.personal_themes for select
  to authenticated
  using (true);

-- Apenas o Personal associado pode inserir ou atualizar seu próprio tema
create policy "Allow personal insert/update their theme"
  on public.personal_themes for all
  to authenticated
  using (auth.uid() = personal_id)
  with check (auth.uid() = personal_id);

-- Exercícios:
-- Usuários podem ler exercícios globais (personal_id is null) ou os criados pelo seu respectivo Personal Trainer
create policy "Allow read access to exercises"
  on public.exercises for select
  to authenticated
  using (personal_id is null or personal_id = auth.uid() or personal_id = (select personal_id from public.profiles where id = auth.uid()));

-- Apenas Personals podem inserir/editar seus próprios exercícios
create policy "Allow personal insert/update exercises"
  on public.exercises for all
  to authenticated
  using (auth.uid() = personal_id)
  with check (auth.uid() = personal_id);

-- Fichas de Treino (Workouts):
-- Personal pode gerenciar treinos onde ele é o personal_id. Aluno pode ver treinos onde ele é o student_id.
create policy "Allow read/write access to workouts"
  on public.workouts for all
  to authenticated
  using (auth.uid() = personal_id or auth.uid() = student_id)
  with check (auth.uid() = personal_id or auth.uid() = student_id);

-- Exercícios na Ficha (Workout Exercises):
create policy "Allow read/write access to workout_exercises"
  on public.workout_exercises for all
  to authenticated
  using (
    exists (
      select 1 from public.workouts w 
      where w.id = workout_id and (w.personal_id = auth.uid() or w.student_id = auth.uid())
    )
  );

-- Progresso do Aluno (Student Progress):
create policy "Allow read/write access to student_progress"
  on public.student_progress for all
  to authenticated
  using (auth.uid() = personal_id or auth.uid() = student_id)
  with check (auth.uid() = personal_id or auth.uid() = student_id);

-- 8. Tabela de Templates de Fichas (Workout Templates)
create table public.workout_templates (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  division char(1) not null default 'A',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Tabela de Relacionamento de Exercícios em Templates (Template Exercises)
create table public.template_exercises (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.workout_templates(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sets integer not null default 3,
  reps varchar(20) not null default '12',
  load numeric(6, 2),
  rest_seconds integer not null default 60,
  sequence_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Tabela de Comentários / Chat (Student Comments)
create table public.student_comments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  author_role user_role not null,
  author_name text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Tabela de Medidas Corporais (Student Measurements)
create table public.student_measurements (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  weight numeric(5, 2) not null,
  fat_percent numeric(4, 2),
  chest numeric(5, 2),
  waist numeric(5, 2),
  hips numeric(5, 2),
  biceps_left numeric(4, 2),
  biceps_right numeric(4, 2),
  forearm_left numeric(4, 2),
  forearm_right numeric(4, 2),
  thigh_left numeric(4, 2),
  thigh_right numeric(4, 2),
  calf_left numeric(4, 2),
  calf_right numeric(4, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Tabela de Documentos Compartilhados (Student Documents)
create table public.student_documents (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null, -- 'diet', 'exam', 'training'
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS nas novas tabelas
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.student_comments enable row level security;
alter table public.student_measurements enable row level security;
alter table public.student_documents enable row level security;

-- POLÍTICAS DE SEGURANÇA (RLS) PARA AS NOVAS TABELAS

-- Workout Templates:
create policy "Allow read/write access to workout_templates"
  on public.workout_templates for all
  to authenticated
  using (auth.uid() = personal_id)
  with check (auth.uid() = personal_id);

-- Template Exercises:
create policy "Allow read/write access to template_exercises"
  on public.template_exercises for all
  to authenticated
  using (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.personal_id = auth.uid()
    )
  );

-- Student Comments:
create policy "Allow read/write access to student_comments"
  on public.student_comments for all
  to authenticated
  using (auth.uid() = personal_id or auth.uid() = student_id)
  with check (auth.uid() = personal_id or auth.uid() = student_id);

-- Student Measurements:
create policy "Allow select access to measurements"
  on public.student_measurements for select
  to authenticated
  using (
    auth.uid() = student_id or 
    exists (
      select 1 from public.profiles p 
      where p.id = student_id and p.personal_id = auth.uid()
    )
  );

create policy "Allow insert access to measurements"
  on public.student_measurements for insert
  to authenticated
  with check (auth.uid() = student_id);

-- Student Documents:
create policy "Allow select access to documents"
  on public.student_documents for select
  to authenticated
  using (
    auth.uid() = student_id or 
    exists (
      select 1 from public.profiles p 
      where p.id = student_id and p.personal_id = auth.uid()
    )
  );

create policy "Allow insert/delete access to documents"
  on public.student_documents for all
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);


-- ─────────────────────────────────────────────────────────────
-- Criação automática do perfil no cadastro
-- ─────────────────────────────────────────────────────────────
-- Cria a linha em profiles quando um novo usuário entra no Auth.
-- SECURITY DEFINER: ignora RLS e resolve o convite no servidor,
-- então não depende de sessão/política de INSERT no cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'student');
  v_personal_id uuid;
  v_invite_code text;
begin
  if v_role = 'student' then
    -- Resolve o Personal pelo código de convite informado no cadastro
    select id into v_personal_id
    from public.profiles
    where invite_code = upper(new.raw_user_meta_data->>'invite_code')
      and role = 'personal';
    if v_personal_id is null then
      raise exception 'Código de convite inválido';
    end if;
  else
    -- Personal recebe um código de convite próprio
    v_invite_code := upper(substr(md5(random()::text), 1, 6));
  end if;

  insert into public.profiles (id, email, role, full_name, personal_id, invite_code)
  values (
    new.id,
    new.email,
    v_role,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_personal_id,
    v_invite_code
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
