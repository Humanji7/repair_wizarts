import { useNavigate } from 'react-router-dom';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalOfferGo({ setVisibleModalGo }) {
  const navigate = useNavigate();

  const close = () => setVisibleModalGo(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Ваше индивидуальное предложение отправлено"
      actions={[
        {
          id: 'ok',
          label: 'Хорошо',
          variant: 'primary',
          onClick: () => {
            close();
            navigate('/master/requests');
          },
        },
      ]}
    />
  );
}
