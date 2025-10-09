import { useState } from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import { cancelMasterResponse } from '../../services/order.service';
import style from './OrderRow.module.css';

export default function OrderRow({
  userProfile,
  orderInfo,
  photos = [],
  images = [],
  commentData,
  b_id,
  onResponseCancelled,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [isOpenCommentWrap, setIsOpenCommentWrap] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({
    isOpen: false,
    message: '',
    variant: 'primary',
  });

  const openModal = (imageSrc) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCancelResponse = () => {
    setIsConfirmDeleteOpen(true);
  };

  const closeFeedback = () => setFeedbackDialog({ isOpen: false, message: '', variant: 'primary' });

  const confirmCancelResponse = async () => {
    setIsConfirmDeleteOpen(false);

    if (!b_id) {
      setFeedbackDialog({
        isOpen: true,
        message: 'Произошла ошибка: не найден ID заказа.',
        variant: 'danger',
      });
      return;
    }

    try {
      await cancelMasterResponse(b_id);
      setFeedbackDialog({
        isOpen: true,
        message: 'Ваше предложение успешно удалено.',
        variant: 'primary',
      });
      if (onResponseCancelled) {
        onResponseCancelled();
      }
    } catch (error) {
      console.error('Ошибка при удалении предложения:', error);
      setFeedbackDialog({
        isOpen: true,
        message: 'Не удалось удалить предложение. Пожалуйста, попробуйте снова.',
        variant: 'danger',
      });
    }
  };

  return (
    <>
      <SimpleDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Удалить предложение?"
        description="Вы уверены, что хотите удалить свое предложение?"
        actions={[
          {
            id: 'cancel',
            label: 'Отмена',
            variant: 'secondary',
            onClick: () => setIsConfirmDeleteOpen(false),
          },
          {
            id: 'confirm',
            label: 'Удалить',
            variant: 'danger',
            onClick: confirmCancelResponse,
          },
        ]}
      />
      <SimpleDialog
        isOpen={feedbackDialog.isOpen}
        onClose={closeFeedback}
        title={feedbackDialog.message}
        actions={[
          {
            id: 'ok',
            label: 'Понятно',
            variant: feedbackDialog.variant === 'danger' ? 'secondary' : 'primary',
            onClick: closeFeedback,
          },
        ]}
      />

      <div className={style.order_row}>
        <div className={style.left}>
          <div className={style.profile}>
            <img
              src={'/img/profil_img/1.png' || userProfile?.avatar}
              alt="Аватар"
              className={style.avatar}
            />
            <div className={style.profile__col}>
              <p className={style.name}>{userProfile?.name || 'Имя Фамилия'}</p>
              <p>
                Размещено проектов на бирже {userProfile?.projectsCount || 0}
              </p>
              <p>Нанято {userProfile?.hireRate || 0}%</p>
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <p className={style.description}>
            {orderInfo?.device || 'Название устройства'}
          </p>
          <p className={style.description}>
            {orderInfo?.problem || 'Описание проблемы'}
          </p>
        </div>

        <div className={style.right}>
          <p>
            Желаемый бюджет{' '}
            <span className={style.price}>{orderInfo?.budget || '0'} ₽</span>
          </p>

          <Swiper
            slidesPerView={4}
            spaceBetween={30}
            navigation={true}
            modules={[Navigation]}
            className={style.swiper}
            breakpoints={{
              0: { slidesPerView: 1 },
              800: { slidesPerView: 1 },
              1124: { slidesPerView: 1 },
            }}
          >
            {photos.map((src, index) => (
              <SwiperSlide key={index} className={style.swiperSlide}>
                <img onClick={() => openModal(src)} src={src} alt="" />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            className={style.button}
            onClick={() => setIsOpenCommentWrap((prev) => !prev)}
          >
            Моё предложение
          </button>
        </div>
      </div>
      {isOpenCommentWrap && (
        <div className={style.comment_wrap}>
          <div className={style.profile}>
            <img
              src={'/img/profil_img/1.png' || commentData?.author?.avatar}
              alt="Аватар"
              className={style.avatar}
            />
            <div className={style.profile__col}>
              <p className={style.name}>
                {commentData?.author?.name || 'Имя Пользователя'}
              </p>
              <p>{commentData?.author?.ordersCount || 0} заказов</p>
            </div>
          </div>

          <div className={style.comment_block}>
            <div className={style.icon_chat}>
              <img src="/img/chat.png" alt="Chat Icon" />
            </div>

            <textarea
              className={style.comment__input}
              rows={4}
              placeholder="сообщение.."
              value={commentData?.message || ''}
              readOnly
            />

            <table className={style.table}>
              <thead>
                <tr>
                  <th>Что входит в предложение</th>
                  <th>Срок</th>
                  <th>Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {commentData?.offers?.map((offer, idx) => (
                  <tr key={idx} className={style.line}>
                    <td>{offer?.description || '-'}</td>
                    <td>{offer?.time || '-'}</td>
                    <td>{offer?.price || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={style.action_row}>
            <div className={style.delete} onClick={handleCancelResponse}>
              <img src="/img/icons/delete.png" alt="delete icon" />
              <p>удалить</p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <img src={modalImage} alt="" className="modal-image" />
            <button className="closeBtn" onClick={closeModal}>
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
