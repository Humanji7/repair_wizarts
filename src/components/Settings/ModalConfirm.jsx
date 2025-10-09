import { useRef, useState } from 'react';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import styles from './ModalConfirm.module.css';

export default function ModalConfirm({ setVisibleConfirm, setVisibleSuccess }) {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const inputRef = useRef([]);

  const close = () => setVisibleConfirm(false);

  const handleComplete = () => {
    close();
    setVisibleSuccess(true);
  };

  const handleChange = (event, index) => {
    const { value } = event.target;
    if (!/^[0-9]$/.test(value) && value !== '') {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < otp.length - 1) {
      inputRef.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      inputRef.current[index - 1]?.focus();
    }

    if (value && index === otp.length - 1) {
      handleComplete();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && index > 0 && !otp[index]) {
      inputRef.current[index - 1]?.focus();
    }
  };

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Подтвердите новые реквизиты"
      description={
        <p className={styles.textBlock}>
          Введите последние 4 цифры звонящего номера.<br />Вам поступит бесплатный звонок, отвечать на него не нужно. Тариф в
          роуминге зависит от оператора.
        </p>
      }
      actions={[
        {
          id: 'cancel',
          label: 'Отмена',
          variant: 'secondary',
          onClick: close,
        },
      ]}
    >
      <div className={styles.inputRow}>
        {otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            value={digit}
            onChange={(event) => handleChange(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              inputRef.current[index] = element;
            }}
            className={styles.input}
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>
    </SimpleDialog>
  );
}
