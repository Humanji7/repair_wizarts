import type {
  ChangeEvent,
  FC,
  KeyboardEvent,
  MouseEvent,
  RefObject,
} from 'react';
import React, { Suspense } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';

import styles from '../Chat.module.css';

const EmojiPickerLazy = React.lazy(() => import('emoji-picker-react'));

export interface PreviewFile {
  file: File;
  url: string;
}

interface ChatMessageInputProps {
  message: string;
  onMessageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onMessageKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  previewFiles: PreviewFile[];
  onRemovePreview: (url: string) => void;
  isBalanceError: boolean;
  balanceErrorAmount: number;
  isAnswerMode: boolean;
  onCancelAnswer: () => void;
  isEditMode: boolean;
  onCancelEdit: () => void;
  isChatBlocked: boolean;
  chooseFileOpen: boolean;
  onToggleChooseFile: () => void;
  onPickFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onMicClick: () => void;
  recState: 'idle' | 'recording' | 'saving';
  canRecordAudio: boolean;
  isEmojiVisible: boolean;
  onToggleEmoji: () => void;
  footerHeight: number;
  addEmojiToMessage: (emoji: EmojiClickData) => void;
  footerRef: RefObject<HTMLDivElement>;
}

const ChatMessageInput: FC<ChatMessageInputProps> = ({
  message,
  onMessageChange,
  onMessageKeyDown,
  onSend,
  previewFiles,
  onRemovePreview,
  isBalanceError,
  balanceErrorAmount,
  isAnswerMode,
  onCancelAnswer,
  isEditMode,
  onCancelEdit,
  isChatBlocked,
  chooseFileOpen,
  onToggleChooseFile,
  onPickFiles,
  onMicClick,
  recState,
  canRecordAudio,
  isEmojiVisible,
  onToggleEmoji,
  footerHeight,
  addEmojiToMessage,
  footerRef,
}) => {
  const handleToggleAttach = (event: MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    onToggleChooseFile();
  };

  return (
    <div className={styles.message_block} ref={footerRef}>
      <div className="block_messages-2 font_inter" style={{ paddingTop: 8 }}>
        {isBalanceError ? (
          <div className={styles.balance_error}>
            <p>Пожалуйста пополните баланс на {balanceErrorAmount} рублей</p>
          </div>
        ) : null}
        {isAnswerMode ? (
          <p className="answer_to_message">
            Ответить <span>Смогу приехать через час</span>
            <button onClick={onCancelAnswer}>X</button>
          </p>
        ) : null}
        {isEditMode ? (
          <p className="answer_to_message">
            Редактирование <button onClick={onCancelEdit}>X</button>
          </p>
        ) : null}

        {isChatBlocked ? (
          <div className={styles.chat_block_wrap}>
            <img src="/img/icons/chat_block.png" alt="" />
            <p>
              Возможности для связи с пользователем нет, поскольку он
              заблокировал диалог с вами{' '}
            </p>
          </div>
        ) : (
          <>
            {previewFiles.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))',
                  gap: 10,
                }}
              >
                {previewFiles.map((p, idx) => {
                  const isImage = p.file.type.startsWith('image/');
                  const isVideo = p.file.type.startsWith('video/');
                  return (
                    <div
                      key={`${p.url}-${idx}`}
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#f2f2f2',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onRemovePreview(p.url)}
                        title="Убрать"
                        style={{
                          position: 'absolute',
                          right: 6,
                          top: 6,
                          zIndex: 2,
                          border: 0,
                          background: 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          cursor: 'pointer',
                          lineHeight: '24px',
                          textAlign: 'center',
                          fontWeight: 700,
                        }}
                      >
                        ×
                      </button>

                      {isImage ? (
                        <img
                          src={p.url}
                          alt={p.file.name}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                          }}
                        />
                      ) : isVideo ? (
                        <video
                          src={p.url}
                          controls
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8,
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <img
                              src="/img/chat_img/folder.png"
                              alt=""
                              style={{ width: 36, opacity: 0.7 }}
                            />
                            <div
                              style={{
                                fontSize: 12,
                                marginTop: 6,
                                wordBreak: 'break-all',
                              }}
                            >
                              {p.file.name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="magnafire-2 df align" style={{ marginTop: 8 }}>
              <div className="magnafire_input-2" style={{ flex: 1 }}>
                <input
                  className="inp"
                  type="text"
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={onMessageChange}
                  onKeyDown={onMessageKeyDown}
                />
              </div>
              <div className="nav_message df">
                <div style={{ position: 'relative' }}>
                  {chooseFileOpen ? (
                    <div className="frame_icon qwerewrf">
                      <label className="choice df block_file_attach__flex">
                        <div className="choice_img">
                          <img src="/img/chat_img/img.png" alt="img absent" />
                        </div>
                        <div className="im_attach pull-left align">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="im_attach_input"
                            title="Фото/Видео"
                            style={{ display: 'none' }}
                            onChange={onPickFiles}
                          />
                          <p className="block_file_attach__text">Фото или видео</p>
                        </div>
                      </label>

                      <label className="folder df block_file_attach__flex">
                        <div className="choice_img">
                          <img src="/img/chat_img/folder.png" alt="img absent" />
                        </div>
                        <div className="im_attach pull-left align">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,application/*,text/*"
                            className="im_attach_input"
                            title="Документ"
                            style={{ display: 'none' }}
                            onChange={onPickFiles}
                          />
                          <p className="block_file_attach__text">Документ</p>
                        </div>
                      </label>
                    </div>
                  ) : null}

                  <label>
                    <img
                      onClick={handleToggleAttach}
                      src="/img/chat_img/clip.png"
                      alt="img absent"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.mic_btn}
                  onClick={onMicClick}
                  disabled={!canRecordAudio || recState === 'saving'}
                  title={
                    !canRecordAudio
                      ? 'Микрофон недоступен в этом браузере'
                      : recState === 'recording'
                      ? 'Нажмите, чтобы остановить запись'
                      : 'Записать голосовое сообщение'
                  }
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    margin: 0,
                    cursor: !canRecordAudio ? 'not-allowed' : 'pointer',
                    opacity: !canRecordAudio ? 0.4 : 1,
                  }}
                >
                  <img
                    src="/img/icons/micro.png"
                    alt="mic"
                    style={{
                      filter:
                        recState === 'recording'
                          ? 'drop-shadow(0 0 6px #d00)'
                          : 'none',
                    }}
                  />
                </button>

                <div style={{ position: 'relative' }}>
                  {isEmojiVisible ? (
                    <div
                      className={styles.emoji_pos}
                      style={{ bottom: Math.max(110, footerHeight + 30) }}
                    >
                      <Suspense fallback={<div className="emoji-loading" />}>
                        <EmojiPickerLazy onEmojiClick={addEmojiToMessage} />
                      </Suspense>
                    </div>
                  ) : null}
                  <label onClick={onToggleEmoji}>
                    <img src="/img/chat_img/emoji.png" alt="img absent" />
                  </label>
                </div>

                <div
                  className="plane"
                  onClick={onSend}
                  role="button"
                  aria-label="Отправить сообщение"
                ></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessageInput;
