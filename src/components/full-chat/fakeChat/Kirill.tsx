import type {
  FC,
  Dispatch,
  SetStateAction,
  KeyboardEvent} from 'react';
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Suspense
} from 'react';
import '../../../scss/chat.css';
import Dropdown from 'react-multilevel-dropdown';
import { useSelector } from 'react-redux';
import MediaQuery from 'react-responsive';
import { Link, useParams } from 'react-router-dom';

import AddFeedbackModal from './AddFeedbackModal';
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
import SimpleDialog from '../../../shared/ui/SimpleDialog/SimpleDialog';

const LazySwiper = React.lazy(() => import('../../../shared/ui/SwiperWrapper').then(m => ({ default: m.SwiperWithModules })));
const LazySwiperSlide = React.lazy(() => import('../../../shared/ui/SwiperWrapper').then(m => ({ default: m.SwiperSlide })));
const EmojiPickerLazy = React.lazy(() => import('emoji-picker-react'));

// ====== ЧАТ: типы и утилиты ===============================================
type ChatAuthor = 'client' | 'master' | 'admin';

interface ChatMessage {
  id: string; // uuid
  ts: string; // ISO
  author: ChatAuthor;
  text: string;
  files?: string[]; // постоянные ссылки https://ibronevik.ru/taxi/api/v1/dropbox/file/{id}
}

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

// ====== Хронологический таймлайн событий ======
type TimelineKind =
  | 'order_created'
  | 'chat'
  | 'cancel_requested'
  | 'cancel_master_accepted'
  | 'cancel_master_rejected'
  | 'dispute_opened'
  | 'dispute_master_accepted'
  | 'dispute_master_rejected'
  | 'order_completed';

interface TimelineItemBase {
  ts: string; // ISO
  kind: TimelineKind;
}

interface TimelineChatItem extends TimelineItemBase {
  kind: 'chat';
  msg: ChatMessage;
}

interface TimelineSimpleItem extends TimelineItemBase {
  kind:
    | 'order_created'
    | 'cancel_requested'
    | 'cancel_master_accepted'
    | 'cancel_master_rejected'
    | 'dispute_opened'
    | 'dispute_master_accepted'
    | 'dispute_master_rejected'
    | 'order_completed';
}

type TimelineItem = TimelineChatItem | TimelineSimpleItem;
// =================================================

/**
 * ВСПОМОГАТЕЛЬНОЕ: парсинг имени файла из заголовка Content-Disposition
 */
const parseFilename = (cd: string | null): string | null => {
  if (!cd) return null;
  // filename*=UTF-8''name or filename="name"
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const simple = /filename="([^"]+)"/i.exec(cd);
  if (simple?.[1]) return simple[1];
  return null;
};

/**
 * ЕДИНАЯ ЗАГРУЗКА ФАЙЛА ИЗ DROPBOX API (POST, токен/хэш)
 * Возвращает objectURL, mime, filename.
 */
const fetchDropboxObjectUrl = async (
  apiUrl: string,
): Promise<{ objectUrl: string; mime: string; filename: string | null }> => {
  const res = await fetch(apiUrl, {
    method: 'POST',
    body: new URLSearchParams({
      token: 'bbdd06a50ddcc1a4adc91fa0f6f86444',
      u_hash:
        'VLUy4+8k6JF8ZW3qvHrDZ5UDlv7DIXhU4gEQ82iRE/zCcV5iub0p1KhbBJheMe9JB95JHAXUCWclAwfoypaVkLRXyQP29NDM0NV1l//hGXKk6O43BS3TPCMgZEC4ymtr',
    }),
  });
  const mime = res.headers.get('Content-Type') || 'application/octet-stream';
  const filename = parseFilename(res.headers.get('Content-Disposition'));
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, mime, filename };
};

