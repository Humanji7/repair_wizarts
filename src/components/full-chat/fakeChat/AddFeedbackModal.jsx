import { useState } from 'react';

import SimpleDialog from '../../../shared/ui/SimpleDialog/SimpleDialog';
import { createRequest } from '../../../services/request.service';
import appFetch from '../../../utilities/appFetch';
import style from './AddFeedbackModal.module.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const uploadPhoto = async (file) => {
  try {
    const base64String = await fileToBase64(file);
    const fileObject = {
      file: JSON.stringify({
        base64: base64String,
        name: file.name,
      }),
    };
    const response = await appFetch(
      '/dropbox/file/',
      {
        method: 'POST',
        body: fileObject,
      },
      true,
    );
    const result = await response;
    return `https://ibronevik.ru/taxi/api/v1/dropbox/file/${result.data.dl_id}`;
  } catch (error) {
    console.error('Ошибка в функции uploadPhoto:', error);
    throw error;
  }
};

export default function AddFeedbackModal({
  setVisibleAddFeedback,
  setVisibleFinalOrder,
  id,
}) {
  const [countStar, setCountStar] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, message: '' });

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const photoUrls = [];
      for (const photo of photos) {
        if (photo.file) {
          const url = await uploadPhoto(photo.file);
          photoUrls.push(url);
        }
      }
      const data = await appFetch(`drive/get/${id}`, {
        body: {
          u_a_role: 1,
          action: 'set_rate',
          value: countStar + 1,
          comment,
          photos: photoUrls,
        },
      });
      createRequest(
        {
          client_feedback_photo_urls: photoUrls,
        },
        true,
      );
      if (data?.code === '200') {
        setVisibleAddFeedback(false);
        setVisibleFinalOrder(true);
      } else {
        setDialog({ isOpen: true, message: 'Ошибка при отправке отзыва' });
      }
    } catch (error) {
      console.error(error);
      setDialog({ isOpen: true, message: 'Произошла ошибка сети' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={style.wrap}>
      <SimpleDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ isOpen: false, message: '' })}
        title={dialog.message}
        actions={[
          {
            id: 'ok',
            label: 'Закрыть',
            variant: 'primary',
            onClick: () => setDialog({ isOpen: false, message: '' }),
          },
        ]}
      />
      <div className={style.block}>
        <div className={style.close} onClick={() => setVisibleAddFeedback(false)}>
          <img src="/img/close.svg" alt="" />
        </div>

        <h2 className={style.heading}>
          Поздравляем вы завершаете заказ, пожалуйста оставьте отзыв
        </h2>

        <div className={style.stars}>
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div
              key={i}
              className={i <= countStar ? style.yellow : ''}
              onClick={() => setCountStar(i)}
            >
              <img src="/img/icons/yellow-star.png" alt="" />
            </div>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            className={style.textarea}
            rows={8}
            placeholder="В тексте не должно быть оскорблений и мата."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>

        <div className={style.block_photo}>
          <p className={style.heading_h3}>Добавить фотографии</p>
          <div className={style.add_photo}>
            <label>
              <img src="/img/icons/camera.png" alt="" />
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(event) => {
                  const files = Array.from(event.target.files);
                  const newPhotos = files.map((file) => ({
                    file,
                    url: URL.createObjectURL(file),
                  }));
                  setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
                }}
              />
            </label>
          </div>
          <div
            className={style.preview_row}
            style={{ display: 'flex', gap: 8, marginTop: 8 }}
          >
            {photos.map((photo, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img
                  src={photo.url}
                  alt="preview"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                  }}
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={style.buttons}>
          <div
            className={style.button}
            onClick={isUploading ? undefined : handleSubmit}
          >
            {isUploading ? 'Загрузка...' : 'Отправить'}
          </div>
          <div
            className={style.button_back}
            onClick={() => setVisibleAddFeedback(false)}
          >
            Назад
          </div>
        </div>
      </div>
    </div>
  );
}
