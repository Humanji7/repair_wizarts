import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';

export default function ModalSuccess({ setVisibleSuccess }) {
  const close = () => setVisibleSuccess(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Платежные реквизиты добавлены"
      description={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <img src="/img/success.png" alt="Успех" style={{ width: 96, height: 'auto' }} />
        </div>
      }
      actions={[
        {
          id: 'close',
          label: 'Закрыть',
          onClick: close,
          variant: 'primary',
        },
      ]}
    />
  );
}
