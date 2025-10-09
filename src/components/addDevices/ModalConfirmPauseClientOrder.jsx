import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalConfirmPauseClientOrder({
  setVisibleAddFeedback,
  setOrderStatus,
}) {
  const close = () => setVisibleAddFeedback(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Подтверждение остановки"
      description="Вы подтверждаете остановку проекта? Исполнители не смогут больше добавлять в него свои предложения."
      actions={[
        {
          id: 'cancel',
          label: 'Отмена',
          variant: 'secondary',
          onClick: close,
        },
        {
          id: 'confirm',
          label: 'Остановить',
          variant: 'primary',
          onClick: () => {
            close();
            setOrderStatus?.('Пауза');
          },
        },
      ]}
    />
  );
}