// Типизированный компонент для dropbox-фото (оставил как было — используется в карточках заказа)
const DropboxImage: FC<{
  url: string;
  alt?: string;
  style?: React.CSSProperties;
}> = ({ url, alt = '', style }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(
    url && url.startsWith('blob:') ? url : null,
  );
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let revoked = false;
    if (!url) return;
    if (url.startsWith('blob:')) {
      setImgUrl(url);
      return;
    }
    const match = url.match(/\/dropbox\/file\/(\d+)/);
    const id = match ? match[1] : null;
    if (!id) return;
    // IMPORTANT: получаем файл по API (POST с токеном)
    fetch(`https://ibronevik.ru/taxi/c/tutor/api/v1/dropbox/file/${id}`, {
      method: 'POST',
      body: new URLSearchParams({
        token: 'bbdd06a50ddcc1a4adc91fa0f6f86444', // тот же проект
        u_hash:
          'VLUy4+8k6JF8ZW3qvHrDZ5UDlv7DIXhU4gEQ82iRE/zCcV5iub0p1KhbBJheMe9JB95JHAXUCWclAwfoypaVkLRXyQP29NDM0NV1l//hGXKk6O43BS3TPCMgZEC4ymtr',
      }),
    })
      .then(async (res) => {
        const blob = await (res.blob ? res.blob() : res);
        // @ts-ignore
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        if (!revoked) setImgUrl(objectUrl);
      })
      .catch(() => setError(true));
    return () => {
      revoked = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [url]);

  if (error)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Ошибка загрузки фото
      </div>
    );
  if (!imgUrl)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Загрузка...
      </div>
    );
  return <img src={imgUrl} alt={alt} style={style || { width: '100%' }} />;
};

/**
 * НОВОЕ: Универсальный предпросмотр файла из Dropbox API
 * - Грузит через POST (как изображение выше)
 * - Показывает inline для image/video/audio/pdf
 * - Для остальных — иконка и кнопка "Скачать" с корректным именем.
 */
const DropboxFilePreview: FC<{
  url: string;
  style?: React.CSSProperties;
}> = ({ url, style }) => {
  const [state, setState] = useState<{
    objectUrl: string | null;
    mime: string;
    filename: string | null;
    error: boolean;
  }>({
    objectUrl: null,
    mime: 'application/octet-stream',
    filename: null,
    error: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const objUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        if (!url) return;
        // blob: — показываем сразу
        if (url.startsWith('blob:')) {
          if (!canceled) {
            setState({
              objectUrl: url,
              mime: 'application/octet-stream',
              filename: null,
              error: false,
            });
          }
          return;
        }
        // dropbox id
        const m = url.match(/\/dropbox\/file\/(\d+)/);
        const id = m?.[1];
        if (!id) {
          // не наш API — отдаём как есть ссылку
          if (!canceled) {
            setState({
              objectUrl: url,
              mime: 'application/octet-stream',
              filename: null,
              error: false,
            });
          }
          return;
        }
        const { objectUrl, mime, filename } = await fetchDropboxObjectUrl(
          `https://ibronevik.ru/taxi/c/tutor/api/v1/dropbox/file/${id}`,
        );
        objUrlRef.current = objectUrl;
        if (!canceled) {
          setState({ objectUrl, mime, filename, error: false });
        }
      } catch (e) {
        if (!canceled) setState((s) => ({ ...s, error: true }));
      }
    };
    run();
    return () => {
      canceled = true;
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, [url]);

  // Закрытие по ESC + блокируем прокрутку боди, пока открыт просмотр
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e as any).key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown as any);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown as any);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (state.error)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        Ошибка загрузки файла
      </div>
    );

  if (!state.objectUrl)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        Загрузка файла...
      </div>
    );

  const mime = state.mime || '';
  const isImg = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');
  const isPdf = mime === 'application/pdf';

  if (isImg) {
    return (
      <>
        {/* Миниатюра */}
        <img
          src={state.objectUrl}
          alt={state.filename || 'file'}
          style={{
            width: '100%',
            height: 120,
            objectFit: 'cover',
            borderRadius: 8,
            cursor: 'pointer',
            ...(style || {}),
          }}
          onClick={() => setIsOpen(true)}
        />

        {/* Модалка полноэкранного просмотра */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'zoom-out',
            }}
          >
            <img
              src={state.objectUrl}
              alt={state.filename || 'file'}
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                borderRadius: 10,
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()} // чтобы клик по самой картинке не закрывал
            />
            {/* Кнопка закрытия (опционально) */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
              style={{
                position: 'fixed',
                top: 16,
                right: 16,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </div>
        )}
      </>
    );
  }

  if (isVideo) {
    return (
      <video
        src={state.objectUrl}
        controls
        style={{
          width: '100%',
          height: 120,
          objectFit: 'cover',
          borderRadius: 8,
          ...(style || {}),
        }}
      />
    );
  }

  if (isAudio) {
    return (
      <audio
        src={state.objectUrl}
        controls
        style={{ width: '100%', ...(style || {}) }}
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={state.objectUrl}
        title={state.filename || 'document'}
        style={{
          width: '100%',
          height: 300,
          border: 'none',
          borderRadius: 8,
          ...(style || {}),
        }}
      />
    );
  }

  // Остальные типы — иконка + кнопка скачать
  return (
    <div
      style={{
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 12,
        background: '#f6f6f6',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <img
          src="/img/chat_img/folder.png"
          alt=""
          style={{ width: 36, opacity: 0.7 }}
        />
        <div
          style={{
            fontSize: 13,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            maxWidth: 180,
          }}
          title={state.filename || 'Вложение'}
        >
          {state.filename || 'Вложение'}
        </div>
      </div>
      <a
        href={state.objectUrl}
        download={state.filename || 'file'}
        className={styles.file_link}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: '#fff',
          border: '1px solid #ddd',
        }}
      >
        Скачать
      </a>
    </div>
  );
};

