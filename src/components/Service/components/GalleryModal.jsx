import PropTypes from 'prop-types';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

function GalleryModal({ isOpen, onClose, images }) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="modal" onClick={onClose}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <button className="closeBtn" onClick={onClose}>
            ×
          </button>

          <Swiper navigation modules={[Navigation]} className="modalSwiper">
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="modal-content-info">
                  <img src={image.img} alt={`Slide ${index + 1}`} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        @media screen and (max-width: 1000px) {
          .modalContent {
            height: 50% !important;
          }
          .modal img {
            width: 100% !important;
            height: auto !important;
          }
        }

        .modal-content-info {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .modalContent {
          position: relative;
          padding: 20px;
          background: white;
          width: 60%;
          height: 80%;
          overflow: hidden;
        }

        .modal img {
          width: auto;
          height: 80%;
        }

        .closeBtn {
          top: 0px;
          position: absolute;
          right: 10px;
          font-size: 30px;
          background: none;
          border: none;
          color: #333;
          cursor: pointer;
        }

        .closeBtn:hover {
          color: red;
        }

        .modalSwiper {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </>
  );
}

GalleryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      img: PropTypes.string,
    }),
  ).isRequired,
};

export default GalleryModal;
