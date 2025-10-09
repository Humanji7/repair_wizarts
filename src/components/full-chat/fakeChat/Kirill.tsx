import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import '../../../scss/chat.css';
import Dropdown from 'react-multilevel-dropdown';
import { useSelector } from 'react-redux';
import MediaQuery from 'react-responsive';
import { Link, useParams } from 'react-router-dom';

import AddOrderModal from './AddOrderModal';
import BlackListModal from './BlackListModal';
import styles from './Chat.module.css';
import { useService } from '../../../hooks/useService';
import { getAllClientRequests } from '../../../services/request.service';
import { selectUser } from '../../../slices/user.slice';
import { selectUI } from '../../../slices/ui.slice';
import { getMasterOrders } from '../../../services/order.service';
import BlockUser from './BlockUser';
import DeleteChatModal from './DeleteChatModal';
import OkModal from './OkModal';

import type { EmojiClickData } from 'emoji-picker-react';

import appFetch from '../../../utilities/appFetch';
import OnlineDotted from '../../onlineDotted/OnlineDotted';
import DisputeModalV2 from './DisputeModal_v2';
import DisputeFinalModalV2 from './DisputeFinalModal';
import { updateRequest } from '../../../services/request.service';
import FrameMessages from './frameMessages';
import OrderDetailsBlock from './components/OrderDetailsBlock';
import ChatMessageInput, {
  type PreviewFile,
} from './components/ChatMessageInput';
import type { ChatAuthor, ChatMessage, GroupedChat } from './chatTypes';

const nowIso = () => new Date().toISOString();

const makeMsg = (
  author: ChatAuthor,
  text: string,
  files?: string[],
): ChatMessage => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
  ts: nowIso(),
  author,
  text: String(text || '').trim(),
  files: files && files.length ? files : undefined,
});
// ===========================================================================


