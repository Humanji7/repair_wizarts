import { api } from '../client';
import type { Result } from '../types';

export type EmailVerificationResponse = {
  result: string;
  message?: string;
};

export type PhoneVerificationResponse = {
  result: string;
  message?: string;
};

export type EmailCodeVerificationResponse = {
  result: string;
  user_id?: number;
  email_verified?: boolean;
};

export type PhoneCodeVerificationResponse = {
  result: string;
  user_id?: number;
  phone_verified?: boolean;
};

export async function sendEmailVerification(): Promise<Result<EmailVerificationResponse>> {
  return api.post<EmailVerificationResponse>('email/verification/start');
}

export async function verifyEmailCode(code: string): Promise<Result<EmailCodeVerificationResponse>> {
  return api.get<EmailCodeVerificationResponse>(`email/verification/complete?ev_hash=${code}`);
}

export async function sendPhoneCode(): Promise<Result<PhoneVerificationResponse>> {
  return api.post<PhoneVerificationResponse>('user/send-phone-code');
}

export async function verifyPhoneCode(code: string): Promise<Result<PhoneCodeVerificationResponse>> {
  return api.post<PhoneCodeVerificationResponse>(`user/verify-phone/${code}`);
}