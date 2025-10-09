import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalVivod({ setInputModalVivod }) {
  const close = () => setInputModalVivod(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Подтверждение вывода средств"
      description={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <img src="/img/businessman.png" alt="Иконка" style={{ width: 88, height: 'auto' }} />
          <p style={{ margin: 0 }}>Дата ближайшего вывода - 04-11-2024</p>
        </div>
      }
      actions={[
        {
          id: 'ok',
          label: 'Ок',
          onClick: close,
          variant: 'primary',
        },
        {
          id: 'cancel',
          label: 'Отмена',
          onClick: close,
          variant: 'secondary',
        },
      ]}
    />
  );
}
