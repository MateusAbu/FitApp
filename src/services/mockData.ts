// Banco de dados em memória para simular o Supabase em modo Demo

// ─── Interfaces ───────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  role: 'personal' | 'student';
  full_name: string | null;
  personal_id: string | null;
  invite_code?: string;
  goal?: string;
  plan?: string;
  status?: 'active' | 'inactive';
  adherence?: number;
  last_seen?: string;
  next_session?: string;
  alerts?: number;
  is_premium?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  personal_id: string | null;
}

export interface Workout {
  id: string;
  student_id: string;
  personal_id: string;
  name: string;
  division: string;
  created_at: string;
  estimated_time?: number;
  week_info?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  load: number | null;
  rest_seconds: number;
  sequence_order: number;
  exercises?: {
    name: string;
    category: string;
    description: string;
  };
}

export interface WorkoutTemplate {
  id: string;
  personal_id: string;
  name: string;
  division: string;
  created_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  load: number | null;
  rest_seconds: number;
  sequence_order: number;
  exercises?: {
    name: string;
    category: string;
    description: string;
  };
}

export interface StudentProgress {
  id: string;
  student_id: string;
  personal_id: string | null;
  workout_id: string;
  load: number | null;
  photo_url: string | null;
  notes: string | null;
  feedback_personal?: string | null;
  created_at: string;
}

export interface StudentComment {
  id: string;
  student_id: string;
  personal_id: string;
  author_role: 'personal' | 'student';
  author_name: string;
  message: string;
  created_at: string;
}

// ─── Dados Iniciais: Perfis ───────────────────────────────────

let mockProfiles: Profile[] = [
  {
    id: 'demo-personal-id',
    email: 'personal@fitapp.com',
    role: 'personal',
    full_name: 'Dr. Mateus (Personal Demo)',
    personal_id: null,
    invite_code: 'FIT-1234',
    is_premium: true,
  },
  {
    id: 'demo-student-id',
    email: 'aluno@fitapp.com',
    role: 'student',
    full_name: 'Thiago Silva',
    personal_id: 'demo-personal-id',
    goal: 'Hipertrofia',
    plan: 'Push/Pull/Legs',
    status: 'active',
    adherence: 92,
    last_seen: 'hoje',
    next_session: 'Treino B • Costas',
    alerts: 0,
    is_premium: true,
  },
  {
    id: 'student-1',
    email: 'arthur@exemplo.com',
    role: 'student',
    full_name: 'Arthur Pendragon',
    personal_id: 'demo-personal-id',
    goal: 'Força máxima',
    plan: 'Powerbuilding',
    status: 'active',
    adherence: 96,
    last_seen: 'ontem',
    next_session: 'Treino C • Pernas',
    alerts: 0,
  },
  {
    id: 'student-2',
    email: 'guinevere@exemplo.com',
    role: 'student',
    full_name: 'Guinevere Wood',
    personal_id: 'demo-personal-id',
    goal: 'Perda de gordura',
    plan: 'Full body 3x',
    status: 'active',
    adherence: 78,
    last_seen: '2 dias',
    next_session: 'Treino A • Full body',
    alerts: 1,
  },
  {
    id: 'student-3',
    email: 'lancelot@exemplo.com',
    role: 'student',
    full_name: 'Lancelot Lake',
    personal_id: null,
    goal: 'Reabilitação',
    plan: 'Mobilidade',
    status: 'inactive',
    adherence: 12,
    last_seen: '28 dias',
    next_session: '—',
    alerts: 0,
  },
];

// ─── Dados Iniciais: Exercícios ───────────────────────────────

