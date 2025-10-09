import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Rating } from 'react-simple-star-rating';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import { createReview } from '../../services/reviews.service';
import { selectUser } from '../../slices/user.slice';
import styles from './Reviews.module.css';

const ReviewsForm = () => {
  const user = useSelector(selectUser);

  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const closeModal = () => setModalOpen(false);

  const onSubmit = (event) => {
    event.preventDefault();

    return createReview({
      rating,
      message,
      sender: `${user.name} ${user.lastname}`,
    }).then(() => setModalOpen(true));
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <SimpleDialog
        isOpen={modalOpen}
        onClose={closeModal}
        title="Ваш отзыв отправлен на модерацию"
        actions={[
          {
            id: 'close',
            label: 'Закрыть',
            variant: 'primary',
            onClick: closeModal,
          },
        ]}
      />
      <h3 className={styles.formTitle}>Оценка и комментарий</h3>
      <Rating onClick={setRating} initialValue={rating} size="32" />
      <textarea
        className={styles.formInput}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Введите отзыв без оскорблений и нецензурной лексики"
      />
      <button className={styles.formSubmit} type="submit">
        Отправить
      </button>
    </form>
  );
};

export default ReviewsForm;