interface MasterInfo {
  u_photo?: string;
  u_name?: string;
}

interface GroupedChat {
  chatId: string;
  masterInfo: MasterInfo;
  orders: any[];
}

interface OrderDetailsBlockProps {
  order: any;
  setOrderId: Dispatch<SetStateAction<number>>;
  setIsOpenDisput: Dispatch<SetStateAction<boolean>>;
  currentUser: any;
  masterUser: any;
  setIsBalanceError: Dispatch<SetStateAction<boolean>>;
  setBalanceErrorNum: Dispatch<SetStateAction<number>>;
  refetchRequests: () => void; // Используем refetch
  // НОВОЕ: кто смотрит чат (мастер или клиент)
  viewerIsMaster: boolean;
}

const OrderDetailsBlock: FC<OrderDetailsBlockProps> = ({
  order,
  currentUser,
  masterUser,
  refetchRequests,
  setOrderId,
  setIsOpenDisput,
  setIsBalanceError,
  setBalanceErrorNum,
  viewerIsMaster, // НОВОЕ
}) => {
  const user =
    (Object.values(useSelector(selectUser)?.data?.user || {})[0] as any) ||
    ({} as any);

  // ===== ЧАТ: история для этого заказа =====
  const chatHistory: ChatMessage[] = useMemo(() => {
    const raw = order?.b_options?.chat_history;
    const arr = Array.isArray(raw) ? (raw as ChatMessage[]) : [];
    // сортируем сообщения по времени (старые -> новые)
    return [...arr].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );
  }, [order?.b_options?.chat_history]);
  // ========================================

  // ===== Таймлайн для этого заказа (единая лента) =====
  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    // 3.1 Создание заказа
    if (order?.b_created) {
      items.push({
        kind: 'order_created',
        ts: order.b_created,
      } as TimelineSimpleItem);
    }

    // 3.2 Запрос отмены (клиент)
    if (
      order?.b_options?.is_request_for_cancel_exist &&
      order?.b_options?.cancel_requested_ts
    ) {
      items.push({
        kind: 'cancel_requested',
        ts: order.b_options.cancel_requested_ts,
      } as TimelineSimpleItem);
    }

    // 3.3 Решение мастера по отмене
    if (
      typeof order?.b_options?.is_master_agree_with_cancel === 'boolean' &&
      order?.b_options?.cancel_master_decision_ts
    ) {
      items.push({
        kind: order.b_options.is_master_agree_with_cancel
          ? 'cancel_master_accepted'
          : 'cancel_master_rejected',
        ts: order.b_options.cancel_master_decision_ts,
      } as TimelineSimpleItem);
    }

    // 3.4 Открытие спора
    if (
      order?.b_options?.is_open_dispute &&
      order?.b_options?.dispute_opened_ts
    ) {
      items.push({
        kind: 'dispute_opened',
        ts: order.b_options.dispute_opened_ts,
      } as TimelineSimpleItem);
    }

    // 3.5 Решение мастера по спору
    if (
      typeof order?.b_options?.is_master_agree_with_dispute === 'boolean' &&
      order?.b_options?.dispute_master_decision_ts
    ) {
      items.push({
        kind: order.b_options.is_master_agree_with_dispute
          ? 'dispute_master_accepted'
          : 'dispute_master_rejected',
        ts: order.b_options.dispute_master_decision_ts,
      } as TimelineSimpleItem);
    }

    // 3.6 Завершение заказа
    if (order?.b_state === '4' && order?.b_options?.complete_ts) {
      items.push({
        kind: 'order_completed',
        ts: order.b_options.complete_ts,
      } as TimelineSimpleItem);
    }

    // 3.7 Сообщения чата
    for (const m of chatHistory) {
      if (m?.ts) {
        items.push({
          kind: 'chat',
          ts: m.ts,
          msg: m,
        } as TimelineChatItem);
      }
    }

    // сортировка по времени (от старых к новым)
    items.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    return items;
  }, [
    order?.b_created,
    order?.b_state,
    order?.b_options?.is_request_for_cancel_exist,
    order?.b_options?.cancel_requested_ts,
    order?.b_options?.is_master_agree_with_cancel,
    order?.b_options?.cancel_master_decision_ts,
    order?.b_options?.is_open_dispute,
    order?.b_options?.dispute_opened_ts,
    order?.b_options?.is_master_agree_with_dispute,
    order?.b_options?.dispute_master_decision_ts,
    order?.b_options?.complete_ts,
    chatHistory,
  ]);
  // =====================================================

  // Локальное состояние для каждого блока заказа
  //~ const [isLoading, setIsLoading] = useState(false);

  // Состояния для управления UI конкретного заказа
  const [isVisibleAddFeedback, setVisibleAddFeedback] = useState(false);

  // Add balance check
  useEffect(() => {
    const masterReqData =
      order.drivers?.find((d: any) => d.u_id === order.b_options.winnerMaster)
        ?.c_options || {};

    if (masterReqData?.bind_amount > user?.u_details?.balance) {
      setIsBalanceError(true);
      setBalanceErrorNum(
        Number(masterReqData.bind_amount) -
          Number(user?.u_details?.balance || 0),
      );
    } else {
      setIsBalanceError(false);
      setBalanceErrorNum(0);
    }
  }, [order, user?.u_details?.balance, setIsBalanceError, setBalanceErrorNum]);
  // --- НАЧАЛО: Логика для кнопок подтверждения и отмены ---
  //~ const handleConfirmOrder = async () => {
    //~ const masterReqData =
      //~ order.drivers?.find((d: any) => d.u_id === order.b_options.winnerMaster)
        //~ ?.c_options || {};

    //~ // Calculate total amount with 9% commission
    //~ const commission = Number(masterReqData.bind_amount) * 0.09;
    //~ const totalAmount = Number(masterReqData.bind_amount) + commission;

    //~ if (totalAmount > Number(user?.u_details?.balance || 0)) {
      //~ console.log(masterUser);
      //~ setIsBalanceError(true);
      //~ setBalanceErrorNum(totalAmount - Number(user?.u_details?.balance || 0));
      //~ return;
    //~ }

    //~ setIsLoading(true);
    //~ try {
      //~ await appFetch(`/drive/get/${order.b_id}`, {
        //~ body: {
          //~ u_a_role: 1,
          //~ u_id: masterUser.u_id,
          //~ action: 'set_performer',
        //~ },
      //~ });

      //~ // Шаг 2: Завершаем заказ
      //~ await appFetch(`/drive/get/${order.b_id}`, {
        //~ body: {
          //~ u_a_role: 1,
          //~ action: 'set_complete_state',
        //~ },
      //~ }).then((v) => console.log(v));

      //~ // Update master's balance (full amount)
      //~ updateUser(
        //~ {
          //~ details: {
            //~ balance:
              //~ Number(masterReqData.bind_amount) +
              //~ Number(masterUser.u_details.balance),
          //~ },
        //~ },
        //~ masterUser.u_id,
        //~ true,
      //~ );

      //~ // Update client's balance (amount + commission)
      //~ updateUser(
        //~ {
          //~ details: {
            //~ balance: Number(user.u_details?.balance || 0) - totalAmount,
          //~ },
        //~ },
        //~ user.u_id,
        //~ true,
      //~ );

      //~ // ====== ДОБАВИЛИ отметку времени завершения в b_options ======
      //~ await updateRequest(
        //~ order.b_id,
        //~ {
          //~ complete_ts: nowIso(),
        //~ },
        //~ true,
        //~ order.u_id,
      //~ );

      //~ console.log(`Заказ ${order.b_id} успешно подтвержден и завершен.`);
      //~ refetchRequests(); // Обновляем список заказов
    //~ } catch (error) {
      //~ console.error('Ошибка при подтверждении заказа:', error);
    //~ } finally {
      //~ setIsLoading(false);
    //~ }
  //~ };

  //~ const handleCancelOrder = async () => {
    //~ setIsLoading(true);
    //~ try {
      //~ // Обновляем b_options, добавляя флаг отмены + время
      //~ await updateRequest(order.b_id, {
        //~ is_request_for_cancel_exist: true,
        //~ cancel_requested_ts: nowIso(), // <— отметка времени
      //~ });
      //~ console.log(`Запрос на отмену заказа ${order.b_id} отправлен.`);
      //~ refetchRequests(); // Обновляем список
    //~ } catch (error) {
      //~ console.error('Ошибка при отмене заказа:', error);
    //~ } finally {
      //~ setIsLoading(false);
    //~ }
  //~ };
  //~ const handleOpenDispute = async () => {
    //~ setOrderId(order.b_id);
    //~ setIsOpenDisput(true);
    //~ try {
      //~ await updateRequest(order.b_id, {
        //~ is_open_dispute: true,
        //~ dispute_opened_ts: nowIso(), // <— отметка времени
      //~ });
    //~ } catch (e) {
      //~ console.error('open dispute error', e);
    //~ }
  //~ };
  // --- КОНЕЦ: Логика для кнопок ---

  //~ function formatTimeByHours(hours: number) {
    //~ if (Number.isNaN(hours)) return 'Готов ждать';
    //~ if (hours >= 24) {
      //~ const days = Math.floor(hours / 24);
      //~ const lastDigit = days % 10;
      //~ const lastTwo = days % 100;
      //~ let word = 'дней';
      //~ if (lastTwo < 11 || lastTwo > 14) {
        //~ if (lastDigit === 1) word = 'день';
        //~ else if (lastDigit >= 2 && lastDigit <= 4) word = 'дня';
      //~ }
      //~ return `${days} ${word}`;
    //~ } else {
      //~ const lastDigit = hours % 10;
      //~ const lastTwo = hours % 100;
      //~ let word = 'часов';
      //~ if (lastTwo < 11 || lastTwo > 14) {
        //~ if (lastDigit === 1) return 'час';
        //~ else if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
      //~ }
      //~ return `${hours} ${word}`;
    //~ }
  //~ }

  const driverData = order.drivers?.find(
    (d: any) => d.u_id === order.b_options.winnerMaster,
  );
  const masterReqData = driverData?.c_options || {};
  //~ const isOrderCompleted = order.b_state === '4';
  //~ const isCancelRequested =
    //~ !!order.b_options?.is_request_for_cancel_exist || order.b_state == '3';
  //~ const isOwner = order.u_id === user?.u_id;
  //~ const isMasterAgreeWithCancelRequest =
    //~ order.b_options.is_master_agree_with_cancel || order.b_state == '3';
  //~ const isOpenDispute = order.b_options.is_open_dispute;
  //~ const isMasterAgreeWithDispute = order.b_options.is_master_agree_with_dispute;
  // Получаем массив ссылок на фото
  const photoUrls: string[] =
    (order.b_options?.client_feedback_photo_urls as string[]) ||
    (order.b_options?.photoUrls as string[]) ||
    [];

  return (
    <>
      <SimpleDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ isOpen: false, message: '' })}
        title={dialog.message}
        actions={[
          {
            id: 'close-dialog',
            label: 'Закрыть',
            variant: 'primary',
            onClick: () => setDialog({ isOpen: false, message: '' }),
          },
        ]}
      />
      {isVisibleAddFeedback && (
        <AddFeedbackModal
          id={order.b_id}
          setVisibleAddFeedback={setVisibleAddFeedback}
          setVisibleFinalOrder={() => {}}
        />
      )}

      {/* Полный JSX блока заказа */}
      <div className="chat_technical_message">
        <div className={`${styles.message_block} ${styles.text_right}`}>
          <div className="my_chat">
            <div
              className="correspondence-active font_inter df"
              style={{ gap: '10px' }}
            >
              <div className="ciril-img" style={{ opacity: 0 }}>
                <img
                  src="/img/chat_img/2.png"
                  style={{ width: '58px', height: '58px' }}
                  alt="img absent"
                />
              </div>
              <div className="let">
                <div
                  className="letter_kiril df"
                  style={{ gap: '10px', justifyContent: 'flex-end' }}
                >
                  <div className="letter_text-2">
                    <h3>13:44</h3>
                  </div>
                  <div className="letter_text-1">
                    <h2>Вы</h2>
                  </div>
                  <img
                    src={currentUser.u_photo || '/img/img-camera.png'}
                    style={{ width: '58px', height: '58px', borderRadius: 30 }}
                    alt="img absent"
                  />
                </div>
                <div className={styles.block_bid}>
                  <p>
                    {order.b_options.orderType === 'request'
                      ? 'Выбранная модель устройства'
                      : 'Размещен на биржи заказ'}{' '}
                    <Link
                      to={'/master/requests'}
                      className={styles.block_bid__link}
                    >
                      {order?.b_options?.title}
                    </Link>
                  </p>
                  {order.b_options.orderType === 'request' && (
                    <p>
                      Перечень работ:
                      <span>{order?.b_options?.title}</span>
                    </p>
                  )}
                  <p>Описание клиента {order?.b_options?.description}</p>
                  <p>
                    Мастер откликнулся на этот заказ, сделав предложение на
                    сумму {masterReqData?.bind_amount} рублей.
                  </p>
                  <p>
                    Слова мастера из{' '}
                    {order.b_options.orderType === 'request'
                      ? 'заявки'
                      : 'заказа на бирже!'}{' '}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Фото заказа (если есть массив ссылок в заказе) */}
      {photoUrls.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <Suspense fallback={<div className="swiper-loading" />}>
            <LazySwiper
              slidesPerView={3}
              spaceBetween={10}
              navigation={true}
              style={{ width: 300, height: 120 }}
            >
              {photoUrls.map((url, idx) => (
                <LazySwiperSlide key={idx}>
                  <DropboxImage
                    url={typeof url === 'string' ? url : (url as any).url}
                    alt={`Фото ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                </LazySwiperSlide>
              ))}
            </LazySwiper>
          </Suspense>
        </div>
      )}

      {/* ====== ЕДИНЫЙ ТАЙМЛАЙН (ВСЁ ПО ВРЕМЕНИ) ====== */}
      {timeline.length > 0 && (
        <div className="chat_technical_message">
          <div className={`${styles.message_block} ${styles.text_left}`}>
            <div
              className="correspondence df font_inter"
              style={{ flexDirection: 'column', gap: 10 }}
            >
              {timeline.map((item, idx) => {
                if (item.kind === 'chat') {
                  const m = (item as TimelineChatItem).msg;
                  // кто сейчас смотрит чат: мастер или клиент
                  const viewerIsMaster =
                    typeof window !== 'undefined' &&
                    window.location.pathname.includes('/master/');

                  // у нас в истории авторы: 'client' и иногда 'master' или 'admin' (мастерские сообщения шлём как 'admin')
                  // считаем "моё" по роли зрителя
                  const isMine = viewerIsMaster
                    ? m.author === 'master' || m.author === 'admin'
                    : m.author === 'client';
                  const bubbleSide = isMine
                    ? styles.text_right
                    : styles.text_left;

                  const renderFiles = (files?: string[]) => {
                    if (!files || !files.length) return null;
                    return (
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        {files.map((u, i) => {
                          const isBlob = u.startsWith('blob:');
                          const isDropbox = /\/dropbox\/file\/\d+/.test(u);

                          if (isBlob || isDropbox) {
                            return (
                              <div
                                key={i}
                                style={{ width: 200, maxWidth: '100%' }}
                              >
                                <DropboxFilePreview
                                  url={u}
                                  style={{ width: '100%' }}
                                />
                              </div>
                            );
                          }
                          return (
                            <a
                              key={i}
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.file_link}
                            >
                              Вложение {i + 1}
                            </a>
                          );
                        })}
                      </div>
                    );
                  };

                  // показываем "Вы" только на своих сообщениях
                  const authorName = isMine
                    ? 'Вы'
                    : viewerIsMaster
                    ? currentUser?.u_name || 'Клиент'
                    : masterUser?.u_name || 'Исполнитель';

                  // аватар показываем у собеседника (слева), у своих можно не показывать
                  const avatarSrc = viewerIsMaster
                    ? isMine
                      ? masterUser?.u_photo || '/img/img-camera.png'
                      : currentUser?.u_photo || '/img/img-camera.png'
                    : isMine
                    ? currentUser?.u_photo || '/img/img-camera.png'
                    : masterUser?.u_photo || '/img/img-camera.png';

                  return (
                    <div
                      key={m.id}
                      className={`${styles.message_block} ${bubbleSide}`}
                      style={{ marginBottom: 6 }}
                    >
                      <div className="my_chat">
                        <div
                          className="correspondence-active font_inter df"
                          style={{ gap: 10 }}
                        >
                          {!isMine && (
                            <div className="ciril-img">
                              <img
                                src={avatarSrc}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                }}
                                alt="user"
                              />
                            </div>
                          )}
                          <div className="let" style={{ maxWidth: 560 }}>
                            <div
                              className="letter_kiril df"
                              style={{
                                gap: 8,
                                justifyContent: isMine
                                  ? 'flex-end'
                                  : 'flex-start',
                              }}
                            >
                              <div className="letter_text-1">
                                <h2 style={{ fontSize: 14, opacity: 0.8 }}>
                                  {authorName}
                                </h2>
                              </div>
                              <div className="letter_text-2">
                                <h3 style={{ fontSize: 12, opacity: 0.6 }}>
                                  {new Date(m.ts).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </h3>
                              </div>
                            </div>
                            <div
                              className={styles.block_bid}
                              style={{ padding: '10px 12px' }}
                            >
                              <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                              {renderFiles(m.files)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const timeStr = new Date(item.ts).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const sys = (txt: string, icon: string) => (
                  <div
                    className={`${styles.message_block} ${styles.text_center}`}
                  >
                    <div className={styles.cancel_block}>
                      <img src={icon} alt="" />
                      <p>{txt}</p>
                      <span>{timeStr}</span>
                    </div>
                  </div>
                );

                switch (item.kind) {
                  case 'order_created':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `${
                            order.b_options.orderType === 'request'
                              ? 'Заявка'
                              : 'Заказ'
                          } создан (№${order.b_id})`,
                          '/img/icons/box.png',
                        )}
                      </div>
                    );
                  case 'cancel_requested':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Клиент предложил отмену ${
                            order.b_options.orderType === 'request'
                              ? 'заявки'
                              : 'заказа'
                          }`,
                          '/img/cansel_message.png',
                        )}
                      </div>
                    );
                  case 'cancel_master_accepted':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Исполнитель принял отмену ${
                            order.b_options.orderType === 'request'
                              ? 'заявки'
                              : 'заказа'
                          }`,
                          '/img/message_green.png',
                        )}
                      </div>
                    );
                  case 'cancel_master_rejected':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Исполнитель отказался от отмены ${
                            order.b_options.orderType === 'request'
                              ? 'заявки'
                              : 'заказа'
                          }`,
                          '/img/message_cancel.png',
                        )}
                      </div>
                    );
                  case 'dispute_opened':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Открылся спор по ${
                            order.b_options.orderType === 'request'
                              ? 'данной заявке'
                              : 'данному заказу'
                          }`,
                          '/img/message_cancel.png',
                        )}
                      </div>
                    );
                  case 'dispute_master_accepted':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Исполнитель согласился по спору (${
                            order.b_options.orderType === 'request'
                              ? 'заявка'
                              : 'заказ'
                          })`,
                          '/img/message_green.png',
                        )}
                      </div>
                    );
                  case 'dispute_master_rejected':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `Исполнитель не согласен по спору (${
                            order.b_options.orderType === 'request'
                              ? 'заявка'
                              : 'заказ'
                          })`,
                          '/img/message_cancel.png',
                        )}
                      </div>
                    );
                  case 'order_completed':
                    return (
                      <div
                        key={`sys-${idx}`}
                        className="chat_technical_message"
                      >
                        {sys(
                          `${
                            order.b_options.orderType === 'request'
                              ? 'Заявка'
                              : 'Заказ'
                          } успешно подтвержден`,
                          '/img/message_green.png',
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      )}
      {/* ====== КОНЕЦ: ЕДИНЫЙ ТАЙМЛАЙН ====== */}
    </>
  );
};

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
  const [dialog, setDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });
  const [zayavka__isVisibleDispute, zayavka__setVisibleDispute] =
    useState(false);
  const [zayavka__isVisibleDisputeFinal, zayavka__setisVisibleDisputeFinal] =
    useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number>(0);
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
  const [previewFiles, setPreviewFiles] = useState<
    { file: File; url: string }[]
  >([]);

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
            setDialog({ isOpen: true, message: 'Не удалось сохранить аудио.' });
          } finally {
            setRecState('idle');
            stream.getTracks().forEach((t) => t.stop());
          }
        };
        mr.start();
        setRecState('recording');
      } catch (e) {
        console.error('mic error', e);
        setDialog({ isOpen: true, message: 'Нет доступа к микрофону.' });
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
      setDialog({ isOpen: true, message: 'Не удалось отправить сообщение.' });
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

  if ((!currentUser || !masterUser) && id) return <>Загрузка...</>;

  return (
    <>
      <SimpleDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ isOpen: false, message: '' })}
        title={dialog.message}
        actions={[
          {
            id: 'close-dialog',
            label: 'Закрыть',
            variant: 'primary',
            onClick: () => setDialog({ isOpen: false, message: '' }),
          },
        ]}
      />
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
                  setBalanceErrorNum={setBalanceErrorNum}
                  setIsBalanceError={setIsBalanceError}
                  setOrderId={setCurrentOrderId}
                  setIsOpenDisput={zayavka__setVisibleDispute}
                  key={order.b_id}
                  order={order}
                  currentUser={currentUser}
                  masterUser={masterUser}
                  refetchRequests={userRequests.refetch}
                  viewerIsMaster={ui.isMaster} // НОВОЕ
                />
              ))}
            </div>

            {/* НИЖНИЙ ФИКСИРОВАННЫЙ ФУТЕР ВВОДА */}
            <div className={styles.message_block} ref={footerRef}>
              <div
                className="block_messages-2 font_inter"
                style={{ paddingTop: 8 }}
              >
                {isBalanceError ? (
                  <div className={styles.balance_error}>
                    <p>
                      Пожалуйста пополните баланс на {BalanceErrorNum} рублей
                    </p>
                  </div>
                ) : null}
                {answer ? (
                  <p className="answer_to_message">
                    Ответить <span>Смогу приехать через час</span>
                    <button onClick={() => Isanswer(false)}>X</button>
                  </p>
                ) : null}
                {edit ? (
                  <p className="answer_to_message">
                    Редактирование{' '}
                    <button onClick={() => Isedit(false)}>X</button>
                  </p>
                ) : null}

                {currentUser?.u_details?.black_list?.find(
                  (item: any) => item.id?.toString() === user.u_id?.toString(),
                ) ? (
                  <div className={styles.chat_block_wrap}>
                    <img src="/img/icons/chat_block.png" alt="" />
                    <p>
                      Возможности для связи с пользователем нет, поскольку он
                      заблокировал диалог с вами{' '}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Превью прикреплённых файлов перед отправкой */}
                    {previewFiles.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(120px,1fr))',
                          gap: 10,
                        }}
                      >
                        {previewFiles.map((p, idx) => {
                          const isImage = p.file.type.startsWith('image/');
                          const isVideo = p.file.type.startsWith('video/');
                          return (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                borderRadius: 8,
                                overflow: 'hidden',
                                background: '#f2f2f2',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => removePreview(p.url)}
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

                    <div
                      className="magnafire-2 df align"
                      style={{ marginTop: 8 }}
                    >
                      <div className="magnafire_input-2" style={{ flex: 1 }}>
                        <input
                          className="inp"
                          type="text"
                          placeholder="Введите сообщение..."
                          value={message}
                          onChange={handleInputChat}
                          onKeyDown={handleInputKeyDown}
                        />
                      </div>
                      <div className="nav_message df">
                        <div style={{ position: 'relative' }}>
                          {chooseFile ? (
                            <div className="frame_icon qwerewrf">
                              <label className="choice df block_file_attach__flex">
                                <div className="choice_img">
                                  <img
                                    src="/img/chat_img/img.png"
                                    alt="img absent"
                                  />
                                </div>
                                <div className="im_attach pull-left align">
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="im_attach_input"
                                    title="Фото/Видео"
                                    style={{ display: 'none' }}
                                    onChange={handlePickFiles}
                                  />
                                  <p className="block_file_attach__text">
                                    Фото или видео
                                  </p>
                                </div>
                              </label>

                              <label className="folder df block_file_attach__flex">
                                <div className="choice_img">
                                  <img
                                    src="/img/chat_img/folder.png"
                                    alt="img absent"
                                  />
                                </div>
                                <div className="im_attach pull-left align">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,application/*,text/*"
                                    className="im_attach_input"
                                    title="Документ"
                                    style={{ display: 'none' }}
                                    onChange={handlePickFiles}
                                  />
                                  <p className="block_file_attach__text">
                                    Документ
                                  </p>
                                </div>
                              </label>
                            </div>
                          ) : null}

                          <label>
                            <img
                              onClick={(event) => {
                                IschooseFile((prev) => !prev);
                                event.preventDefault();
                              }}
                              src="/img/chat_img/clip.png"
                              alt="img absent"
                            />
                          </label>
                        </div>

                        {/* Микрофон */}
                        <button
                          type="button"
                          className={styles.mic_btn}
                          onClick={handleMicClick}
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
                          {isVisibleEmoji ? (
                            <div
                              className={styles.emoji_pos}
                              style={{
                                bottom: Math.max(110, footerHeight + 30),
                              }}
                            >
                              <Suspense fallback={<div className="emoji-loading" />}>
                                <EmojiPickerLazy onEmojiClick={addEmojiToMessage} />
                              </Suspense>
                            </div>
                          ) : null}
                          <label
                            htmlFor="file-input"
                            onClick={() => setIsVisibleEmoji((prev) => !prev)}
                          >
                            <img
                              src="/img/chat_img/emoji.png"
                              alt="img absent"
                            />
                          </label>
                        </div>

                        <div
                          className="plane"
                          onClick={handleSend}
                          role="button"
                          aria-label="Отправить сообщение"
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* /НИЖНИЙ ФИКСИРОВАННЫЙ ФУТЕР ВВОДА */}
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
