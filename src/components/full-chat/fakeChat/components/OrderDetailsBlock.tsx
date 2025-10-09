import type { FC } from 'react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import AddFeedbackModal from '../AddFeedbackModal';
import styles from '../Chat.module.css';
import { DropboxFilePreview, DropboxImage } from './DropboxPreviews';
import type {
  TimelineChatItem,
  TimelineItem,
  TimelineSimpleItem,
} from '../chatTypes';
import { selectUser } from '../../../../slices/user.slice';

const LazySwiper = React.lazy(() =>
  import('../../../../shared/ui/SwiperWrapper').then((m) => ({
    default: m.SwiperWithModules,
  })),
);
const LazySwiperSlide = React.lazy(() =>
  import('../../../../shared/ui/SwiperWrapper').then((m) => ({
    default: m.SwiperSlide,
  })),
);

interface OrderDetailsBlockProps {
  order: any;
  currentUser: any;
  masterUser: any;
  setIsBalanceError: Dispatch<SetStateAction<boolean>>;
  setBalanceErrorNum: Dispatch<SetStateAction<number>>;
  viewerIsMaster: boolean;
}

const OrderDetailsBlock: FC<OrderDetailsBlockProps> = ({
  order,
  currentUser,
  masterUser,
  setIsBalanceError,
  setBalanceErrorNum,
  viewerIsMaster,
}) => {
  const user =
    (Object.values(useSelector(selectUser)?.data?.user || {})[0] as any) ||
    ({} as any);

  const chatHistory = useMemo(() => {
    const raw = order?.b_options?.chat_history;
    const arr = Array.isArray(raw) ? (raw as any[]) : [];
    return [...arr].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );
  }, [order?.b_options?.chat_history]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    if (order?.b_created) {
      items.push({
        kind: 'order_created',
        ts: order.b_created,
      } as TimelineSimpleItem);
    }

    if (
      order?.b_options?.is_request_for_cancel_exist &&
      order?.b_options?.cancel_requested_ts
    ) {
      items.push({
        kind: 'cancel_requested',
        ts: order.b_options.cancel_requested_ts,
      } as TimelineSimpleItem);
    }

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

    if (
      order?.b_options?.is_open_dispute &&
      order?.b_options?.dispute_opened_ts
    ) {
      items.push({
        kind: 'dispute_opened',
        ts: order.b_options.dispute_opened_ts,
      } as TimelineSimpleItem);
    }

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

    if (order?.b_state === '4' && order?.b_options?.complete_ts) {
      items.push({
        kind: 'order_completed',
        ts: order.b_options.complete_ts,
      } as TimelineSimpleItem);
    }

    for (const m of chatHistory) {
      if (m?.ts) {
        items.push({
          kind: 'chat',
          ts: m.ts,
          msg: m,
        } as TimelineChatItem);
      }
    }

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

  const [isVisibleAddFeedback, setVisibleAddFeedback] = useState(false);

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

  const driverData = order.drivers?.find(
    (d: any) => d.u_id === order.b_options.winnerMaster,
  );
  const masterReqData = driverData?.c_options || {};

  const photoUrls: string[] =
    (order.b_options?.client_feedback_photo_urls as string[]) ||
    (order.b_options?.photoUrls as string[]) ||
    [];

  return (
    <>
      {isVisibleAddFeedback && (
        <AddFeedbackModal
          id={order.b_id}
          setVisibleAddFeedback={setVisibleAddFeedback}
          setVisibleFinalOrder={() => {}}
        />
      )}

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

                  const authorName = isMine
                    ? 'Вы'
                    : viewerIsMaster
                    ? currentUser?.u_name || 'Клиент'
                    : masterUser?.u_name || 'Исполнитель';

                  const avatarSrc = viewerIsMaster
                    ? isMine
                      ? masterUser?.u_photo || '/img/img-camera.png'
                      : currentUser?.u_photo || '/img/img-camera.png'
                    : isMine
                    ? currentUser?.u_photo || '/img/img-camera.png'
                    : masterUser?.u_photo || '/img/img-camera.png';

                  return (
                    <div key={m.id} className={`my_chat ${bubbleSide}`}>
                      <div
                        className="correspondence-active font_inter df"
                        style={{ gap: '10px' }}
                      >
                        <div
                          className="ciril-img"
                          style={{
                            order: isMine ? 2 : 1,
                            display: 'flex',
                            alignItems: 'flex-end',
                          }}
                        >
                          <img
                            src={avatarSrc}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: 24,
                            }}
                            alt="avatar"
                          />
                        </div>
                        <div className="let" style={{ order: isMine ? 1 : 2 }}>
                          <div
                            className="letter_kiril df"
                            style={{
                              gap: '10px',
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
                          '/img/message_green.png',
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
    </>
  );
};

export default OrderDetailsBlock;
