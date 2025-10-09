import { api } from '../client';
import type { Result } from '../types';

export type UserBanInfo = {
  auth: number;
  order: number;
};

export type UserAuthProfile = {
  u_id: string;
  u_name: string | null;
  u_family: string | null;
  u_middle: string | null;
  u_email: string | null;
  u_phone: string | null;
  u_role: string | number;
  u_check_state: string | number;
  u_ban: UserBanInfo;
  u_active: '0' | '1' | 0 | 1;
  u_photo: string | null;
  u_birthday: string | null;
  u_lang: string | null;
  u_currency: string | null;
};

export type UserProfileDetails = Record<string, unknown> | null;

export type UserProfileProps = Record<string, Array<string | number>>;

export type UserDataProfile = {
  u_id: string;
  u_role: string | number;
  u_name: string | null;
  u_family: string | null;
  u_middle: string | null;
  u_phone: string | null;
  u_phone_checked: '0' | '1' | 0 | 1;
  u_email: string | null;
  u_email_checked: '0' | '1' | 0 | 1;
  u_photo: string | null;
  u_lang: string | null;
  u_currency: string | null;
  u_city: string | number | null;
  u_description: string | null;
  u_active: '0' | '1' | 0 | 1;
  u_birthday: string | null;
  u_details: UserProfileDetails;
  b_comments?: Array<string | number>;
  b_services?: Array<string | number>;
  b_location_classes?: unknown;
  u_ban: UserBanInfo;
  props?: UserProfileProps;
};

export type UserProfile = {
  auth_user: UserAuthProfile;
  data: {
    user: Record<string, UserDataProfile>;
  };
};

export type UpdateProfilePayload = {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  u_description?: string;
  details?: Record<string, any>;
};

export type UpdatePasswordPayload = {
  password: string;
  new_password: string;
};

export async function getProfile(): Promise<Result<UserProfile>> {
  return api.get<UserProfile>('user/authorized');
}

export async function updateProfile(data: UpdateProfilePayload, id?: number, asAdmin?: boolean): Promise<Result<UserProfile>> {
  const formattedDetails = Object.entries(data.details || {}).map(
    ([key, value]) =>
      value !== null || value !== undefined
        ? ['=', [key], value]
        : ['=', [key], []],
  );

  return api.post<UserProfile>('user', {
    ...(asAdmin ? { u_a_id: id } : {}),
    data: JSON.stringify({
      u_name: data.name,
      u_family: data.lastname,
      u_phone: data.phone,
      u_email: data.email,
      u_description: data.u_description,
      ...(data.details ? { u_details: formattedDetails } : {}),
    }),
  });
}

export async function deleteAccount(): Promise<Result<void>> {
  return api.delete<void>('user/delete-account');
}

export async function updatePassword(data: UpdatePasswordPayload): Promise<Result<void>> {
  return api.post<void>('newpass', {
    password: data.password,
    new_password: data.new_password,
  });
}

export async function updateProfilePhoto(photo: string): Promise<Result<void>> {
  return api.post<void>('user', {
    data: JSON.stringify({
      u_photo: photo,
    }),
  });
}