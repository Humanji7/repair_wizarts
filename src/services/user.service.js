import { removeToken } from './token.service';
import { getProfile, updateProfile, deleteAccount, updatePassword as apiUpdatePassword } from '../shared/api/modules/user';
import { api } from '../shared/api/client';
import appFetch from '../utilities/appFetch';

const getUser = async () => {
  const result = await getProfile();
  if (!result.ok) {
    throw (result.error.message || 'Get user failed');
  }
  return result.data;
};
// Method to fetch the current user data
// const getUserTestData = () => {
//     return new Promise((resolve) => {
//         const mockUser = {
//             id: 6,
//             name: "test",
//             lastname: "test",
//             email: "test@gmail.com",
//             phone: "+79111111111",
//             avatar: "files/Снимок экрана от 2025-01-28 11-58-29.png",
//             is_superuser: false,
//             is_email_verified: true,
//             is_phone_verified: true,
//             number_of_submissions: 4,
//             master: null
//         };

//         // Simulate network delay
//         setTimeout(() => resolve(mockUser), 500);
//     });
// }; ###

const getUserUnreadMessages = async () => {
  const result = await api.get('user/unread-messages');
  if (!result.ok) {
    throw new Error(result.error.message || 'Get unread messages failed');
  }
  return result.data;
};

const getMasterByUsername = async (username) => {
  const result = await api.get('user/master/' + username);
  if (!result.ok) {
    throw new Error(result.error.message || 'Get master failed');
  }
  return result.data;
};

const getMasterRepairs = async () => {
  const result = await api.get('service/master-repairs');
  if (!result.ok) {
    throw new Error(result.error.message || 'Get master repairs failed');
  }
  return result.data;
};

const getClientById = async (id) => {
  const result = await api.get('user/client/' + id);
  if (!result.ok) {
    throw new Error(result.error.message || 'Get client failed');
  }
  return result.data;
};

const updateUser = async (data, id, asAdmin) => {
  const result = await updateProfile(data, id, asAdmin);
  if (!result.ok) {
    throw (result.error.message || 'Update user failed');
  }
  return result.data;
};

const updatePassword = async (data) => {
  const result = await apiUpdatePassword(data);
  if (!result.ok) {
    throw new Error(result.error.message || 'Update password failed');
  }
  return result.data;
};
// Для клиента:
// 				"u_role"				идентификатор роли пользователя (менять между 1,2,5)
// 				"u_name"				имя пользователя
// 				"u_family"				фамилия пользователя
// 				"u_middle"				отчество пользователя
// 				"u_phone"				телефон пользователя или null
// 				"u_email"				емейл пользователя или null
// 				"u_photo"				изображение, кодированое в base64 строку
// 				"u_lang"				идентификатор языка, выбранного пользователем или null		data.lang
// 				"u_currency"			iso4217 код валюты, выбранной пользователем или null		data.currencies
// 				"ref_code"				реферальный код
// 				"u_details"				архив дополнительных параметров

const updateUserPhoto = (photo, id) =>
  appFetch('user', {
    body: {
      data: JSON.stringify({
        u_photo: photo,
      }),
    },
  });

const updateMasterPictures = (userId, payload) => {
  const form = new FormData();
  form.append('data', JSON.stringify({}));

  if (!payload.length) {
    form.append('pictures', []);
  }
  payload.forEach((v) => form.append('pictures', v));

  return appFetch('user/update/' + userId, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });
};

const deleteUser = async () => {
  const result = await deleteAccount();
  if (!result.ok) {
    throw new Error(result.error.message || 'Delete user failed');
  }
  removeToken();
  return result.data;
};

const createUserCustomService = async (data) => {
  const result = await api.post('service/repair_type', data);
  if (!result.ok) {
    throw new Error(result.error.message || 'Create custom service failed');
  }
  return result.data;
};

const updateUserService = async (data, id) => {
  const result = await api.patch('service/master-repair/' + id, data);
  if (!result.ok) {
    throw new Error(result.error.message || 'Update service failed');
  }
  return result.data;
};

const getUserMode = () => JSON.parse(localStorage.getItem('isMaster'));

const setUserMode = (mode) => localStorage.setItem('isMaster', mode);

const recoverPassword = async (payload) => {
  const result = await api.post('user/recover-password', payload);
  if (!result.ok) {
    throw new Error(result.error.message || 'Recover password failed');
  }
  return result.data;
};

const recoverPasswordVerify = async (payload) => {
  const result = await api.post(`user/verify-password-recovery/${payload.code}?user_id=${payload.user}`);
  if (!result.ok) {
    throw new Error(result.error.message || 'Verify password recovery failed');
  }
  return result.data;
};

const recoverPasswordSend = async (payload) => {
  const result = await api.post('user/change-password', payload);
  if (!result.ok) {
    throw new Error(result.error.message || 'Change password failed');
  }
  return result.data;
};

const keepUserAuthorized = (v) =>
  localStorage.setItem('keepAuthorized', JSON.stringify(v));

const getKeepUserAuthorized = () =>
  JSON.parse(localStorage.getItem('keepAuthorized'));

export {
  getUser,
  getUserUnreadMessages,
  getClientById,
  getMasterRepairs,
  updateUser,
  updateUserService,
  updateMasterPictures,
  deleteUser,
  createUserCustomService,
  updateUserPhoto,
  getMasterByUsername,
  getUserMode,
  setUserMode,
  recoverPassword,
  recoverPasswordVerify,
  recoverPasswordSend,
  keepUserAuthorized,
  getKeepUserAuthorized,
  updatePassword,
};
