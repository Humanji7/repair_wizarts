import {
  sendEmailVerification as apiSendEmailVerification,
  verifyEmailCode as apiVerifyEmailCode,
  sendPhoneCode as apiSendPhoneCode,
  verifyPhoneCode as apiVerifyPhoneCode
} from '../shared/api/modules/verification';

const sendEmailCode = async () => {
  const result = await apiSendEmailVerification();
  if (!result.ok) {
    throw new Error(result.error.message || 'Send email code failed');
  }
  return result.data;
};

const sendEmailVerificationCode = async (code) => {
  const result = await apiVerifyEmailCode(code);
  if (!result.ok) {
    throw new Error(result.error.message || 'Verify email code failed');
  }
  return result.data;
};

const sendPhoneCode = async () => {
  const result = await apiSendPhoneCode();
  if (!result.ok) {
    throw new Error(result.error.message || 'Send phone code failed');
  }
  return result.data;
};

const sendPhoneVerificationCode = async (code) => {
  const result = await apiVerifyPhoneCode(code);
  if (!result.ok) {
    throw new Error(result.error.message || 'Verify phone code failed');
  }
  return result.data;
};

export {
  sendEmailCode,
  sendEmailVerificationCode,
  sendPhoneCode,
  sendPhoneVerificationCode,
};
