import { useEffect, useRef, useState } from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import appFetch from '../../utilities/appFetch';
import ModalOfferGo from './ModalOfferGo';
import style from './OrderRow.module.css';

const DropboxImage = ({ url, alt = '', style: imgStyle }) => {
  const [imgUrl, setImgUrl] = useState(url && url.startsWith('blob:') ? url : null);
  const [error, setError] = useState(false);
  const urlRef = useRef(null);

  useEffect(() => {
    let revoked = false;
    if (!url) return;
    if (url.startsWith('blob:')) {
      setImgUrl(url);
      return;
    }
    const match = url.match(/\/dropbox\/file\/(\d+)/);
    const id = match ? match[1] : null;
    if (!id) return;
    fetch(`https://ibronevik.ru/taxi/api/v1/dropbox/file/${id}`, {
      method: 'POST',
      body: new URLSearchParams({
        token: 'bbdd06a50ddcc1a4adc91fa0f6f86444',
        u_hash:
          'VLUy4+8k6JF8ZW3qvHrDZ5UDlv7DIXhU4gEQ82iRE/zCcV5iub0p1KhbBJheMe9JB95JHAXUCWclAwfoypaVkLRXyQP29NDM0NV1l//hGXKk6O43BS3TPCMgZEC4ymtr',
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Ошибка загрузки фото');
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Не картинка');
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        if (!revoked) setImgUrl(objectUrl);
      })
      .catch(() => setError(true));
    return () => {
      revoked = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [url]);

  if (error)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Ошибка загрузки фото
      </div>
    );
  if (!imgUrl)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Загрузка...
      </div>
    );
  return <img src={imgUrl} alt={alt} style={imgStyle || { width: '100%' }} />;
};

export default function OrderRowOffer({
  b_id,
  userName,
  projectsPosted,
  hiredPercent,
  deviceName,
  problemDescription,
  timeLeft,
  views,
  budget,
  images,
  profileImage = '/img/profil_img/1.png',
}) {
  const user = JSON.parse(localStorage.getItem('userdata')).user;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [visibleModalGo, setVisibleModalGo] = useState(false);
  const [visibleBlock, setVisibleBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');
  const [time, setTime] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, message: '', variant: 'primary' });

  const openModal = (imageSrc) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const showDialog = (message, variant = 'primary') => {
    setDialog({ isOpen: true, message, variant });
  };

  const handleSubmit = async () => {
    try {
      if (!comment || !price || !time) {
        showDialog('Пожалуйста, заполните все поля', 'danger');
        return;
      }

      const preparedData = {
        bind_amount: price,
        comment: comment,
        time: time,
      };
      let isHasBind;
      if (isHasBind) {
        showDialog('Вы уже отправили заявку', 'secondary');
      } else {
        isHasBind = await appFetch(`/drive/get/${b_id}`, {
          body: {
            u_a_role: 2,
            performer: 0,
            action: 'set_performer',
            data: JSON.stringify({
              c_id: user?.c_id || '1',
              c_payment_way: 2,
              c_options: {
                author: {
                  name: user?.name,
                  email: user?.email,
                  phone: user?.phone,
                  photo: user.u_photo,
                  ...user,
                },
                bind_amount: preparedData.bind_amount,
                comment: preparedData.comment,
                time: preparedData.time,
              },
            }),
          },
        });
      }
      setVisibleModalGo(true);
    } catch (error) {
      console.error('Ошибка при отправке:', error);
      showDialog(error.message || 'Ошибка при отправке предложения', 'danger');
    }
  };

  return (
    <>
      <SimpleDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ isOpen: false, message: '', variant: 'primary' })}
        title={dialog.message}
        actions={[
          {
            id: 'ok',
            label: 'Закрыть',
            variant: dialog.variant === 'danger' ? 'secondary' : 'primary',
            onClick: () => setDialog({ isOpen: false, message: '', variant: 'primary' }),
          },
        ]}
      />
      {visibleModalGo && <ModalOfferGo setVisibleModalGo={setVisibleModalGo} />}

      <div className={style.order_row}>
        <div className={style.left}>
          <div className={style.profile}>
            <div className={style.profile__col}>
              <p className={style.name}>{userName}</p>
              <p>Размещено проектов на бирже {projectsPosted}</p>
              <p>Нанято {hiredPercent}%</p>
            </div>
          </div>
          <div style={{ flex: 1 }}></div>
          <p className={style.description}>{deviceName}</p>
          <p className={style.description}>{problemDescription}</p>
          <p className={style.small_text}>
            <span>осталось {timeLeft}</span>
            <span className={style.flex}>
              <img src="/img/icons/eye.png" alt="Просмотры" />
              {views} просмотрено
            </span>
          </p>
        </div>

        <div className={style.right}>
          <p>
            Желаемый бюджет <span className={style.price}>{budget} ₽</span>
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
            {images.map((src, index) => (
              <SwiperSlide key={index} className={style.swiperSlide}>
                <div
                  onClick={() => {
                    openModal(src);
                  }}
                  style={{ cursor: 'pointer', width: '100%', height: '100%' }}
                >
                  <DropboxImage
                    url={src}
                    alt={deviceName}
                    imgStyle={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className={style.button_block}>
            <button className={style.button} onClick={() => setVisibleBlock(!visibleBlock)}>
              Моё предложение
            </button>
          </div>
        </div>
      </div>

      {visibleBlock && (
        <div className={style.comment_wrap}>
          <textarea
            className={style.comment__input}
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="сообщение.."
          />
          <div className={style.table}>
            <div className={style.row_fields}>
              <input
                className={style.input}
                placeholder="Стоимость"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <input
                className={style.input}
                placeholder="Срок"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
            <button className={style.button} onClick={handleSubmit}>
              Отправить предложение
            </button>
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
