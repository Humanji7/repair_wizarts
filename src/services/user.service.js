import { removeToken } from './token.service';
import appFetch from '../utilities/appFetch';

const getUser = () => appFetch('user/authorized');
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

const getUserUnreadMessages = () => appFetch('user/unread-messages');

const getMasterByUsername = (username) => appFetch('user/master/' + username);

const getMasterRepairs = () => appFetch('service/master-repairs');

const getClientById = (id) => appFetch('user/client/' + id);

const updateUser = (data, id, asAdmin) => {
  const formattedDetails = Object.entries(data.details || {}).map(
    ([key, value]) =>
      value !== null || value !== undefined
        ? ['=', [key], value]
        : ['=', [key], []],
  );
  return appFetch(
    'user',
    {
      body: {
        ...(asAdmin ? { u_a_id: id } : {}),
        data: JSON.stringify({
          u_name: data.name,
          u_family: data.lastname,
          u_phone: data.phone,
          u_email: data.email,
          u_description: data.u_description,
          ...(data.details ? { u_details: formattedDetails } : {}),
        }),
      },
    },
    asAdmin,
  );
};
const updatePassword = (data) =>
  appFetch('newpass', {
    body: {
      password: data.password,
      new_password: data.new_password,
    },
  });
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

const deleteUser = async (userId, asAdmin = false) => {
  try {
    const result = await appFetch(
      'user',
      {
        body: {
          ...(asAdmin && typeof userId === 'number' ? { u_a_id: userId } : {}),
          data: JSON.stringify({
            u_is_deleted: 1,
          }),
        },
      },
      asAdmin,
    );

    if (!asAdmin) {
      removeToken();
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const createUserCustomService = (data) =>
  appFetch('service/repair_type', {
    method: 'POST',
    body: JSON.stringify(data),
  });

const updateUserService = (data, id) =>
  appFetch('service/master-repair/' + id, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

const getUserMode = () => JSON.parse(localStorage.getItem('isMaster'));

const setUserMode = (mode) => localStorage.setItem('isMaster', mode);

const recoverPassword = (payload) =>
  appFetch('user/recover-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const recoverPasswordVerify = (payload) =>
  appFetch(
    `user/verify-password-recovery/${payload.code}?user_id=${payload.user}`,
    {
      method: 'POST',
    },
  );

const recoverPasswordSend = (payload) =>
  appFetch('user/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

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
