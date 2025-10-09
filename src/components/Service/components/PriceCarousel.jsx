import PropTypes from 'prop-types';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import style from '../serviceDetail.module.scss';

function PriceCarousel({ prices, selectedService }) {
  return (
    <section className="detail__price">
      <div className="container detail-price-container">
        <Swiper
          slidesPerView={4}
          spaceBetween={30}
          navigation
          modules={[Navigation]}
          className={style.swiper_price}
          breakpoints={{
            0: {
              slidesPerView: 2,
            },
            800: {
              slidesPerView: 3,
            },
            1124: {
              slidesPerView: 4,
            },
          }}
        >
          {prices.map((obj, index) => (
            <SwiperSlide key={index} className="sliderr">
              <div
                className={`detail__price__card ${!selectedService.includes(index) ? 'red' : ''}`}
              >
                <div className="price">
                  <h1>{obj.price}</h1>
                  <img width="10px" src="/img/rubl.png" alt="" />
                </div>
                <p>{obj.model}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

PriceCarousel.propTypes = {
  prices: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number,
      model: PropTypes.string,
    }),
  ).isRequired,
  selectedService: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default PriceCarousel;
