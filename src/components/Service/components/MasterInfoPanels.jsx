import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Rating } from 'react-simple-star-rating';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import style from '../serviceDetail.module.scss';

function MasterInfoPanels({
  isVisible,
  showSmallModal,
  showBigModal,
  selectedMaster,
  onClose,
  galleryItems,
  onOpenGallery,
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{ display: 'flex', position: 'absolute' }}>
      <div
        style={{
          position: 'absolute',
          zIndex: 1,
          bottom: '0',
          left: '370px',
          display: 'flex',
          gap: '10px',
        }}
      >
        {showSmallModal && (
          <div className="info_master">
            <div className="info_master__close" onClick={onClose} style={{ cursor: 'pointer' }}>
              <img src="/img/close.svg" alt="" />
            </div>

            <div className="info_master__row1">
              <img src="/img/profile__image.png" alt="" />
              <div className="info_master__about">
                <p>{selectedMaster.name}</p>
                <p>{selectedMaster.info}</p>
                <div className="info_master__stars">
                  <Rating
                    size={18}
                    readonly
                    initialValue={selectedMaster.rating}
                    allowFraction
                    fillColor="#FFC107"
                    emptyColor="#E4E5E9"
                  />
                </div>
                <div className="info_master__row-links">
                  <Link to={`/client/feedback/${selectedMaster.id}`}>
                    {selectedMaster.reviews} отзыва
                  </Link>
                  <button
                    onClick={onClose}
                    aria-label="Закрыть окно с информацией о мастере"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit',
                    }}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>

            <p className="info_master__info">{selectedMaster.address}</p>
            <p className="info_master__info">Открыт: с 9 до 21</p>
            <p className="info_master__text-about">
              <span className="info_master__text-about-light">Имя организации</span>
              {selectedMaster.orgName}
            </p>
            <p className="info_master__text-about">
              <span className="info_master__text-about-light">Опыт</span>
              {selectedMaster.experience}
            </p>
            <p className="info_master__text-about">
              <span className="info_master__text-about-light">На сайте</span>
              с {selectedMaster.onSiteSince}
            </p>
            <p className="info_master__text-about">
              <span className="info_master__text-about-light">Статус</span>
              {selectedMaster.status}
            </p>
            <p className="info_master__text-about--accent">
              <span className="info_master__text-about-light">Оценка</span>
              {selectedMaster.rating}
            </p>
            <p className="info_master__text-about--accent">
              <span className="info_master__text-about-light">заказов выполнено</span>
              {selectedMaster.ordersCompleted}
            </p>
            <p className="info_master__text-about--accent">
              <span className="info_master__text-about-light">Заказов успешно сдано</span>
              {selectedMaster.successRate}
            </p>
            <p className="info_master__text-about--accent">
              <span className="info_master__text-about-light">2 повторных заказов</span>
              {selectedMaster.repeatOrders}
            </p>
          </div>
        )}
        {showBigModal && (
          <div className="info_master_big">
            <div>
              <div className="info_master__close" onClick={onClose} style={{ cursor: 'pointer' }}>
                <img src="/img/close.svg" alt="" />
              </div>

              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Вид категории</span>
                {selectedMaster.categoryView}
              </p>
              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Категория</span>
                {selectedMaster.categories}
              </p>
              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Бренды</span>
                {selectedMaster.brands}
              </p>
              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Ваша деятельность</span>
                {selectedMaster.activity}
              </p>

              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Основное направление</span>
                {selectedMaster.mainFocus}
              </p>
              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Основной бизнес</span>
                {selectedMaster.businessType}
              </p>
              <p className="info_master_big__text-about">
                <span className="info_master_big__text-about-light">Об организации: </span>
              </p>
              <p className="info_master_big__text">{selectedMaster.aboutOrg}</p>

              <div>
                <Swiper
                  slidesPerView={4}
                  spaceBetween={30}
                  navigation
                  modules={[Navigation]}
                  className={style.swiper}
                  breakpoints={{
                    0: {
                      slidesPerView: 2,
                    },
                    800: {
                      slidesPerView: 2,
                    },
                    1124: {
                      slidesPerView: 3,
                    },
                  }}
                >
                  {galleryItems.map((obj, index) => (
                    <SwiperSlide key={index} className={style.swiper__slide}>
                      <div className={style.slide__empty}>
                        <img
                          onClick={() => onOpenGallery(obj.img)}
                          style={{ width: 100 }}
                          src={obj.img}
                          alt=""
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            <div></div>
          </div>
        )}
      </div>
    </div>
  );
}

MasterInfoPanels.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  showSmallModal: PropTypes.bool.isRequired,
  showBigModal: PropTypes.bool.isRequired,
  selectedMaster: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    info: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reviews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    address: PropTypes.string,
    orgName: PropTypes.string,
    experience: PropTypes.string,
    onSiteSince: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
    ordersCompleted: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    successRate: PropTypes.string,
    repeatOrders: PropTypes.string,
    categoryView: PropTypes.string,
    categories: PropTypes.string,
    brands: PropTypes.string,
    activity: PropTypes.string,
    mainFocus: PropTypes.string,
    businessType: PropTypes.string,
    aboutOrg: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  galleryItems: PropTypes.arrayOf(
    PropTypes.shape({
      img: PropTypes.string,
    }),
  ).isRequired,
  onOpenGallery: PropTypes.func.isRequired,
};

export default MasterInfoPanels;
