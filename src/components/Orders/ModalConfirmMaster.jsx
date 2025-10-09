import { useNavigate } from 'react-router-dom';

import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalConfirmMaster({ setVisibleModalConfirmMaster, id }) {
  const navigate = useNavigate();
  const close = () => setVisibleModalConfirmMaster(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Вы подтвердили исполнителя"
      description="Подтверждая исполнителя, вы открываете с ним диалог в чате."
      actions={[
        {
          id: 'ok',
          label: 'Ок',
          variant: 'primary',
          onClick: () => {
            close();
            navigate('/client/chat/' + id);
          },
        },
      ]}
    />
  );
}
