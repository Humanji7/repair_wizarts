import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalConfirmPause({
  setVisibleAddFeedback,
  setStatus,
  StatusEnum,
  onClick,
}) {
  const close = () => setVisibleAddFeedback(false);

  const handleConfirm = () => {
    close();
    if (setStatus && StatusEnum?.PAUSED) {
      setStatus(StatusEnum.PAUSED);
    }
    onClick?.(StatusEnum?.PAUSED ?? 'PAUSED');
  };

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
          onClick: handleConfirm,
        },
      ]}
    />
  );
}
