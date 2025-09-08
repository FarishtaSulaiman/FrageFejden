import { http } from "../../lib/http";


export type UUID = string;

export type DuelStatus = string; 
export type DuelResult = string; 
export type QuestionType = string; 
export type Difficulty = string; 

export interface CreateDuelRequest {
  subjectId: UUID;
  levelId?: UUID | null;
  bestOf?: number;
}

export interface InviteToDuelRequest {
  duelId: UUID;
  inviteeId: UUID;
}

export interface DuelActionRequest {
  duelId: UUID;
}

export interface SubmitDuelAnswerRequest {
  duelId: UUID;
  questionId: UUID;
  selectedOptionId?: UUID | null;
  timeMs: number;
}


export interface SubjectDto {
  id: UUID;
  name: string;
  description?: string | null;
}

export interface LevelDto {
  id: UUID;
  levelNumber: number;
  title?: string | null;
  minXpUnlock: number;
}

export interface UserDto {
  id: UUID;
  fullName: string;
  avatarUrl?: string | null;
}

export interface QuestionOptionDto {
  id: UUID;
  optionText: string;
  sortOrder: number;
}

export interface QuestionDto {
  id: UUID;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  explanation?: string | null;
  options: QuestionOptionDto[];
}

export interface DuelRoundDto {
  id: UUID;
  roundNumber: number;
  question: QuestionDto;
  timeLimitSeconds: number;
}

export interface DuelParticipantDto {
  id: UUID;
  user: UserDto;
  invitedBy?: UserDto | null;
  score: number;
  result?: DuelResult | null;
  isCurrentUser: boolean;
}

export interface DuelDto {
  id: UUID;
  subject: SubjectDto;
  level?: LevelDto | null;
  status: DuelStatus;
  bestOf: number;
  startedAt?: string | null; 
  endedAt?: string | null;   
  participants: DuelParticipantDto[];
  rounds: DuelRoundDto[];
  currentRound?: DuelRoundDto | null;
}

export interface DuelInvitationDto {
  id: UUID;
  subject: SubjectDto;
  level?: LevelDto | null;
  invitedBy: UserDto;
  bestOf: number;
  createdAt: string; 
}

export interface ClassmateDto {
  id: UUID;
  fullName: string;
  avatarUrl?: string | null;
  isAvailable: boolean;
}

export interface DuelStatsDto {
  totalDuels: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
}

const basePath = "/api/duel";

export const DuelApi = {
  /** Skapar en duel */
  createDuel(payload: CreateDuelRequest) {
    return http.post<DuelDto>(`${basePath}`, payload);
  },

  /** POST /api/duel/invite — Bjud in en Classmedlem */
  invite(payload: InviteToDuelRequest) {
    return http.post<{ message: string }>(`${basePath}/invite`, payload);
  },

  /** POST /api/duel/accept — Acepptera en inbjudan */
  accept(payload: DuelActionRequest) {
    return http.post<{ message: string }>(`${basePath}/accept`, payload);
  },

  /** POST /api/duel/decline — Decline en inbjudan */
  decline(payload: DuelActionRequest) {
    return http.post<{ message: string }>(`${basePath}/decline`, payload);
  },

  /** POST /api/duel/{duelId}/start — starta en redo duel */
  start(duelId: UUID) {
    return http.post<{ message: string }>(`${basePath}/${duelId}/start`, {});
  },

  /** POST /api/duel/answer — skicka ett svar för den aktiva frågan */
  submitAnswer(payload: SubmitDuelAnswerRequest) {
    return http.post<{ message: string }>(`${basePath}/answer`, payload);
  },

  /** GET /api/duel/{duelId} — hämta en specific duel */
  getById(duelId: UUID) {
    return http.get<DuelDto>(`${basePath}/${duelId}`);
  },

  /** GET /api/duel?status= — få användarens dueler, kan filtrera med satus */
  list(params?: { status?: DuelStatus }) {
    return http.get<DuelDto[]>(`${basePath}`,{ params });
  },

  /** GET /api/duel/invitations — väntande inbjudningar */
  invitations() {
    return http.get<DuelInvitationDto[]>(`${basePath}/invitations`);
  },

  /** GET /api/duel/classmates/{subjectId} — klasskamrater som man kan bjuda in */
  classmates(subjectId: UUID) {
    return http.get<ClassmateDto[]>(`${basePath}/classmates/${subjectId}`);
  },

  /** GET /api/duel/stats?subjectId= —användarens duel statestik */
  stats(subjectId?: UUID) {
    const params = subjectId ? { subjectId } : undefined;
    return http.get<DuelStatsDto>(`${basePath}/stats`, { params });
  },

  /** POST /api/duel/{duelId}/complete — Markera en duel som färdig (admin/system) */
  complete(duelId: UUID) {
    return http.post<{ message: string }>(`${basePath}/${duelId}/complete`, {});
  },
};


export const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));


