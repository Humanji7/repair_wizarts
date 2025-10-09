import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalDelete({ setVisibleModalDelete, setVisibleConfirmOrderFinal, onConfirm }) {
  const close = () => setVisibleModalDelete(false);

  const handleConfirm = () => {
    close();
    setVisibleConfirmOrderFinal?.(true);
    onConfirm?.();
  };

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Вы желаете удалить отзыв?"
      actions={[
        {
          id: 'no',
          label: 'Нет',
          variant: 'secondary',
          onClick: close,
        },
        {
          id: 'yes',
          label: 'Да',
          variant: 'danger',
          onClick: handleConfirm,
        },
      ]}
    />
  );
}
