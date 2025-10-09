import appFetch, { BASE_URL } from '../utilities/appFetch';
// Функция для отправки кода на email
//~ const sendEmailCodeTest = () => {
  //~ // Имитация запроса для отправки email кода
  //~ return new Promise((resolve) => {
    //~ setTimeout(() => {
      //~ resolve({
        //~ result: 'Success!',
        //~ message: 'Email code sent successfully!',
      //~ });
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Функция для проверки email кода
//~ const sendEmailVerificationCodeTest = (code) => {
  //~ // Имитация запроса для проверки email кода
  //~ return new Promise((resolve) => {
    //~ setTimeout(() => {
      //~ resolve({
        //~ result: 'Success!',
        //~ user_id: 6,
        //~ email_verified: true,
      //~ });
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Функция для отправки кода на телефон
//~ const sendPhoneCodeTest = () => {
  //~ // Имитация запроса для отправки телефонного кода
  //~ return new Promise((resolve) => {
    //~ setTimeout(() => {
      //~ resolve({
        //~ result: 'Success!',
        //~ message: 'Phone code sent successfully!',
      //~ });
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Функция для проверки телефонного кода
//~ const sendPhoneVerificationCodeTest = (code) => {
  //~ // Имитация запроса для проверки телефонного кода
  //~ return new Promise((resolve) => {
    //~ setTimeout(() => {
      //~ resolve({
        //~ result: 'Success!',
        //~ user_id: 6,
        //~ phone_verified: true,
      //~ });
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

const sendEmailCode = () =>
  appFetch('email/verification/start', { method: 'POST' });

const sendEmailVerificationCode = (code) =>
  fetch(BASE_URL + `email/verification/complete?ev_hash=${code}`).then((res) =>
    res.json(),
  );

const sendPhoneCode = () =>
  appFetch('/auth/', {
    body: {
      type: 'phone_code',
      st: true,
    },
  });

const sendPhoneVerificationCode = (code) =>
  appFetch('/auth/', {
    body: {
      type: 'phone_code',
      st: true,
      code,
    },
  });

export {
  sendEmailCode,
  sendEmailVerificationCode,
  sendPhoneCode,
  sendPhoneVerificationCode,
};