let mockExercises: Exercise[] = [
  // Peito
  { id: 'ex-1', name: 'Supino Reto', category: 'Peito', description: 'Deitado no banco reto, empurre a barra verticalmente até a extensão total dos braços.', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', personal_id: null },
  { id: 'ex-2', name: 'Supino Inclinado', category: 'Peito', description: 'No banco inclinado a 30-45°, empurre os halteres para cima focando na parte superior do peitoral.', image_url: 'https://images.unsplash.com/photo-1534368786749-b63e05c92717?w=400', personal_id: null },
  { id: 'ex-3', name: 'Crucifixo', category: 'Peito', description: 'Com halteres, abra os braços em arco até sentir alongamento no peitoral e retorne.', image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', personal_id: null },
  { id: 'ex-4', name: 'Crossover', category: 'Peito', description: 'Na polia, cruze os cabos à frente do corpo contraindo o peitoral.', image_url: 'https://images.unsplash.com/photo-1597452485677-d661670d9640?w=400', personal_id: null },

  // Costas
  { id: 'ex-5', name: 'Puxada Pulley', category: 'Costas', description: 'Puxe a barra em direção ao peito mantendo a postura ereta e cotovelos apontando para baixo.', image_url: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400', personal_id: null },
  { id: 'ex-6', name: 'Remada Curvada', category: 'Costas', description: 'Inclinado a 45°, puxe a barra em direção ao abdômen contraindo as escápulas.', image_url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', personal_id: null },
  { id: 'ex-7', name: 'Remada Unilateral', category: 'Costas', description: 'Com um halter, apoie o joelho no banco e puxe o peso até a cintura.', image_url: 'https://images.unsplash.com/photo-1598971639058-a0c1c411e1e6?w=400', personal_id: null },

  // Ombros
  { id: 'ex-8', name: 'Desenvolvimento Halteres', category: 'Ombros', description: 'Sentado, empurre os halteres para cima partindo da linha dos ombros até extensão total.', image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', personal_id: null },
  { id: 'ex-9', name: 'Elevação Lateral', category: 'Ombros', description: 'Em pé, eleve os halteres lateralmente até a altura dos ombros com cotovelos levemente flexionados.', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', personal_id: null },
  { id: 'ex-10', name: 'Elevação Frontal', category: 'Ombros', description: 'Eleve os halteres à frente do corpo até a altura dos ombros, alternando os braços.', image_url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400', personal_id: null },

  // Bíceps
  { id: 'ex-11', name: 'Rosca Direta', category: 'Bíceps', description: 'Com barra EZ, flexione os cotovelos trazendo a barra até os ombros sem balançar o tronco.', image_url: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400', personal_id: null },
  { id: 'ex-12', name: 'Rosca Alternada', category: 'Bíceps', description: 'Com halteres, flexione um braço de cada vez com supinação no topo do movimento.', image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', personal_id: null },
  { id: 'ex-13', name: 'Rosca Martelo', category: 'Bíceps', description: 'Flexione os cotovelos com pegada neutra (palmas voltadas para dentro), ativando o braquial.', image_url: 'https://images.unsplash.com/photo-1587977097449-e8e3b6b91de2?w=400', personal_id: null },

  // Tríceps
  { id: 'ex-14', name: 'Tríceps Pulley', category: 'Tríceps', description: 'Na polia alta, estenda os cotovelos empurrando a barra para baixo sem mover os ombros.', image_url: 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400', personal_id: null },
  { id: 'ex-15', name: 'Tríceps Francês', category: 'Tríceps', description: 'Deitado, segure a barra EZ acima do peito e flexione os cotovelos levando a barra à testa.', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', personal_id: null },
  { id: 'ex-16', name: 'Mergulho', category: 'Tríceps', description: 'Nas paralelas, desça o corpo flexionando os cotovelos e empurre de volta à posição inicial.', image_url: 'https://images.unsplash.com/photo-1598971639058-a0c1c411e1e6?w=400', personal_id: null },

  // Pernas
  { id: 'ex-17', name: 'Agachamento Livre', category: 'Pernas', description: 'Com a barra nos ombros, flexione os joelhos a 90° mantendo os joelhos alinhados com os pés.', image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', personal_id: null },
  { id: 'ex-18', name: 'Leg Press', category: 'Pernas', description: 'Na máquina, empurre a plataforma com os pés até extensão quase total das pernas.', image_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400', personal_id: null },
  { id: 'ex-19', name: 'Cadeira Extensora', category: 'Pernas', description: 'Sentado, estenda os joelhos contra a resistência focando no quadríceps.', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', personal_id: null },
  { id: 'ex-20', name: 'Stiff', category: 'Pernas', description: 'Em pé, incline o tronco à frente com pernas semi-estendidas sentindo o alongamento dos isquiotibiais.', image_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400', personal_id: null },

  // Core
  { id: 'ex-21', name: 'Prancha Isométrica', category: 'Core', description: 'Apoie-se nos antebraços e pés, mantendo o corpo reto por 30-60 segundos.', image_url: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400', personal_id: null },
  { id: 'ex-22', name: 'Abdominal Crunch', category: 'Core', description: 'Deitado, eleve o tronco superior contraindo o abdômen sem forçar o pescoço.', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', personal_id: null },
];

// ─── Dados Iniciais: Fichas de Treino ─────────────────────────

let mockWorkouts: Workout[] = [
  // Fichas do Thiago (demo-student-id)
  {
    id: 'workout-1',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    name: 'Treino A - Peito & Tríceps',
    division: 'A',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_time: 55,
    week_info: 'Semana 3 de 8',
  },
  {
    id: 'workout-2',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    name: 'Treino B - Costas & Bíceps',
    division: 'B',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_time: 62,
    week_info: 'Semana 3 de 8',
  },
  {
    id: 'workout-3',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    name: 'Treino C - Ombros & Core',
    division: 'C',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_time: 40,
    week_info: 'Semana 3 de 8',
  },
  // Fichas do Arthur (student-1)
  {
    id: 'workout-4',
    student_id: 'student-1',
    personal_id: 'demo-personal-id',
    name: 'Treino A - Força Superior',
    division: 'A',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'workout-5',
    student_id: 'student-1',
    personal_id: 'demo-personal-id',
    name: 'Treino B - Força Inferior',
    division: 'B',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Fichas da Guinevere (student-2)
  {
    id: 'workout-6',
    student_id: 'student-2',
    personal_id: 'demo-personal-id',
    name: 'Treino A - Full Body',
    division: 'A',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Dados Iniciais: Exercícios das Fichas ────────────────────

let mockWorkoutExercises: WorkoutExercise[] = [
  // Workout 1 - Peito & Tríceps (Thiago)
  { id: 'we-1', workout_id: 'workout-1', exercise_id: 'ex-1', sets: 4, reps: '10-12', load: 60, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Supino Reto', category: 'Peito', description: 'Deitado no banco reto, empurre a barra verticalmente.' } },
  { id: 'we-2', workout_id: 'workout-1', exercise_id: 'ex-2', sets: 3, reps: '12', load: 20, rest_seconds: 75, sequence_order: 2, exercises: { name: 'Supino Inclinado', category: 'Peito', description: 'No banco inclinado, empurre os halteres para cima.' } },
  { id: 'we-3', workout_id: 'workout-1', exercise_id: 'ex-3', sets: 3, reps: '15', load: 12, rest_seconds: 60, sequence_order: 3, exercises: { name: 'Crucifixo', category: 'Peito', description: 'Com halteres, abra os braços em arco.' } },
  { id: 'we-4', workout_id: 'workout-1', exercise_id: 'ex-4', sets: 3, reps: '12', load: 15, rest_seconds: 60, sequence_order: 4, exercises: { name: 'Crossover', category: 'Peito', description: 'Na polia, cruze os cabos à frente do corpo.' } },
  { id: 'we-5', workout_id: 'workout-1', exercise_id: 'ex-14', sets: 3, reps: '12', load: 25, rest_seconds: 60, sequence_order: 5, exercises: { name: 'Tríceps Pulley', category: 'Tríceps', description: 'Na polia alta, estenda os cotovelos.' } },
  { id: 'we-6', workout_id: 'workout-1', exercise_id: 'ex-15', sets: 3, reps: '10', load: 20, rest_seconds: 60, sequence_order: 6, exercises: { name: 'Tríceps Francês', category: 'Tríceps', description: 'Deitado, flexione os cotovelos levando a barra à testa.' } },

  // Workout 2 - Costas & Bíceps (Thiago)
  { id: 'we-7', workout_id: 'workout-2', exercise_id: 'ex-5', sets: 4, reps: '12', load: 50, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Puxada Pulley', category: 'Costas', description: 'Puxe a barra em direção ao peito.' } },
  { id: 'we-8', workout_id: 'workout-2', exercise_id: 'ex-6', sets: 4, reps: '10', load: 40, rest_seconds: 90, sequence_order: 2, exercises: { name: 'Remada Curvada', category: 'Costas', description: 'Inclinado a 45°, puxe a barra ao abdômen.' } },
  { id: 'we-9', workout_id: 'workout-2', exercise_id: 'ex-7', sets: 3, reps: '12', load: 18, rest_seconds: 60, sequence_order: 3, exercises: { name: 'Remada Unilateral', category: 'Costas', description: 'Com halter, puxe até a cintura.' } },
  { id: 'we-10', workout_id: 'workout-2', exercise_id: 'ex-11', sets: 3, reps: '12', load: 15, rest_seconds: 60, sequence_order: 4, exercises: { name: 'Rosca Direta', category: 'Bíceps', description: 'Com barra EZ, flexione os cotovelos.' } },
  { id: 'we-11', workout_id: 'workout-2', exercise_id: 'ex-13', sets: 3, reps: '10', load: 12, rest_seconds: 60, sequence_order: 5, exercises: { name: 'Rosca Martelo', category: 'Bíceps', description: 'Flexione com pegada neutra.' } },

  // Workout 3 - Ombros & Core (Thiago)
  { id: 'we-12', workout_id: 'workout-3', exercise_id: 'ex-8', sets: 4, reps: '10', load: 16, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Desenvolvimento Halteres', category: 'Ombros', description: 'Empurre os halteres para cima.' } },
  { id: 'we-13', workout_id: 'workout-3', exercise_id: 'ex-9', sets: 3, reps: '15', load: 8, rest_seconds: 60, sequence_order: 2, exercises: { name: 'Elevação Lateral', category: 'Ombros', description: 'Eleve os halteres lateralmente.' } },
  { id: 'we-14', workout_id: 'workout-3', exercise_id: 'ex-21', sets: 3, reps: '45s', load: null, rest_seconds: 45, sequence_order: 3, exercises: { name: 'Prancha Isométrica', category: 'Core', description: 'Mantenha o corpo reto.' } },
  { id: 'we-15', workout_id: 'workout-3', exercise_id: 'ex-22', sets: 3, reps: '20', load: null, rest_seconds: 45, sequence_order: 4, exercises: { name: 'Abdominal Crunch', category: 'Core', description: 'Eleve o tronco contraindo o abdômen.' } },
];

// ─── Dados Iniciais: Templates ────────────────────────────────

let mockWorkoutTemplates: WorkoutTemplate[] = [
  {
    id: 'template-1',
    personal_id: 'demo-personal-id',
    name: 'Iniciante A - Peito & Tríceps',
    division: 'A',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'template-2',
    personal_id: 'demo-personal-id',
    name: 'Iniciante B - Costas & Bíceps',
    division: 'B',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'template-3',
    personal_id: 'demo-personal-id',
    name: 'Intermediário - Full Body',
    division: 'A',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let mockTemplateExercises: TemplateExercise[] = [
  // Template 1 - Iniciante Peito & Tríceps
  { id: 'te-1', template_id: 'template-1', exercise_id: 'ex-1', sets: 3, reps: '12', load: 40, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Supino Reto', category: 'Peito', description: 'Deitado no banco reto.' } },
  { id: 'te-2', template_id: 'template-1', exercise_id: 'ex-3', sets: 3, reps: '15', load: 8, rest_seconds: 60, sequence_order: 2, exercises: { name: 'Crucifixo', category: 'Peito', description: 'Com halteres, abra os braços.' } },
  { id: 'te-3', template_id: 'template-1', exercise_id: 'ex-14', sets: 3, reps: '12', load: 15, rest_seconds: 60, sequence_order: 3, exercises: { name: 'Tríceps Pulley', category: 'Tríceps', description: 'Na polia alta.' } },

  // Template 2 - Iniciante Costas & Bíceps
  { id: 'te-4', template_id: 'template-2', exercise_id: 'ex-5', sets: 3, reps: '12', load: 30, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Puxada Pulley', category: 'Costas', description: 'Puxe a barra ao peito.' } },
  { id: 'te-5', template_id: 'template-2', exercise_id: 'ex-6', sets: 3, reps: '10', load: 25, rest_seconds: 90, sequence_order: 2, exercises: { name: 'Remada Curvada', category: 'Costas', description: 'Inclinado, puxe a barra.' } },
  { id: 'te-6', template_id: 'template-2', exercise_id: 'ex-11', sets: 3, reps: '12', load: 10, rest_seconds: 60, sequence_order: 3, exercises: { name: 'Rosca Direta', category: 'Bíceps', description: 'Flexione os cotovelos.' } },

  // Template 3 - Full Body
  { id: 'te-7', template_id: 'template-3', exercise_id: 'ex-1', sets: 4, reps: '10', load: 50, rest_seconds: 90, sequence_order: 1, exercises: { name: 'Supino Reto', category: 'Peito', description: 'Deitado no banco reto.' } },
  { id: 'te-8', template_id: 'template-3', exercise_id: 'ex-5', sets: 4, reps: '10', load: 40, rest_seconds: 90, sequence_order: 2, exercises: { name: 'Puxada Pulley', category: 'Costas', description: 'Puxe a barra ao peito.' } },
  { id: 'te-9', template_id: 'template-3', exercise_id: 'ex-17', sets: 4, reps: '10', load: 60, rest_seconds: 120, sequence_order: 3, exercises: { name: 'Agachamento Livre', category: 'Pernas', description: 'Com barra nos ombros.' } },
  { id: 'te-10', template_id: 'template-3', exercise_id: 'ex-8', sets: 3, reps: '12', load: 14, rest_seconds: 60, sequence_order: 4, exercises: { name: 'Desenvolvimento Halteres', category: 'Ombros', description: 'Empurre os halteres para cima.' } },
];

// ─── Dados Iniciais: Progresso dos Alunos ─────────────────────

let mockStudentProgress: StudentProgress[] = [
  {
    id: 'progress-1',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    workout_id: 'workout-1',
    load: 65,
    photo_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
    notes: 'Consegui aumentar a carga no supino para 65kg!',
    feedback_personal: 'Excelente progresso, Thiago! Mantenha a cadência.',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'progress-2',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    workout_id: 'workout-2',
    load: 55,
    photo_url: null,
    notes: 'Costas bem fadigadas no pulley. Boa sensação.',
    feedback_personal: 'Ótimo. Próximo treino vamos focar em amplitude.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'progress-3',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    workout_id: 'workout-3',
    load: null,
    photo_url: null,
    notes: 'Prancha de 45s ficou mais fácil hoje.',
    feedback_personal: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'progress-4',
    student_id: 'student-1',
    personal_id: 'demo-personal-id',
    workout_id: 'workout-4',
    load: 70,
    photo_url: 'https://images.unsplash.com/photo-1534368786749-b63e05c92717?w=600',
    notes: 'Supino 70kg na 3ª série com ajuda do spotter.',
    feedback_personal: 'Muito bom Arthur! Semana que vem tenta sem spotter.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'progress-5',
    student_id: 'student-2',
    personal_id: 'demo-personal-id',
    workout_id: 'workout-6',
    load: 40,
    photo_url: null,
    notes: 'Primeiro treino full body, gostei muito!',
    feedback_personal: 'Bem-vinda Guinevere! Vamos evoluir juntos.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Dados Iniciais: Comentários ──────────────────────────────

let mockStudentComments: StudentComment[] = [
  {
    id: 'comment-1',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    author_role: 'student',
    author_name: 'Thiago Silva',
    message: 'Estou sentindo uma dor leve no ombro direito durante o supino. O que devo fazer?',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-2',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    author_role: 'personal',
    author_name: 'Dr. Mateus',
    message: 'Thiago, vamos reduzir a carga do supino e focar na técnica por 2 semanas. Adicione gelo após o treino.',
    created_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-3',
    student_id: 'demo-student-id',
    personal_id: 'demo-personal-id',
    author_role: 'student',
    author_name: 'Thiago Silva',
    message: 'Entendido! Melhorou bastante após o gelo. Obrigado!',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-4',
    student_id: 'student-1',
    personal_id: 'demo-personal-id',
    author_role: 'student',
    author_name: 'Arthur Pendragon',
    message: 'Posso treinar 5x na semana ou é demais?',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-5',
    student_id: 'student-1',
    personal_id: 'demo-personal-id',
    author_role: 'personal',
    author_name: 'Dr. Mateus',
    message: 'Arthur, com seu nível atual, 4x é o ideal. Semana que vem revisamos.',
    created_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Novas Tabelas Mock: Medidas e Documentos ───────────────────

interface StudentMeasurement {
  id: string;
  student_id: string;
  weight: number;
  fat_percent: number;
  biceps_left: number;
  biceps_right: number;
  forearm_left: number;
  forearm_right: number;
  chest: number;
  waist: number;
  hips: number;
  thigh_left: number;
  thigh_right: number;
  calf_left: number;
  calf_right: number;
  created_at: string;
}

interface StudentDocument {
  id: string;
  student_id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

let mockStudentMeasurements: StudentMeasurement[] = [
  {
    id: 'measure-1',
    student_id: 'demo-student-id',
    weight: 67.1,
    fat_percent: 24.8,
    biceps_left: 32,
    biceps_right: 32.5,
    forearm_left: 28,
    forearm_right: 28.5,
    chest: 98,
    waist: 82,
    hips: 95,
    thigh_left: 56,
    thigh_right: 56.5,
    calf_left: 36,
    calf_right: 36.5,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'measure-2',
    student_id: 'demo-student-id',
    weight: 64.8,
    fat_percent: 22.1,
    biceps_left: 33.2,
    biceps_right: 33.5,
    forearm_left: 28.5,
    forearm_right: 29.0,
    chest: 99.5,
    waist: 79.5,
    hips: 93.8,
    thigh_left: 57.2,
    thigh_right: 57.5,
    calf_left: 36.5,
    calf_right: 36.8,
    created_at: new Date().toISOString(),
  }
];

let mockStudentDocuments: StudentDocument[] = [
  {
    id: 'doc-1',
    student_id: 'demo-student-id',
    name: 'Plano Alimentar - Hipertrofia.pdf',
    url: 'https://placeholder.pdf/plano_alimentar',
    type: 'plano_alimentar',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-2',
    student_id: 'demo-student-id',
    name: 'Exames de Sangue - Maio.pdf',
    url: 'https://placeholder.pdf/exames',
    type: 'documento_medico',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// ─── Funções de Acesso ────────────────────────────────────────

export const getMockDataForTable = (tableName: string): any[] => {
  switch (tableName) {
    case 'profiles':
      return [...mockProfiles];
    case 'exercises':
      return [...mockExercises];
    case 'workouts':
      return [...mockWorkouts];
    case 'workout_exercises':
      return [...mockWorkoutExercises];
    case 'workout_templates':
      return [...mockWorkoutTemplates];
    case 'template_exercises':
      return [...mockTemplateExercises];
    case 'student_progress':
      return [...mockStudentProgress];
    case 'student_comments':
      return [...mockStudentComments];
    case 'student_measurements':
      return [...mockStudentMeasurements];
    case 'student_documents':
      return [...mockStudentDocuments];
    default:
      return [];
  }
};

export const addMockDataItem = (tableName: string, item: any) => {
  switch (tableName) {
    case 'profiles':
      mockProfiles = [...mockProfiles, item];
      break;
    case 'exercises':
      mockExercises = [...mockExercises, item];
      break;
    case 'workouts':
      mockWorkouts = [...mockWorkouts, item];
      break;
    case 'workout_exercises':
      mockWorkoutExercises = [...mockWorkoutExercises, item];
      break;
    case 'workout_templates':
      mockWorkoutTemplates = [...mockWorkoutTemplates, item];
      break;
    case 'template_exercises':
      mockTemplateExercises = [...mockTemplateExercises, item];
      break;
    case 'student_progress':
      mockStudentProgress = [...mockStudentProgress, item];
      break;
    case 'student_comments':
      mockStudentComments = [...mockStudentComments, item];
      break;
    case 'student_measurements':
      mockStudentMeasurements = [...mockStudentMeasurements, item];
      break;
    case 'student_documents':
      mockStudentDocuments = [...mockStudentDocuments, item];
      break;
  }
};

export const updateMockDataItem = (tableName: string, id: string, values: any) => {
  const updateItem = (list: any[]) =>
    list.map((item) => (item.id === id ? { ...item, ...values } : item));

  switch (tableName) {
    case 'profiles':
      mockProfiles = updateItem(mockProfiles);
      break;
    case 'exercises':
      mockExercises = updateItem(mockExercises);
      break;
    case 'workouts':
      mockWorkouts = updateItem(mockWorkouts);
      break;
    case 'workout_exercises':
      mockWorkoutExercises = updateItem(mockWorkoutExercises);
      break;
    case 'workout_templates':
      mockWorkoutTemplates = updateItem(mockWorkoutTemplates);
      break;
    case 'template_exercises':
      mockTemplateExercises = updateItem(mockTemplateExercises);
      break;
    case 'student_progress':
      mockStudentProgress = updateItem(mockStudentProgress);
      break;
    case 'student_comments':
      mockStudentComments = updateItem(mockStudentComments);
      break;
    case 'student_measurements':
      mockStudentMeasurements = updateItem(mockStudentMeasurements);
      break;
    case 'student_documents':
      mockStudentDocuments = updateItem(mockStudentDocuments);
      break;
  }
};

export const deleteMockDataItem = (tableName: string, id: string) => {
  const filterItem = (list: any[]) => list.filter((item) => item.id !== id);

  switch (tableName) {
    case 'profiles':
      mockProfiles = filterItem(mockProfiles);
      break;
    case 'exercises':
      mockExercises = filterItem(mockExercises);
      break;
    case 'workouts':
      mockWorkouts = filterItem(mockWorkouts);
      break;
    case 'workout_exercises':
      mockWorkoutExercises = filterItem(mockWorkoutExercises);
      break;
    case 'workout_templates':
      mockWorkoutTemplates = filterItem(mockWorkoutTemplates);
      break;
    case 'template_exercises':
      mockTemplateExercises = filterItem(mockTemplateExercises);
      break;
    case 'student_progress':
      mockStudentProgress = filterItem(mockStudentProgress);
      break;
    case 'student_comments':
      mockStudentComments = filterItem(mockStudentComments);
      break;
    case 'student_measurements':
      mockStudentMeasurements = filterItem(mockStudentMeasurements);
      break;
    case 'student_documents':
      mockStudentDocuments = filterItem(mockStudentDocuments);
      break;
  }
};
