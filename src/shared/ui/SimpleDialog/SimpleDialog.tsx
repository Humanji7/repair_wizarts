import { ReactNode, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

import styles from './SimpleDialog.module.scss';

type DialogActionVariant = 'primary' | 'secondary' | 'danger';

export interface DialogAction {
  id?: string;
  label: ReactNode;
  onClick?: () => void;
  variant?: DialogActionVariant;
  autoFocus?: boolean;
  disabled?: boolean;
}

export interface SimpleDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: DialogAction[];
  children?: ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const overlayRootId = 'app-dialog-root';

function ensureOverlayRoot(): HTMLElement {
  const existing = document.getElementById(overlayRootId);
  if (existing) {
    return existing;
  }
  const element = document.createElement('div');
  element.setAttribute('id', overlayRootId);
  document.body.appendChild(element);
  return element;
}

export function SimpleDialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  actions,
  children,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className,
}: SimpleDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const overlayRoot = useMemo(() => ensureOverlayRoot(), []);

  if (!isOpen) {
    return null;
  }

  const renderDialog = (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => {
        if (closeOnOverlayClick) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={[styles.dialog, className ?? ''].join(' ').trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.content}>
          {icon ? <div className={styles.icon}>{icon}</div> : null}
          {(title || showCloseButton) && (
            <div className={styles.header}>
              {title ? <h3 className={styles.title}>{title}</h3> : <span className={styles.hidden} />}
              {showCloseButton && (
                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label="Закрыть диалог"
                  onClick={onClose}
                >
                  ×
                </button>
              )}
            </div>
          )}

          {description ? <div className={styles.body}>{description}</div> : null}
          {children}
          {actions && actions.length > 0 ? (
            <div className={styles.actions}>
              {actions.map(({ id, label, onClick, variant = 'primary', autoFocus, disabled }) => (
                <button
                  key={id ?? String(label)}
                  type="button"
                  className={[
                    styles.button,
                    variant === 'primary'
                      ? styles.buttonPrimary
                      : variant === 'danger'
                      ? styles.buttonDanger
                      : styles.buttonSecondary,
                  ].join(' ')}
                  onClick={onClick}
                  autoFocus={autoFocus}
                  disabled={disabled}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(renderDialog, overlayRoot);
}

export default SimpleDialog;
