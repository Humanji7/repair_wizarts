import { useEffect, useState, useRef } from 'react';

import {
  updateUserPhoto,
  updateUser,
  updatePassword,
} from '../../services/user.service';

import { useDispatch, useSelector } from 'react-redux';

import '../../scss/settings-all.css';
import 'swiper/css';
import 'swiper/css/navigation';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';

import style from './SettingsMaster.module.css';
import { deleteUser } from '../../services/user.service';
import { selectUI, setAuthorization } from '../../slices/ui.slice';
import { selectUser } from '../../slices/user.slice';
import VerificationInput from '../VerificationInput';

const EMPTY_OBJECT = {}

export default function SettingsMaster() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [deleteAccount, setDeleteAccount] = useState(false);
  const [suceeded, setSuceeded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('данные сохранились');
  const user =
    Object.values(useSelector(selectUser)?.data?.user || EMPTY_OBJECT)[0] || EMPTY_OBJECT;
  const ui = useSelector(selectUI);

  const [mask_value, setMask_value] = useState('+7(9');

  const [form, setForm] = useState({
    phone: '',
    email: '',
    details: {
      availability_from: '00:00:00',
      availability_to: '00:00:00',
      status: '',
      mailing: false,
      is_active: false,
      login: '',
    },
  });

  function correctPhoneNumder(e) {
    var text = e.target.value;
    let new_text = text;
    // стирание
    if (text.length < mask_value.length) {
      new_text = text;
      if (new_text.length < 4) {
        new_text = '+7(9';
      }
    }
    // +7(988)-842-44-44
    else if (text.length === 6) {
      new_text = text + ')-';
    } else if (text.length === 7) {
      new_text = text.slice(0, -1) + ')-' + text.slice(-1);
    } else if (text.length === 8) {
      new_text = text.slice(0, -1) + '-' + text.slice(-1);
    } else if (text.length === 11) {
      new_text = text + '-';
    } else if (text.length === 12) {
      new_text = text.slice(0, -1) + '-' + text.slice(-1);
    } else if (text.length === 14) {
      new_text = text + '-';
    } else if (text.length === 15) {
      new_text = text.slice(0, -1) + '-' + text.slice(-1);
    } else if (text.length > 17) {
      new_text = text.slice(0, 17);
    } else {
      new_text = text;
    }

    setMask_value(new_text);
  }

  const getFormAttrs = (field) => {
    const attrs = {};

    attrs.value = form[field];
    attrs.onChange = (e) => correctPhoneNumder(e);

    return attrs;
  };
  const onSubmit = (e) => {
    e.preventDefault();
    updateUser(form, user.id)
      .then((v) => {
        setSuceeded(true);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
        setSuceeded(false);
      });
    if (form.password?.length > 0 && form.new_password?.length > 0) {
      updatePassword(form)
        .then((v) => {
          setSuceeded(true);
          setError('');
          console.log(v);
        })
        .catch((err) => {
          setSuceeded(false);
          setError(err.message);
        });
    }
  };

  const onProfilePicUpdate = async (e) => {
    e.preventDefault();
    const file = inputRef.current?.files[0];

    if (!file) {
      setError('Файл не выбран');
      return;
    }
    try {
      const base64 = await convertToBase64(file);
      await updateUserPhoto(base64, user.id);

      setSuceeded(true);
      setError('');
      setPreviewUrl(base64);
      inputRef.current.value = '';
    } catch (err) {
      setSuceeded(false);
      setError(err.message || 'Произошла ошибка при загрузке');
    }
  };
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setPreviewUrl(base64); // 👈 показываем новое фото сразу
    }
  };
  const onDelete = (e) => {
    e.preventDefault();
    return deleteUser(user.id)
      .then(() => {
        dispatch(setAuthorization(false));
        navigate('/');
      })
      .catch((err) => {
        setError(err.message || 'Не удалось удалить аккаунт');
      });
  };
  useEffect(() => {
    if (ui.isAuthorized) {
      const master = user;
      const obj = {
        phone: user.u_phone || '',
        email: user.u_email || '',
        details: {
          availability_from: master.u_details?.availability_from || '00:00:00',
          availability_to: master.u_details?.availability_to || '00:00:00',
          status: master.u_details?.status || '',
          mailing: master.u_details?.mailing || false,
          is_active: master.u_details?.is_active || false,
          login: master.u_details?.login || '',
        },
      };
      setForm(obj);
    }
    if (user.u_photo) {
      setPreviewUrl(user.u_photo);
    }
  }, [ui, user]);
  useEffect(() => {
    document.title = 'Настройки';
  }, []);
  return (
    <>
      <div className={`mini-main df ${style.form_wrap_flex}`}>
        <form onSubmit={onSubmit}>
          <div className={`input-wrap ${style.form}`}>
            {suceeded && (
              <div className="succeed-v">Данные успешно обновлены</div>
            )}
            {error && <div className={`auth-err ${style.error}`}>{error}</div>}

            <input
              value={form.details.login}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  details: { ...prev.details, login: e.target.value },
                }))
              }
              placeholder="Логин"
            />
            <div className="height">
              <VerificationInput
                isConfirmed={user.is_phone_verified}
                {...getFormAttrs('phone')}
                value={form.phone || ''}
                onChangeMask={correctPhoneNumder}
              />
            </div>
            <VerificationInput
              isEmail
              isConfirmed={user.is_email_verified}
              value={form.email || ''}
              onChangeMask={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              {...getFormAttrs('email')}
            />
            <div className="height">
              <input type="text" placeholder="Новый пароль" />
              {/* <img src="/img/img-eye.png" alt="" className="eye img"/> */}
            </div>
            <div className="height">
              <input type="text" placeholder="Подтверждение пароля" />
              {/* <img src="/img/img-almost-eye.png" alt="" className="almost-eye img" /> */}
            </div>
            <input
              type="time"
              style={{ paddingRight: '10px' }}
              placeholder="Со скольки времени Вы на связи"
              value={form.details.availability_from}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  details: {
                    ...prev.details,
                    availability_from: e.target.value,
                  },
                }))
              }
            />
            <input
              type="time"
              style={{ paddingRight: '10px' }}
              placeholder="До скольки времени Вы на связи"
              value={form.details.availability_to}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  details: { ...prev.details, availability_to: e.target.value },
                }))
              }
            />
            <input
              type="text"
              placeholder="Статус не более 40 символов"
              value={form.details.status}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  details: { ...prev.details, status: e.target.value },
                }));
              }}
              // {...getFormAttrs('status')}
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.details.mailing}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, mailing: e.target.value },
                  }))
                }
              />
              Email-рассылка
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.details.is_active}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    details: { ...prev.details, is_active: e.target.value },
                  }))
                }
              />
              Получать заказы
            </label>
            <div className={style.buttons_row}>
              <button type="submit" className="goooSaveButton">
                Сохранить
              </button>
              <button
                type="button"
                style={{ backgroundColor: 'unset', color: '#D9573B' }}
                className="goooSaveButton"
                onClick={() => setDeleteAccount(true)}
              >
                Удалить аккаунт
              </button>
              <Popup
                open={deleteAccount}
                onClose={() => setDeleteAccount(false)}
                className="delete-modal"
              >
                <h3 className="delete-modal__title">
                  Подтвердите удаление аккаунта
                </h3>
                <p className="delete-modal__info">Ваши данные будут стерты</p>
                <div className="delete-modal__actions">
                  <button
                    className="delete-modal__button"
                    style={{
                      backgroundColor: 'unset',
                      border: '1px solid gray',
                      color: 'black',
                    }}
                    onClick={() => setDeleteAccount(false)}
                  >
                    Отмена
                  </button>
                  <button className="delete-modal__button" onClick={onDelete}>
                    подтвердить удаление
                  </button>
                </div>
              </Popup>
            </div>
          </div>
        </form>

        <div className={`photo-wrap ${style.photo_wrap}`}>
          <label htmlFor="prifielLogoUpload">
            <img
              src={previewUrl ? previewUrl : '/img/img-camera.png'}
              alt="avatar"
              className="settings-picture"
            />
          </label>
          <form onSubmit={onProfilePicUpdate}>
            <input
              type="file"
              accept="image/png, image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              className="prifielUpload"
              id="prifielLogoUpload"
              ref={inputRef}
            />
            <div className="links">
              <button className="link-4">Изменить</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
