import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalConfirmDelete({
  setVisibleAddFeedback,
  onConfirm,
}) {
  const close = () => setVisibleAddFeedback(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Подтверждение удаления"
      description="Вы подтверждаете остановку проекта? Продавцы не смогут больше добавлять в него свои предложения."
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
          variant: 'danger',
          onClick: () => {
            close();
            onConfirm?.();
          },
        },
      ]}
    />
  );
}
