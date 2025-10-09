import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalDelete({ setVisibleDeleteModal, onDelete }) {
  const close = () => setVisibleDeleteModal(false);

  const handleConfirm = () => {
    close();
    onDelete?.();
  };

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Подтверждаете удаление?"
      actions={[
        {
          id: 'cancel',
          label: 'Отмена',
          variant: 'secondary',
          onClick: close,
        },
        {
          id: 'delete',
          label: 'Удалить',
          variant: 'danger',
          onClick: handleConfirm,
        },
      ]}
    />
  );
}
