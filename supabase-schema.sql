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
