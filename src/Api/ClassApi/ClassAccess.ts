// src/Api/ClassApi/ClassAccess.ts
import { http } from "../../lib/http";

type ValidateJoinCodeRaw = {
  IsValid?: boolean; isValid?: boolean;
  ClassId?: string; classId?: string;
  ClassName?: string; className?: string;
  Message?: string; message?: string;
};

export type ValidateJoinCodeResp = {
  isValid: boolean;
  classId?: string;
  className?: string;
  message?: string;
};

// shape is flexible; we try multiple common keys
export type JoinResp = {
  id?: string; Id?: string;
  classId?: string; ClassId?: string;
  // ...any other fields your backend returns
};

export const ClassAccess = {
  async validateJoinCode(joinCode: string): Promise<ValidateJoinCodeResp> {
    const { data } = await http.get<ValidateJoinCodeRaw>(
      `/Class/validate-joincode/${encodeURIComponent(joinCode)}`
    );
    return {
      isValid: (data.isValid ?? data.IsValid) ?? false,
      classId: data.classId ?? data.ClassId,
      className: data.className ?? data.ClassName,
      message: data.message ?? data.Message,
    };
  },

  async join(joinCode: string): Promise<JoinResp> {
    const { data } = await http.post<JoinResp>(`/Class/join`, { joinCode });
    return data;
  },
};
