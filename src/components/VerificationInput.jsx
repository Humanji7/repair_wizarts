import { useEffect, useState } from 'react';

import mailIcon from '../img/mail.png';
import phoneIcon from '../img/mobile-phone.png';
import {
  sendEmailCode,
  sendEmailVerificationCode,
  sendPhoneCode,
  sendPhoneVerificationCode,
} from '../services/verification.service';
import SimpleDialog from '../shared/ui/SimpleDialog/SimpleDialog';
import '../scss/verification-input.css';

const VerificationInput = ({ isConfirmed, isEmail, onChangeMask, value }) => {
  const sendCode = isEmail ? sendEmailCode : sendPhoneCode;
  const sendVerificationCode = isEmail
    ? sendEmailVerificationCode
    : sendPhoneVerificationCode;

  const [isModalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      sendCode().catch((error) => console.error(error));
    }
  }, [isModalOpen, sendCode]);

  const closeModal = () => {
    setModalOpen(false);
    setCode('');
  };

  const handleConfirm = () => {
    sendVerificationCode(code).then(() => {
      closeModal();
    });
  };

  return (
    <div className="mail-input">
      <input
        disabled={!isEmail}
        className="mail-input__input"
        placeholder={isEmail ? 'Электронная почта' : 'Телефон'}
        {...(isEmail ? { value } : {})}
        onChange={onChangeMask}
      />
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
          <SimpleDialog
            isOpen={isModalOpen}
            onClose={closeModal}
            title={isEmail ? 'Подтверждение почты' : 'Подтверждение телефона'}
            description={
              <p className="mail-input-modal__description">
                На вашу {isEmail ? 'почту' : 'почту/телефон'} пришел код подтверждения. Чтобы подтвердить аккаунт, введите этот код в форму ниже.
              </p>
            }
            actions={[
              {
                id: 'cancel',
                label: 'Отмена',
                variant: 'secondary',
                onClick: closeModal,
              },
              {
                id: 'confirm',
                label: 'Подтвердить',
                variant: 'primary',
                onClick: handleConfirm,
              },
            ]}
          >
            <div className="mail-input-modal__form">
              <input
                className="mail-input-modal__input"
                value={code}
                placeholder="Код подтверждения"
                onChange={(event) =>
                  event.target.value.length <= 6 && setCode(event.target.value)
                }
              />
            </div>
          </SimpleDialog>
        </>
      )}
    </div>
  );
};

export default VerificationInput;
