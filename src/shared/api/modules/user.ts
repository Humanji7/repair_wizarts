import { api } from '../client';
import type { Result } from '../types';

export type UserProfile = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  avatar?: string;
  is_superuser: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  number_of_submissions: number;
  master?: any;
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