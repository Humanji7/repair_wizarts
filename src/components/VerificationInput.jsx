import { useState, useEffect } from 'react';
import { Popup } from 'reactjs-popup';

import mailIcon from '../img/mail.png';
import phoneIcon from '../img/mobile-phone.png';
import {
  sendEmailCode,
  sendEmailVerificationCode,
  sendPhoneCode,
  sendPhoneVerificationCode,
} from '../services/verification.service';
import '../scss/verification-input.css';
import PhoneInput from '../shared/ui/PhoneInput/PhoneInput';

const VerificationInput = (props) => {
  const {
    isConfirmed,
    isEmail,
    onChangeMask,
    onValidationError,
    value = '',
    onChange,
    ...rest
  } = props;

  const sendCode = isEmail ? sendEmailCode : sendPhoneCode;
  const sendVerificationCode = isEmail
    ? sendEmailVerificationCode
    : sendPhoneVerificationCode;

  const [isModalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (isModalOpen) sendCode().then((v) => console.log(v));
  }, [isModalOpen, sendCode]);

  const onSubmit = (e) => {
    e.preventDefault();
    sendVerificationCode(code).then((v) => {
      console.log(v);
      setModalOpen(false);
    });
  };

  return (
    <div className="mail-input">
      {isEmail ? (
        <input
          className="mail-input__input"
          placeholder="Электронная почта"
          value={value}
          onChange={(event) => {
            onChange?.(event);
            onChangeMask?.(event);
          }}
          {...rest}
        />
      ) : (
        <PhoneInput
          className="mail-input__input"
          placeholder="Телефон"
          value={value}
          onChange={(nextValue) => {
            onChange?.(nextValue);
            if (typeof onChangeMask === 'function') {
              onChangeMask({ target: { value: nextValue } });
            }
          }}
          onValidationError={onValidationError}
          {...rest}
        />
      )}
      {!isConfirmed && (
        <>
          <button
            disabled={true}
            className="mail-input__confirm"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            <img
              className="mail-input-confirm__img"
              src={isEmail ? mailIcon : phoneIcon}
              alt=""
            />
          </button>
          <Popup open={isModalOpen} onClose={() => setModalOpen(false)}>
            <div className="mail-input__modal">
              <button className="mail-input-modal__close"></button>
              <div className="mail-input-modal__content">
                <h3 className="mail-input-modal__title">Подтверждение почты</h3>
                <p className="mail-input-modal__description">
                  На вашу почту {'{email}'} пришло письмо с кодом подтверждения.
                  Чтобы подтвердить аккаунт введите этот код в форму,
                  находящуюся ниже.
                </p>
                <div className="mail-input-modal__form">
                  <input
                    className="mail-input-modal__input"
                    value={code}
                    placeholder="Код подтверждения"
                    onChange={(e) =>
                      e.target.value.length <= 6 && setCode(e.target.value)
                    }
                  />
                  <button
                    className="mail-input-modal__button"
                    onClick={onSubmit}
                  >
                    Подтвердить
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        </>
      )}
    </div>
  );
};

export default VerificationInput;
