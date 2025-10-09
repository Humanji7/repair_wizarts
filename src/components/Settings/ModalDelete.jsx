import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalDelete({ setVisibleDelete, onConfirm }) {
  const close = () => setVisibleDelete(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Удаление кошелька"
      description="Удалить кошелек?"
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
          onClick: () => {
            close();
            onConfirm?.();
          },
        },
      ]}
    />
  );
}
