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

const basePath = "/duel";
export const DuelApi = {
  /** Skapar en duel */
  async createDuel(payload: CreateDuelRequest): Promise<DuelDto> {
    const { data } = await http.post<DuelDto>(`${basePath}`, payload);
    return data;
  },

  /** Bjud in en klasskamrat */
  async invite(payload: InviteToDuelRequest): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/invite`, payload);
    return data;
  },

  /** Acceptera en inbjudan */
  async accept(payload: DuelActionRequest): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/accept`, payload);
    return data;
  },

  /** Avböj en inbjudan */
  async decline(payload: DuelActionRequest): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/decline`, payload);
    return data;
  },

  /** Starta en redo duel */
  async start(duelId: UUID): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/${duelId}/start`, {});
    return data;
  },

  /** Skicka ett svar */
  async submitAnswer(payload: SubmitDuelAnswerRequest): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/answer`, payload);
    return data;
  },

  /** Hämta specifik duel */
  async getById(duelId: UUID): Promise<DuelDto> {
    const { data } = await http.get<DuelDto>(`${basePath}/${duelId}`);
    return data;
  },

  /** Lista mina dueller (valfri status) */
  async list(params?: { status?: DuelStatus }): Promise<DuelDto[]> {
    const { data } = await http.get<DuelDto[]>(`${basePath}`, { params });
    return data;
  },

  /** Väntande inbjudningar */
  async invitations(): Promise<DuelInvitationDto[]> {
    const { data } = await http.get<DuelInvitationDto[]>(`${basePath}/invitations`);
    return data;
  },

  /** Klasskamrater för ämnet */
  async classmates(subjectId: UUID): Promise<ClassmateDto[]> {
    const { data } = await http.get<ClassmateDto[]>(`${basePath}/classmates/${subjectId}`);
    return data;
  },

  /** Statistik */
  async stats(subjectId?: UUID): Promise<DuelStatsDto> {
    const params = subjectId ? { subjectId } : undefined;
    const { data } = await http.get<DuelStatsDto>(`${basePath}/stats`, { params });
    return data;
  },

  /** Markera som klar (admin/system) */
  async complete(duelId: UUID): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(`${basePath}/${duelId}/complete`, {});
    return data;
  },
};
