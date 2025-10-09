import SimpleDialog from '../../shared/ui/SimpleDialog/SimpleDialog';
import styles from './ModalAddComment.module.css';

export default function ModalAddCommentMini({ setVisibleModalAddComment }) {
  const close = () => setVisibleModalAddComment(false);

  return (
    <SimpleDialog
      isOpen
      onClose={close}
      title="Ответ на отзыв"
      actions={[
        {
          id: 'back',
          label: 'Назад',
          variant: 'secondary',
          onClick: close,
        },
        {
          id: 'submit',
          label: 'Отправить',
          variant: 'primary',
          onClick: close,
        },
      ]}
    >
      <textarea
        className={styles.textarea}
        rows={6}
        placeholder="В тексте не должно быть оскорблений и мата."
      />
    </SimpleDialog>
  );
}
