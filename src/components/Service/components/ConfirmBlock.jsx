import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import style from '../serviceDetail.module.scss';

function ConfirmBlock({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={style.blockConfirm_wrap}>
      <div className={style.blockPayment} style={{ padding: '50px 50px 50px 50px' }}>
        <div className={style.close} onClick={onClose}>
          <img src="/img/close.svg" alt="" />
        </div>

        <h2>Вы подтвердили производителя работ</h2>
        <div className={style.row}>
          <p>Подтверждая исполнителя вы открываете с ним диалог в чате</p>
        </div>

        <Link to="/client/requests/my_orders/#order" className={style.button_confirm}>
          Перейти
        </Link>
      </div>
    </div>
  );
}

ConfirmBlock.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ConfirmBlock;
