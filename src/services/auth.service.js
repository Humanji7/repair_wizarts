import { login as apiLogin, logout as apiLogout } from '../shared/api/modules/auth';
import { api } from '../shared/api/client';

const login = async (username, password, type = 'phone') => {
  const result = await apiLogin(username, password, type);
  if (!result.ok) {
    throw new Error(result.error.message || 'Login failed');
  }
  return result.data;
};

const logout = async () => {
  const result = await apiLogout();
  if (!result.ok) {
    throw new Error(result.error.message || 'Logout failed');
  }
};

const registerAsClient = async (payload) => {
  const result = await api.post('/register', { ...payload, st: true, u_role: 1 });
  if (!result.ok) {
    throw new Error(result.error.message || 'Registration failed');
  }
  return result.data;
};

const registerAsMaster = async (payload) => {
  const result = await api.post('/register', { ...payload, st: true, u_role: 2 });
  if (!result.ok) {
    throw new Error(result.error.message || 'Registration failed');
  }
  return result.data;
};

const addMaster = async (payload) => {
  const result = await api.post('user/add-master', payload);
  if (!result.ok) {
    throw new Error(result.error.message || 'Add master failed');
  }
  return result.data;
};

// Тестовая версия метода login с передачей данных прямо в теле
//~ const loginTest = () => {
  //~ const username = 'testuser';
  //~ const password = 'password123';

  //~ return new Promise((resolve) => {
    //~ // Имитация успешного ответа от сервера
    //~ setTimeout(() => {
      //~ const mockResponse = {
        //~ access_token: 'mockAccessToken123',
        //~ refresh_token: 'mockRefreshToken123',
      //~ };
      //~ // Сохранение токена с помощью setToken
      //~ setToken(mockResponse);
      //~ resolve(mockResponse);
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Тестовая версия метода registerAsClient с передачей данных прямо в теле
//~ const registerAsClientTest = () => {
  //~ const payload = {
    //~ name: 'Test Client',
    //~ email: 'testclient@example.com',
    //~ phone: '+1234567890',
  //~ };

  //~ return new Promise((resolve) => {
    //~ // Имитация успешного ответа от сервера
    //~ setTimeout(() => {
      //~ const mockResponse = {
        //~ result: 'Success!',
        //~ user_id: 6,
      //~ };
      //~ resolve(mockResponse);
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Тестовая версия метода registerAsMaster с передачей данных прямо в теле
//~ const registerAsMasterTest = () => {
  //~ const payload = {
    //~ name: 'Test Master',
    //~ email: 'testmaster@example.com',
    //~ phone: '+1987654321',
    //~ role: 'Master',
  //~ };

  //~ return new Promise((resolve) => {
    //~ // Имитация успешного ответа от сервера
    //~ setTimeout(() => {
      //~ const mockResponse = {
        //~ result: 'Success!',
        //~ user_id: 6,
      //~ };
      //~ resolve(mockResponse);
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

// Тестовая версия метода addMaster с передачей данных прямо в теле
//~ const addMasterTest = () => {
  //~ const payload = {
    //~ user_id: 6,
    //~ role: 'Master',
  //~ };

  //~ return new Promise((resolve) => {
    //~ // Имитация успешного ответа от сервера
    //~ setTimeout(() => {
      //~ const mockResponse = {
        //~ result: 'Success!',
      //~ };
      //~ resolve(mockResponse);
    //~ }, 500); // Имитация задержки сети
  //~ });
//~ };

//~ export { loginTest, registerAsClientTest, registerAsMasterTest, addMasterTest };

export { login, logout, registerAsClient, registerAsMaster, addMaster };
