import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { updatePassword, updateUser } from '../../services/user.service';
import { selectUser } from '../../slices/user.slice';
import VerificationInput from '../VerificationInput';
import style from './ProfileFH.module.css';
import { isPhoneNumberComplete } from '../../shared/ui/PhoneInput/PhoneInput';

const EMPTY_OBJECT = {}

function ProfileFH() {
  const user =
    Object.values(useSelector(selectUser)?.data?.user || EMPTY_OBJECT)[0] || EMPTY_OBJECT;
  // const listLinks = [
  //     "/client/settings",
  //     "/client/settings/picture",
  //     "/client/settings/wallet",
  //     "/client/settings/finance",
  //     "/client/settings/balance",
  // ]
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [form, setForm] = useState({
    name: user.u_name || '',
    lastname: user.u_family || '',
    phone: user.u_phone || '',
    email: user.u_email || '',
  });

  const getFormAttrs = (field) => {
    const attrs = {};

    attrs.value = form[field] || '';
    attrs.onChange = (valueOrEvent) => {
      const nextValue =
        typeof valueOrEvent === 'string'
          ? valueOrEvent
          : valueOrEvent?.target?.value ?? '';

      setForm((prev) => ({ ...prev, [field]: nextValue }));
    };

    return attrs;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (form.phone && !isPhoneNumberComplete(form.phone)) {
      setPhoneValidationError('Введите полный номер телефона.');
      return;
    }
    setPhoneValidationError('');
    updateUser(form, user.u_id)
      .then((v) => {
        setSucceeded(true);
        setError('');
        setPhoneValidationError('');
        console.log(v);
      })
      .catch((err) => console.log(err))
      .catch((err) => {
        setSucceeded(false);
        setError(err.message);
      });
    if (form.password?.length > 0 && form.new_password?.length > 0) {
      updatePassword(form)
        .then((v) => {
          setSucceeded(true);
          setError('');
          console.log(v);
        })
        .catch((err) => {
          setSucceeded(false);
          setError(err.message);
        });
    }
  };
  useEffect(() => {
    if (Object.keys(user) && !form.name) {
      setForm({
        name: user.u_name,
        lastname: user.u_family,
        phone: user.u_phone,
        email: user.u_email,
      });
    }
  }, [user, form.name]);

  useEffect(() => {
    document.title = 'Настройки';
  }, []);

  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visiblePasswordConfirm, setVisiblePasswordConfirm] = useState(false);

  return (
    <>
      {succeeded && (
        <div
          className={`succeed-v ${style.error_block}`}
          style={{ marginTop: '20px', marginBottom: '-30px' }}
        >
          Данные были успешно изменены
        </div>
      )}
      {(phoneValidationError || error) && (
        <div
          className={`auth-err ${style.error_block}`}
          style={{ marginTop: '20px', marginBottom: '-30px' }}
        >
          {phoneValidationError || error}
        </div>
      )}

      <div className="mini-main-2 df">
        <form onSubmit={onSubmit} className="input-wrap-2">
          <input type="text" placeholder="Имя" {...getFormAttrs('name')} />
          <input
            type="text"
            placeholder="Фамилия"
            {...getFormAttrs('lastname')}
          />
          <VerificationInput
            isConfirmed={user.is_phone_verified}
            {...getFormAttrs('phone')}
            onValidationError={(message) =>
              setPhoneValidationError(message)
            }
          />
          <VerificationInput
            isEmail
            isConfirmed={user.is_email_verified}
            {...getFormAttrs('email')}
          />
          <div className={style.input_wrap}>
            <input
              type={visiblePassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Текущий пароль"
            />
            <img
              src={
                visiblePassword
                  ? '/img/icons/eye_open.png'
                  : '/img/icons/eye_close.png'
              }
              alt=""
              className={style.password_icon}
              onClick={() => setVisiblePassword((prev) => !prev)}
            />
          </div>
          <div className={style.input_wrap}>
            <input
              value={form.new_password}
              type={visiblePasswordConfirm ? 'text' : 'password'}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, new_password: e.target.value }))
              }
              placeholder="Новый пароль"
            />
            <img
              src={
                visiblePasswordConfirm
                  ? '/img/icons/eye_open.png'
                  : '/img/icons/eye_close.png'
              }
              alt=""
              className={style.password_icon}
              onClick={() => setVisiblePasswordConfirm((prev) => !prev)}
            />
          </div>

          <button type="submit">Сохранить</button>
        </form>
      </div>
    </>
  );
}

export default ProfileFH;
