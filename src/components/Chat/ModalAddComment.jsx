import { useState } from 'react';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import styles from './ModalAddComment.module.css';

export default function ModalAddComment({ setVisibleModalAddComment, setVisibleFinalOrder }) {
  const [countStar, setCountStar] = useState(-1);

  const close = () => setVisibleModalAddComment(false);

  const handleSubmit = () => {
    close();
    setVisibleFinalOrder?.(true);
  };

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Оценка и комментарии"
      actions={[
        {
          id: 'back',
          label: 'Назад',
          variant: 'secondary',
          onClick: close,
        },
        {
          id: 'submit',
          label: 'Отправить',
          variant: 'primary',
          onClick: handleSubmit,
        },
      ]}
    >
      <div className={styles.stars}>
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            className={`${styles.starButton} ${index <= countStar ? styles.starActive : ''}`.trim()}
            onClick={() => setCountStar(index)}
          >
            <img src="/img/icons/yellow-star.png" alt="Оценка" />
          </button>
        ))}
      </div>
      <textarea
        className={styles.textarea}
        rows={6}
        placeholder="В тексте не должно быть оскорблений и мата."
      />
      <div className={styles.photoRow}>
        <div className={styles.photoTile}>
          <img src="/img/icons/camera.png" alt="Добавить" />
        </div>
        <p className={styles.photoText}>
          Это необязательно, но с ними отзыв станет более наглядным. Скриншоты переписки не пройдут проверку.
        </p>
      </div>
    </SimpleDialog>
  );
}
