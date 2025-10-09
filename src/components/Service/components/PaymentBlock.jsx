import PropTypes from 'prop-types';

import style from '../serviceDetail.module.scss';

function PaymentBlock({
  isOpen,
  onClose,
  onConfirm,
  selectedIdx,
  onSelectMethod,
  errorBalance,
  errorCash,
  errorSumm,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={style.blockPayment_wrap}>
      {errorBalance ? (
        <div className={style.error}>Пополните, пожалуйста, баланс на 500р</div>
      ) : null}

      {errorCash ? (
        <div className={style.error}>Оплатите мастеру при встрече</div>
      ) : null}

      {errorSumm ? (
        <div className={style.error}>С вашего баланса спишется 500 рублей </div>
      ) : null}

      <div className={style.blockPayment}>
        <div className={style.close} onClick={onClose}>
          <img src="/img/close.svg" alt="" />
        </div>

        <h2>Оплата</h2>
        <div className={style.row}>
          <div className={style.block_v2}>
            <p>Оплата через сайт</p>
            <div className={style.radio}>
              <input
                type="radio"
                id="inputSite"
                name="radioPayments"
                checked={selectedIdx === 0}
                onChange={() => onSelectMethod(0)}
              />
              <label htmlFor="inputSite">Баланс: 0р</label>
            </div>
            <p>Обычная цена сделки без риска</p>
            <p className={style.mini_text}>
              + 9% при пополнение кошелька баланса. Цена в отклике исполнителя уже включает в себя комиссию
            </p>
          </div>

          <div className={style.block} style={{ position: 'relative', top: '35px' }}>
            <div className={style.radio}>
              <input
                type="radio"
                id="inputCash"
                name="radioPayments"
                checked={selectedIdx === 1}
                onChange={() => onSelectMethod(1)}
              />
              <label htmlFor="inputCash">Оплата наличными</label>
            </div>
            <p className={style.mini_text}>
              Оплата напрямую исполнителю <br /> Без гарантий и компенсаций RepairWizarts: вы напрямую договариваетесь с
              исполнителем об условиях и способе оплаты.
            </p>
          </div>
        </div>

        <div className={style.button_go} onClick={onConfirm}>
          Перейти
        </div>
      </div>
    </div>
  );
}

PaymentBlock.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedIdx: PropTypes.number.isRequired,
  onSelectMethod: PropTypes.func.isRequired,
  errorBalance: PropTypes.bool,
  errorCash: PropTypes.bool,
  errorSumm: PropTypes.bool,
};

PaymentBlock.defaultProps = {
  errorBalance: true,
  errorCash: true,
  errorSumm: true,
};

export default PaymentBlock;
