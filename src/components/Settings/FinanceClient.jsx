import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import { updateUser } from '../../services/user.service';
import { selectUser } from '../../slices/user.slice';
import style from './finance.module.css';
import ModalConfirm from './ModalConfirm';
import ModalDelete from './ModalDelete';
import ModalSuccess from './ModalSuccess';

const FinanceClient = () => {
  const user = Object.values(useSelector(selectUser)?.data?.user || {})[0] || {};

  const [card, setCard] = useState('');
  const [webmoney, setWebmoney] = useState('');
  const [success, setSuccess] = useState(false);
  const [isVisibleConfirm, setVisibleConfirm] = useState(false);
  const [isVisibleSuccess, setVisibleSuccess] = useState(false);
  const [isVisibleDelete, setVisibleDelete] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const cardWallet = user.u_details?.wallets?.find((wallet) => wallet.type === 'card');
    const wmWallet = user.u_details?.wallets?.find((wallet) => wallet.type === 'webmoney');

    setCard(cardWallet?.value || '');
    setWebmoney(wmWallet?.value || '');
  }, [user.u_details?.wallets]);

  const onSubmitWallets = async () => {
    try {
      const wallets = [
        { type: 'card', value: card },
        { type: 'webmoney', value: webmoney },
      ];

      const payload = {
        wallets,
      };

      const res = await updateUser({ details: payload }, user.u_id).then((value) =>
        console.log(value),
      );
      console.log(res);
      if (!res?.code === '200') throw new Error('Ошибка при сохранении');
      setVisibleSuccess(true);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, message: 'Ошибка при сохранении кошельков' });
    }
  };

  return (
    <>
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
      {isVisibleConfirm && (
        <ModalConfirm
          setVisibleConfirm={setVisibleConfirm}
          setVisibleSuccess={setVisibleSuccess}
        />
      )}
      {isVisibleSuccess && <ModalSuccess setVisibleSuccess={setVisibleSuccess} />}
      {isVisibleDelete && <ModalDelete setVisibleDelete={setVisibleDelete} />}

      <div className="">
        <div className={style.main}>
          {success && <div className={style.alert}>Данные кошелька сохранены</div>}

          <div className={style.payment_block}>
            <p className={style.name}>Банковская карта</p>
            <div className={style.payment_block__row}>
              <img src="/img/visa.png" alt="card" />
              <input
                className={style.payment_block__input}
                type="text"
                placeholder="Введите номер карты"
                value={card}
                onChange={(event) => setCard(event.target.value)}
              />
            </div>
          </div>

          <div className={style.payment_block}>
            <p className={style.name}>Webmoney</p>
            <div className={style.payment_block__row}>
              <img src="/img/webmoney.png" alt="webmoney" />
              <input
                className={style.payment_block__input}
                type="text"
                placeholder="Введите кошелёк"
                value={webmoney}
                onChange={(event) => setWebmoney(event.target.value)}
              />
            </div>
          </div>
        </div>

        <button className="master-settings-pics__button" onClick={onSubmitWallets}>
          Подтвердить отправку
        </button>
      </div>
    </>
  );
};

export default FinanceClient;
