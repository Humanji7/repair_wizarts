import PropTypes from 'prop-types';

import style from '../serviceDetail.module.scss';

function OrderModal({
  isOpen,
  onClose,
  onSubmit,
  formError,
  isAuthorized,
  name,
  phone,
  onNameChange,
  onPhoneChange,
  description,
  onDescriptionChange,
  selectedService,
  prices,
  totalPrice,
  visibleListSelectedServices,
  onToggleSelectedServices,
  ignoreSelectedServices,
  onToggleIgnoreService,
  defaultName,
  defaultPhone,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modfdfsdafasal-content">
      <div className="modal-content oformitzayavka werwertttt">
        <span
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClose();
            }
          }}
        >
          <img className="close" src="/img/img-delete.png" alt="" />
        </span>
        <h1 className="detailpopuptitle" style={{ paddingBottom: '10px' }}>
          Оформить заказ
        </h1>
        <p style={{ marginBottom: '10px' }}>Официальные цены</p>

        {!isAuthorized ? (
          <div className="modfdfsdafasal-error" style={{ marginBottom: '10px' }}>
            Пожалуйста, зарегистрируйтесь или войдите
          </div>
        ) : null}

        <form onSubmit={onSubmit}>
          {formError && (
            <div className="auth-err" style={{ width: '100%' }}>
              {formError}
            </div>
          )}

          <div className={`df ${style.modal_from_row}`}>
            <input
              type="text"
              placeholder="Ваше имя"
              defaultValue={defaultName}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <input
              className="ismrf"
              type="text"
              placeholder="Номер телефона"
              defaultValue={defaultPhone}
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>

          <div className="selected_service">
            <div className="selected_service__heading">
              <p>Выплывающий список проблемы</p>
              <div style={{ flex: 1 }}></div>
              <p className="selected_service__text-light">Всего</p>
              <p className="selected_service__text-price">{totalPrice} ₽</p>
              <div
                className="selected_service__arrow"
                style={{ rotate: visibleListSelectedServices ? '-90deg' : '90deg' }}
                onClick={onToggleSelectedServices}
              >
                <img src="/img/sliderright.png" alt="" />
              </div>
            </div>
            {visibleListSelectedServices ? (
              <div className="selected_service__services">
                {selectedService.map((index, i) => (
                  <div key={i} className="selected_service__service-row">
                    <p className="selected_service__name">{prices[index]?.name}</p>
                    <div style={{ flex: 1 }}></div>
                    <p className="selected_service__price">{prices[index]?.price} ₽</p>
                    <p className="selected_service__delivery">{prices[index]?.delivery}</p>
                    <div className="selected_service__checkbox">
                      <input
                        checked={!ignoreSelectedServices.includes(index)}
                        type="checkbox"
                        onChange={() => onToggleIgnoreService(index)}
                      />
                    </div>
                  </div>
                ))}
                <div className="selected_service__final">
                  <p className="selected_service__text-light">Всего</p>
                  <p className="selected_service__text-price">{totalPrice} ₽</p>
                </div>
              </div>
            ) : null}
          </div>

          <textarea
            className="descdetail"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Описание проблемы"
            cols="30"
            rows="10"
          />
          <button className={`done ${style.fix_btn}`} type="submit">
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

OrderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  formError: PropTypes.string,
  isAuthorized: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onPhoneChange: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  selectedService: PropTypes.arrayOf(PropTypes.number).isRequired,
  prices: PropTypes.arrayOf(PropTypes.object).isRequired,
  totalPrice: PropTypes.number.isRequired,
  visibleListSelectedServices: PropTypes.bool.isRequired,
  onToggleSelectedServices: PropTypes.func.isRequired,
  ignoreSelectedServices: PropTypes.arrayOf(PropTypes.number).isRequired,
  onToggleIgnoreService: PropTypes.func.isRequired,
  defaultName: PropTypes.string,
  defaultPhone: PropTypes.string,
};

OrderModal.defaultProps = {
  formError: '',
  defaultName: '',
  defaultPhone: '',
};

export default OrderModal;