function ChoiceOfReplenishmentMethodCard() {
  const user =
    (Object.values(useSelector(selectUser)?.data?.user || {})[0] as any) ||
    ({} as any);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [masterUser, setMasterUser] = useState<any>(null);
  const [isVisibleBlackList, setVisibleBlackList] = useState(false);
  const [isVisibleAddOrder, setVisibleAddOrder] = useState(false);
  const [isVisibleEmoji, setIsVisibleEmoji] = useState(false);
  const [isDeleteBlockChat, setIsDeleteChat] = useState(false);
  const [isBalanceError, setIsBalanceError] = useState(false);
  const [BalanceErrorNum, setBalanceErrorNum] = useState(0);
  const [isOkModal, setVisibleOkModal] = useState(false);
  const [isVisibleBlock, setIsVisibleBlock] = useState(false);
  const [zayavka__isVisibleDispute, zayavka__setVisibleDispute] =
    useState(false);
  const [zayavka__isVisibleDisputeFinal, zayavka__setisVisibleDisputeFinal] =
    useState(false);
  const { id } = useParams<{ id: string }>();
  const ui = useSelector(selectUI);
  const userRequests = useService(
    ui.isMaster ? getMasterOrders : getAllClientRequests,
    [],
  );

  const groupedChats = useMemo(() => {
    const rawRequests =
      userRequests?.data
        ?.map((item: any) => Object.values(item?.data?.booking || {}))
        .flat()
        .filter((request: any) => request?.b_id)
        .sort(
          (a, b) =>
            new Date(a.b_created).getTime() - new Date(b.b_created).getTime(),
        ) || [];
    const filteredRequests = rawRequests.filter(
      (item: any) =>
        item.b_options?.winnerMaster && item.drivers && item.drivers.length > 0,
    );
    const chatsByMaster = filteredRequests.reduce((acc: any, request: any) => {
      const masterId = request.b_options.winnerMaster;
      if (!acc[masterId]) {
        acc[masterId] = [];
      }
      acc[masterId].push(request);
      return acc;
    }, {});

    return Object.values(chatsByMaster).map((orders: any): GroupedChat => {
      const firstOrder = orders[0];
      const winnerDriver = firstOrder.drivers.find(
        (d: any) => d.u_id === firstOrder.b_options.winnerMaster,
      );
      return {
        chatId: `${firstOrder.u_id}_${firstOrder.b_options.winnerMaster}`,
        masterInfo: winnerDriver?.c_options?.author || {},
        orders: orders,
      };
    });
  }, [userRequests.data]);

  const currentChat = useMemo(() => {
    if (!id) return null;
    return groupedChats.find((chat) => chat.chatId === id) || null;
  }, [id, groupedChats]);

  const currentOrderId =
    currentChat?.orders?.[currentChat.orders.length - 1]?.b_id ?? 0;

  useEffect(() => {
    async function fetchChatParticipants() {
      if (!currentChat) return;
      const client_id = currentChat.chatId.split('_')[0];
      const master_id = currentChat.chatId.split('_')[1];

      appFetch(`user/${client_id}`, {}, true).then((v) =>
        setCurrentUser(Object.values(v.data.user || {})[0] as object),
      );
      appFetch(`user/${master_id}`, {}, true).then((v) =>
        setMasterUser(Object.values(v.data.user || {})[0] as object),
      );
    }
    fetchChatParticipants();
  }, [currentChat]);

  useEffect(() => {
    document.title = 'Чат';
    document.body.style.overflow = 'hidden';
  }, []);

  const [answer, Isanswer] = useState(false);
  const [edit, Isedit] = useState(false);
  const [chooseFile, IschooseFile] = useState(false);
  const [message, setMessage] = useState('');

  // === предпросмотр выбранных файлов до отправки ===
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  function addEmojiToMessage(emoji: EmojiClickData) {
    setMessage((prevMessage) => prevMessage + emoji.emoji);
  }

  function handleInputChat(event: React.ChangeEvent<HTMLInputElement>) {
    setMessage(event.target.value);
  }

  const [isAtBottom, setIsAtBottom] = useState(false);
  const chatBlockRef = useRef<HTMLDivElement>(null);

  // ===== измеряем высоту футера, чтобы лента не перекрывалась закреплённой панелью
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(0);

  const measureFooter = useCallback(() => {
    const h = footerRef.current?.offsetHeight || 0;
    if (h !== footerHeight) setFooterHeight(h);
  }, [footerHeight]);

  useEffect(() => {
    measureFooter();
    const ro = new ResizeObserver(() => measureFooter());
    if (footerRef.current) ro.observe(footerRef.current);
    const onResize = () => measureFooter();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [measureFooter]);

  // Помощники автоскролла
  const scrollToBottom = useCallback(() => {
    if (chatBlockRef.current) {
      chatBlockRef.current.scrollTop = chatBlockRef.current.scrollHeight;
    }
  }, [chatBlockRef]);
  const scrollToBottomSoon = useCallback(() => {
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
    setTimeout(scrollToBottom, 600);
  }, [scrollToBottom]);

  const handleScroll = () => {
    if (chatBlockRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBlockRef.current;
      const atBottom = scrollHeight - (scrollTop + clientHeight) > 200;
      setIsAtBottom(atBottom);
    }
  };

  useEffect(() => {
    // при открытии emoji/добавлении превью — переизмеряем и скроллим вниз
    measureFooter();
    scrollToBottomSoon();
  }, [isVisibleEmoji, previewFiles.length, measureFooter, scrollToBottomSoon]);

  // ===== file -> base64
  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (error) => reject(error);
    });

  // Исправленная функция для загрузки фото/файла
  const uploadPhoto = async (file: File) => {
    try {
      const base64String = await fileToBase64(file);

      const fileObject = {
        file: JSON.stringify({
          base64: base64String,
          name: file.name,
        }),
      };
      const response = await appFetch(
        '/dropbox/file/',
        {
          method: 'POST',
          body: fileObject,
        },
        true,
      );
      const result = await response;
      return `https://ibronevik.ru/taxi/api/v1/dropbox/file/${result.data.dl_id}`;
    } catch (error) {
      console.error('Ошибка в функции uploadPhoto:', error);
      throw error;
    }
  };

  // ===== выбор файлов (фото/видео/доки) — только предпросмотр, загрузка при отправке
  async function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const previews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPreviewFiles((prev) => [...prev, ...previews]);

    e.target.value = '';
  }
  function removePreview(url: string) {
    setPreviewFiles((prev) => prev.filter((p) => p.url !== url));
    URL.revokeObjectURL(url);
  }

  // ===== Микрофон (MediaRecorder) — формируем файл и тоже через uploadPhoto
  const [recState, setRecState] = useState<'idle' | 'recording' | 'saving'>(
    'idle',
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<BlobPart[]>([]);

  const canRecordAudio =
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices && (window as any).MediaRecorder);

  async function handleMicClick() {
    if (!canRecordAudio) return;

    if (recState === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        recChunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) recChunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          setRecState('saving');
          try {
            const blob = new Blob(recChunksRef.current, {
              type: mr.mimeType || 'audio/webm',
            });
            const file = new File([blob], `audio_${Date.now()}.webm`, {
              type: blob.type || 'audio/webm',
            });
            const url = URL.createObjectURL(file);
            setPreviewFiles((prev) => [...prev, { file, url }]);
          } catch (e) {
            console.error('audio save error', e);
            alert('Не удалось сохранить аудио.');
          } finally {
            setRecState('idle');
            stream.getTracks().forEach((t) => t.stop());
          }
        };
        mr.start();
        setRecState('recording');
      } catch (e) {
        console.error('mic error', e);
        alert('Нет доступа к микрофону.');
      }
    } else if (recState === 'recording') {
      mediaRecorderRef.current?.stop();
    }
  }

  // ===== ЧАТ: отправка сообщения =====
  async function sendChatMessage(
    order: any,
    who: 'client' | 'master',
    text: string,
    files?: string[],
  ) {
    const author: ChatAuthor = who === 'client' ? 'client' : 'admin';
    const msg = makeMsg(author, text, files);

    try {
      const prev: ChatMessage[] = Array.isArray(order?.b_options?.chat_history)
        ? (order.b_options.chat_history as ChatMessage[])
        : [];
      const next = [...prev, msg];

      order.b_options.chat_history = next;

      if (who === 'client') {
        await updateRequest(order.b_id, { chat_history: next });
      } else {
        await updateRequest(
          order.b_id,
          { chat_history: next },
          true,
          order.u_id,
        );
      }
    } catch (e) {
      console.error('sendChatMessage error', e);
      alert('Не удалось отправить сообщение.');
    }
  }

  const handleSend = async () => {
    const text = message.trim();
    const hasFiles = previewFiles.length > 0;
    if (!text && !hasFiles) return;
    if (!currentChat?.orders?.length) return;

    const order = currentChat.orders[currentChat.orders.length - 1];
    const role: 'client' | 'master' = ui.isMaster ? 'master' : 'client';

    // 1) загружаем все файлы → получаем постоянные URL
    const uploadedUrls: string[] = [];
    for (const { file, url } of previewFiles) {
      try {
        const permanentUrl = await uploadPhoto(file);
        uploadedUrls.push(permanentUrl);
      } catch (e) {
        console.error('upload error', e);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // 2) отправляем сообщение
    await sendChatMessage(
      order,
      role,
      text,
      uploadedUrls.length ? uploadedUrls : undefined,
    );

    // 3) очистка и перерисовка
    setMessage('');
    setPreviewFiles([]);
    userRequests.refetch();
    scrollToBottomSoon();
  };

  // отправка по Enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const chatBlock = chatBlockRef.current;
    if (chatBlock) {
      chatBlock.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => {
      if (chatBlock) {
        chatBlock.removeEventListener('scroll', handleScroll);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottomSoon();
  }, [userRequests.data, id, scrollToBottomSoon]);

  // Псевдо-вебсокет — опрос каждые 30 секунд
  useEffect(() => {
    const t = setInterval(() => {
      userRequests.refetch();
      scrollToBottomSoon();
    }, 30000);
    return () => clearInterval(t);
  }, [userRequests, scrollToBottomSoon]);

  // Helpers last online
  const getTimeSinceLastOnline = (lastTimeBeenOnline: string) => {
    const lastOnline = new Date(lastTimeBeenOnline);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastOnline.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60)
      return `${diffInMinutes} ${getMinutesWord(diffInMinutes)}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${getHoursWord(diffInHours)}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${getDaysWord(diffInDays)}`;
  };

  const getMinutesWord = (minutes: number) => {
    const lastDigit = minutes % 10;
    const lastTwo = minutes % 100;
    if (lastTwo < 11 || lastTwo > 14) {
      if (lastDigit === 1) return 'минуту';
      if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
    }
    return 'минут';
  };

  const getHoursWord = (hours: number) => {
    const lastDigit = hours % 10;
    const lastTwo = hours % 100;
    if (lastTwo < 11 || lastTwo > 14) {
      if (lastDigit === 1) return 'час';
      if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
    }
    return 'часов';
  };

  const getDaysWord = (days: number) => {
    const lastDigit = days % 10;
    const lastTwo = days % 100;
    if (lastTwo < 11 || lastTwo > 14) {
      if (lastDigit === 1) return 'день';
      if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    }
    return 'дней';
  };

  const isChatBlocked = !!currentUser?.u_details?.black_list?.find(
    (item: any) => item.id?.toString() === user.u_id?.toString(),
  );

  if ((!currentUser || !masterUser) && id) return <>Загрузка...</>;

  return (
    <>
      {zayavka__isVisibleDispute ? (
        <DisputeModalV2
          refetchRequests={userRequests.refetch}
          id={currentOrderId}
          setVisibleDispute={zayavka__setVisibleDispute}
          setVisibleDisputeFinal={zayavka__setisVisibleDisputeFinal}
        />
      ) : null}
      {zayavka__isVisibleDisputeFinal ? (
        <DisputeFinalModalV2
          setVisibleDisputeFinal={zayavka__setisVisibleDisputeFinal}
        />
      ) : null}
      {isOkModal ? <OkModal setVisibleBlackList={setVisibleOkModal} /> : null}
      {isDeleteBlockChat ? (
        <DeleteChatModal setVisibleBlackList={setIsDeleteChat} />
      ) : null}
      {isVisibleBlock ? (
        <BlockUser setVisibleBlackList={setIsVisibleBlock} />
      ) : null}
      {isVisibleBlackList ? (
        <BlackListModal setVisibleBlackList={setVisibleBlackList} />
      ) : null}
      {isVisibleAddOrder ? (
        <AddOrderModal
          setVisibleAddOrder={setVisibleAddOrder}
          setVisibleOkModal={setVisibleOkModal}
          currentOrder={currentChat?.orders[0] || {}}
        />
      ) : null}

      <section className={styles.container}>
        {id ? (
          <>
            {window.location.href.includes('master') ? (
              <MediaQuery query="(min-device-width: 1615px)">
                <FrameMessages />
              </MediaQuery>
            ) : (
              <MediaQuery query="(min-device-width: 1300px)">
                <FrameMessages />
              </MediaQuery>
            )}
          </>
        ) : (
          <FrameMessages />
        )}

        {id && currentChat ? (
          <div className={`profil fchat__profile ${styles.profil}`}>
            <div
              className={`kiril_profil kiril_profil_fchat df font_inter ${styles.profile_top_row}`}
              style={{ gap: '10px' }}
            >
              <div
                onClick={scrollToBottom}
                className={`${styles.scroll_to_bottom} ${
                  isAtBottom ? styles.visible : styles.hidden
                }`}
                aria-label="Scroll down"
                style={
                  {
                    // подвинем кнопку выше футера на лету
                    bottom: Math.max(120, footerHeight + 40),
                  } as any
                }
              >
                <img
                  src="/img/dropdownuser.png"
                  className="dropdownuser_arrow"
                  alt="Scroll Down"
                />
              </div>
              <Link to="/profile-number">
                <div className="kirill df align" style={{ gap: '10px' }}>
                  <div
                    className={`prof_img chatfgetu twerwe ${styles.profile_row}`}
                  >
                    <Link
                      to={
                        window.location.href.includes('master')
                          ? '/master/chat/'
                          : '/client/chat/'
                      }
                      className={`backtoframemessagesLink ${
                        window.location.href.includes('master')
                          ? styles.master__arrow_back
                          : ''
                      }`}
                    >
                      <img src="/img/chat_back.png" alt="" />
                    </Link>
                    <div style={{ position: 'relative' }}>
                      <div className={styles.dotted_wrap}>
                        <OnlineDotted
                          isVisible={masterUser?.u_details?.isOnline}
                        />
                      </div>
                      <img
                        src={masterUser?.u_photo || '/img/img-camera.png'}
                        alt="img absent"
                        style={{ height: 65, width: 66, borderRadius: 30 }}
                      />
                    </div>
                  </div>

                  <div className="nik">
                    <h2 className="eyrqwe">{masterUser?.u_name}</h2>
                    <div className="info_nik df">
                      <div className="kiril_info">
                        <h3>
                          {masterUser?.u_details?.isOnline
                            ? 'Онлайн'
                            : `Офлайн ${getTimeSinceLastOnline(
                                masterUser?.u_details?.lastTimeBeenOnline ||
                                  new Date().toISOString(),
                              )}`}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div style={{ flex: 1 }}></div>

              <Dropdown
                title={
                  <>
                    <div className={styles.dotted}>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </>
                }
                buttonClassName={styles.drop_button}
                menuClassName={styles.drop_menu}
              >
                <div>
                  {window.location.pathname.includes('/master/chat') ? null : (
                    <Dropdown.Item
                      className={styles.item_modile}
                      onClick={() => setVisibleAddOrder(true)}
                    >
                      <img src="/img/icons/review.png" alt="" />
                      Заказать ещё
                    </Dropdown.Item>
                  )}
                  {window.location.pathname.includes('/master/chat') ? null : (
                    <Dropdown.Item className={styles.item}>
                      <img src="/img/icons/review.png" alt="" />
                      Оставить отзыв
                    </Dropdown.Item>
                  )}

                  <Dropdown.Item
                    className={styles.item}
                    onClick={() => {
                      // Логика блокировки
                    }}
                  >
                    <img src="/img/icons/block.png" alt="" />
                    Заблокировать
                  </Dropdown.Item>
                  <Dropdown.Item
                    className={styles.item}
                    onClick={() => setVisibleBlackList(true)}
                  >
                    <img src="/img/icons/ban.png" alt="" />
                    Чёрный список
                  </Dropdown.Item>
                  <Dropdown.Item
                    className={styles.item}
                    onClick={() => setIsDeleteChat(true)}
                  >
                    <img src="/img/icons/trash.png" alt="" />
                    Удалить чат
                  </Dropdown.Item>
                </div>
              </Dropdown>

              {window.location.pathname.includes('/master/chat') ? null : (
                <button
                  className={`ordermore inter ${styles.button_more}`}
                  onClick={() => setVisibleAddOrder(true)}
                >
                  Заказать еще
                </button>
              )}
            </div>

            <div
              className={`awqervgg chat_block__ashd ${styles.chatt}`}
              ref={chatBlockRef}
            >
              {currentChat.orders.map((order) => (
                <OrderDetailsBlock
                  key={order.b_id}
                  order={order}
                  currentUser={currentUser}
                  masterUser={masterUser}
                  setIsBalanceError={setIsBalanceError}
                  setBalanceErrorNum={setBalanceErrorNum}
                  viewerIsMaster={ui.isMaster}
                />
              ))}
            </div>

            <ChatMessageInput
              message={message}
              onMessageChange={handleInputChat}
              onMessageKeyDown={handleInputKeyDown}
              onSend={handleSend}
              previewFiles={previewFiles}
              onRemovePreview={removePreview}
              isBalanceError={isBalanceError}
              balanceErrorAmount={BalanceErrorNum}
              isAnswerMode={answer}
              onCancelAnswer={() => Isanswer(false)}
              isEditMode={edit}
              onCancelEdit={() => Isedit(false)}
              isChatBlocked={isChatBlocked}
              chooseFileOpen={chooseFile}
              onToggleChooseFile={() => IschooseFile((prev) => !prev)}
              onPickFiles={handlePickFiles}
              onMicClick={handleMicClick}
              recState={recState}
              canRecordAudio={canRecordAudio}
              isEmojiVisible={isVisibleEmoji}
              onToggleEmoji={() => setIsVisibleEmoji((prev) => !prev)}
              footerHeight={footerHeight}
              addEmojiToMessage={addEmojiToMessage}
              footerRef={footerRef}
            />
          </div>
        ) : (
          <div className={styles.empty_chat}>
            <img src="/img/empty_chat.png" alt="" />
            <p>Пожалуйста, выберите диалог чтобы видеть сообщение!</p>
          </div>
        )}
      </section>
    </>
  );
}

export default ChoiceOfReplenishmentMethodCard;
