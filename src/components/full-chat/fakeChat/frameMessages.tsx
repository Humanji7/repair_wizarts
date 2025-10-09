import { useEffect, useMemo } from 'react';
import '../../../scss/chat.css';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { useService } from '../../../hooks/useService';
import { getMasterOrders } from '../../../services/order.service';
import { getAllClientRequests } from '../../../services/request.service';
import { selectUI } from '../../../slices/ui.slice';
import { selectUser } from '../../../slices/user.slice';

function App() {
  const ui = useSelector(selectUI);
  const user =
    (Object.values(useSelector(selectUser)?.data?.user || {})[0] as any) ||
    ({} as any);
  const userRequests = useService(
    ui.isMaster ? getMasterOrders : getAllClientRequests,
    [],
  );

  // утилита: получить последнее сообщение по всем заказам чата
  function getLastMessageFromOrders(orders: any[]): {
    text: string;
    ts?: string;
  } {
    let latest: { text: string; ts?: string } = {
      text: 'Нет сообщений',
      ts: undefined,
    };
    let latestTs = -Infinity;

    for (const order of orders || []) {
      const hist = Array.isArray(order?.b_options?.chat_history)
        ? order.b_options.chat_history
        : [];

      for (const m of hist) {
        const t = m?.ts ? new Date(m.ts).getTime() : NaN;
        if (!Number.isNaN(t) && t > latestTs) {
          latestTs = t;
          latest = { text: String(m?.text ?? ''), ts: m.ts };
        }
      }
    }
    // небольшое визуальное сокращение длинных сообщений
    const MAX_LEN = 120;
    if (latest.text.length > MAX_LEN) {
      latest.text = latest.text.slice(0, MAX_LEN).trimEnd() + '…';
    }
    return latest;
  }

  const groupedChats = useMemo(() => {
    const rawRequests = Array.from(
      new Map(
        userRequests?.data
          ?.map((item) => Object.values(item?.data?.booking || {}))
          .flat()
          .filter((request) => request?.b_id)
          .map((request) => [request.b_id, request]),
      ).values(),
    );
    const filteredRequests = rawRequests.filter(
      (item: any) =>
        item.b_options?.winnerMaster && item.drivers && item.drivers.length > 0,
    );
    const chatsByMaster: any = filteredRequests.reduce(
      (acc: any, request: any) => {
        const masterId = request.b_options.winnerMaster;
        if (!acc[masterId]) {
          acc[masterId] = [];
        }
        acc[masterId].push(request);
        return acc;
      },
      {},
    );
    return Object.values(chatsByMaster).map((orders: any) => {
      const firstOrder = orders[0];
      const winnerDriver = firstOrder.drivers.find(
        (d) => d.u_id === firstOrder.b_options.winnerMaster,
      );
      return {
        isOwner: firstOrder.u_id === user.u_id,
        chatId: `${firstOrder.u_id}_${firstOrder.b_options.winnerMaster}`,
        clientInfo: firstOrder.b_options.author || {},
        masterInfo: winnerDriver.c_options.author || {},
        orders: orders,
      };
    });
  }, [userRequests.data, user.u_id]);

  useEffect(() => {
    document.title = 'Чат';
  }, []);

  return (
    <div className="frame_messages frame_messages__fullchat">
      <div className="block_messages font_inter">
        <div className="messages_text">
          <h2>Сообщения</h2>
        </div>
        <div className="magnafire df align">
          <div className="magnafire_img">
            <img src="/img/chat_img/lupa.png" alt="no img" />
          </div>
          <div className="magnafire_input">
            <input type="text" placeholder="Поиск..." />
          </div>
        </div>
      </div>

      <div className="big_messages__wrap">
        {groupedChats.length === 0
          ? 'Пусто'
          : groupedChats.map(
              ({ chatId, masterInfo, isOwner, clientInfo, orders }) => {
                const lastMsg = getLastMessageFromOrders(orders);
                return (
                  <div className="big_messages" key={chatId}>
                    <Link
                      to={
                        window.location.href.includes('master')
                          ? `/master/chat/${chatId}`
                          : `/client/chat/${chatId}`
                      }
                    >
                      <div className="ilya df font_inter align">
                        <div className="ilya_img">
                          <img
                            src={masterInfo.u_photo || '/img/img-camera.png'}
                            style={{ height: 65, width: 66, borderRadius: 30 }}
                            alt="chat icon"
                          />
                        </div>

                        <div className="ilya_text">
                          <h2>
                            {isOwner
                              ? masterInfo.u_name || 'Мастер'
                              : clientInfo.name || 'Мастер'}
                          </h2>

                          <h3
                            className="txt-text-small-ver"
                            style={{ color: '#555' }}
                            title={lastMsg.text}
                          >
                            {lastMsg.text}
                          </h3>
                        </div>

                        <div className="ilya_text-2">
                          <h2>
                            {lastMsg.ts
                              ? new Date(lastMsg.ts).toLocaleTimeString(
                                  'ru-RU',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )
                              : new Date(
                                  masterInfo.u_details?.lastTimeBeenOnline ||
                                    new Date().toISOString(),
                                ).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                          </h2>
                          {/* Убрали индикатор нового сообщения */}
                        </div>
                      </div>
                      <div className="line_ilya"></div>
                    </Link>
                  </div>
                );
              },
            )}
      </div>
    </div>
  );
}

export default App;
