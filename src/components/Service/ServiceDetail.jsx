import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import '../../scss/detail.scss';
import '../../scss/media.css';
//~ import { getMasterRepairs } from '../../services/service.service';
import style from './serviceDetail.module.scss';
import ServiceDetailContext from './ServiceDetailContext';
import PaymentBlock from './components/PaymentBlock';
import ConfirmBlock from './components/ConfirmBlock';
import OrderModal from './components/OrderModal';
import MasterInfoPanels from './components/MasterInfoPanels';
import GalleryModal from './components/GalleryModal';
import PriceCarousel from './components/PriceCarousel';
import { createRequest } from '../../services/request.service';
import { selectServices } from '../../slices/services.slice';
import { selectUI } from '../../slices/ui.slice';
import { selectUser } from '../../slices/user.slice';
import appFetch from '../../utilities/appFetch';
import YMap from '../Map';

const EMPTY_ARRAY = []

function ServiceDetail() {
  const test_price = [
    {
      price: 500,
      model: 'iphone 15 pro max',
      delivery: 'от 30 мин',
      name: 'Замена стекла',
      img: 'https://cdn-icons-png.flaticon.com/512/10473/10473245.png',
    },
    {
      price: 300,
      model: 'iphone 14',
      delivery: 'от 30 мин',
      name: 'Замена аккумулятора',
      img: 'https://cdn-icons-png.flaticon.com/512/310/310273.png',
    },
    {
      price: 450,
      model: 'samsung s23',
      delivery: 'от 1 часа',
      name: 'Ремонт дисплея',
      img: 'https://cdn-icons-png.flaticon.com/512/3050/3050525.png',
    },
    {
      price: 350,
      model: 'xiaomi 13',
      delivery: 'от 2 часов',
      name: 'Чистка устройства',
      img: 'https://cdn-icons-png.flaticon.com/512/10342/10342978.png',
    },
    {
      price: 700,
      model: 'google pixel 7',
      delivery: 'от 1 часа',
      name: 'Замена задней крышки',
      img: 'https://cdn-icons-png.flaticon.com/512/10473/10473240.png',
    },
    {
      price: 550,
      model: 'oneplus 10',
      delivery: 'от 3 часов',
      name: 'Ремонт камеры',
      img: 'https://cdn-icons-png.flaticon.com/512/2830/2830340.png',
    },
    {
      price: 400,
      model: 'sony xperia 1 iv',
      delivery: 'от 2 часов',
      name: 'Обновление программного обеспечения',
      img: 'https://cdn-icons-png.flaticon.com/512/3281/3281309.png',
    },
    {
      price: 600,
      model: 'samsung s22 ultra',
      delivery: 'от 1 часа',
      name: 'Замена зарядного порта',
      img: 'https://cdn-icons-png.flaticon.com/512/310/310272.png',
    },
  ];
  const [selectedService, setSelectedService] = useState([]);

  const [visibleListSelectedServices, setVisibleListSelectedServices] =
    useState(false);
  const [visibleConfirm, setVisibleConfirm] = useState(false);
  const [ignoreSelectedServices, setIgnoreSelectedServices] = useState([]);
  const { id } = useParams();
  const { categories } = useSelector((state) => state.categories);
  const user =
    Object.values(useSelector(selectUser)?.data?.user || {})[0] || {};
  const ui = useSelector(selectUI);
  const services = useSelector(selectServices);
  //~ const repairMasters = getMasterRepairs();
  const { sectionId, subsectionId } = useParams();
  const normalizedSectionId = sectionId ? String(sectionId) : '';
  const normalizedSubsectionId = subsectionId ? String(subsectionId) : '';
  const device =
    useMemo(
      () => services?.find((v) => v.id === +id) || {},
      [services, id],
    ) || EMPTY_ARRAY;

  const [show, setShow] = useState(false);

  const [formError, setFormError] = useState('');
  const [visibleBlockPayment, setVisibleBlockPayment] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [errorBalance] = useState(true);
  const [errorCash] = useState(true);
  const [errorSumm] = useState(true);

  const [selected, setSelected] = useState([]);
  const selectedValue = useMemo(() => ({ selected, setSelected }), [selected]);

  const [selectedMaster, setSelectedMaster] = useState({});
  const [showSmallModal, setShowSmallModal] = useState(false);
  const [showBigModal, setShowBigModal] = useState(false);

  const [mastersList, setMastersList] = useState([]);
  const [masterCarData, setMasterCarData] = useState(null);

  // todo: вынести загрузку пользователя в глобальное состояние
  useEffect(() => {
    appFetch('user', { body: { lc: 99999999999 } }, true)
      .then((response) => {
        if (response && response.data && response.data.user) {
          const allUsers = Object.values(response.data.user);

          const filteredMasters = allUsers
            .filter((user) => user.u_details && user.u_details.business_model)
            .map((user) => {
              const details = user.u_details || {};
              return {
                id: user.u_id,
                username: user.u_name,
                name: `${user.u_name || ''} ${user.u_family || ''}`.trim(),
                latitude: 59.9343 + (Math.random() - 0.5) * 0.1,
                longitude: 30.3351 + (Math.random() - 0.5) * 0.2,
                info: details.business_model || 'Частный мастер',
                rating: details.rating || 5,
                reviews: details.reviews || 0,
                address: details.address || 'Адрес не указан',
                orgName: details.organization_name || 'Частная практика',
                experience: `${details.experience || 1} год/лет`,
                onSiteSince: user.u_created
                  ? new Date(user.u_created * 1000).getFullYear()
                  : '2023',
                status: user.u_active ? 'онлайн' : 'офлайн',
                ordersCompleted: details.ordersCompleted || 0,
                successRate: `${details.successRate || 100}%`,
                repeatOrders: `${details.repeatOrders || 0}%`,
                categoryView:
                  details.section?.map((item) => item.label).join(', ') ||
                  'Электроника',
                categories:
                  details.subsection?.map((item) => item.label).join(', ') ||
                  'Ремонт телефонов',
                brands:
                  details.services?.map((item) => item.label).join(', ') ||
                  'Все бренды',
                activity: details.specialty || 'Ремонт техники',
                mainFocus: details.main_business || 'Общий ремонт',
                businessType: details.business_model || 'Сервис',
                aboutOrg:
                  details.about_organization ||
                  'Информация об организации отсутствует.',
              };
            });

          setMastersList(filteredMasters);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке пользователей:', error);
      });
  }, []);

  useEffect(() => {
    setPhone(user.u_phone);
    setName(user.u_name);
  }, [user.u_phone, user.u_name]);

  const onSelectMaster = async (masterData) => {
    setSelectedMaster(masterData);
    setShowSmallModal(true);
    setShowBigModal(true);
    setMasterCarData(null);

    try {
      console.log(`Загрузка данных о машине для мастера ID: ${masterData.id}`);
      const carResponse = await appFetch(
        'user/authorized/car',
        {
          method: 'POST',
          body: { u_a_id: masterData.id },
        },
        true,
      );
      console.log(carResponse);

      if (carResponse && carResponse.data && carResponse.data.car) {
        const cars = Object.values(carResponse.data.car);
        if (cars.length > 0) {
          setMasterCarData(cars[0]);
          console.log('Данные о машине успешно загружены:', cars[0]);
        } else {
          console.warn(
            `У мастера ID: ${masterData.id} нет зарегистрированных машин.`,
          );
        }
      }
    } catch (error) {
      console.error(
        `Ошибка при загрузке данных о машине для мастера ID: ${masterData.id}`,
        error,
      );
      setFormError('Не удалось загрузить данные о машине мастера.');
    }
  };

  const handleCloseModals = () => {
    setShowSmallModal(false);
    setShowBigModal(false);
    setSelectedMaster({});
    setMasterCarData(null);
  };

  //~ const [invoice, setInvoice] = useState({
    //~ final: 0,
    //~ list: [],
  //~ });
  const [description, setDescription] = useState('');

  const masters = useMemo(() => mastersList, [mastersList]);

  //~ // непонятный код, основанный на побочных эффектах. привести в понятный вид
  //~ const repairFiltered = useMemo(
    //~ () => repairMasters,
    //~ [selectedMaster.username],
  //~ );

  //~ useEffect(() => {
    //~ const invoiceDefault = {
      //~ final: 0,
      //~ list: [],
    //~ };
    //~ const invoice = selected.reduce((state, value) => {
      //~ const { name, price } = repairFiltered.find((v) => v.id === value);
      //~ return {
        //~ final: state.final + price,
        //~ list: [
          //~ ...state.list,
          //~ {
            //~ name,
            //~ price,
          //~ },
        //~ ],
      //~ };
    //~ }, invoiceDefault);
    //~ setInvoice(invoice);
  //~ }, [selected]);

  const [search, setSearch] = useState('');

  /**
   * Асинхронная функция для назначения мастера на заказ в качестве КАНДИДАТА.
   * @param {string} orderId - ID только что созданного заказа.
   * @param {object} master - Объект выбранного мастера.
   */
  const assignMasterToOrder = async (orderId, master) => {
    if (!orderId || !master.id) {
      console.error(
        'ID заказа или ID мастера отсутствуют. Назначение невозможно.',
      );
      throw new Error('ID заказа или мастера не определены.');
    }
    if (!masterCarData) {
      console.error(
        'Данные о машине мастера не загружены. Назначение невозможно.',
      );
    }
    const assignmentPayload = {
      c_id: masterCarData?.c_id || '1',
      c_payment_way: 2,
      c_options: {
        author: {
          ...master,
        },
        bind_amount: getSumPrice(),
        comment: 'Выполню',
        time: 30,
      },
    };
    const requestBody = {
      action: 'set_performer',
      performer: 0,
      u_a_role: 2,
      u_a_id: master.id,
      data: JSON.stringify(assignmentPayload),
    };

    try {
      const url = `drive/get/${orderId}`;
      console.log(
        `Попытка назначения мастера ${master.id} КАНДИДАТОМ на заказ ${orderId}. URL: ${url}`,
      );
      console.log('Тело запроса:', requestBody);

      // Отправляем запрос с новым телом
      await appFetch(
        url,
        {
          body: requestBody,
        },
        true,
      ).then((v) => console.log('trueble', v));

      console.log(
        `Мастер ${master.name} (ID: ${master.id}) успешно добавлен в поездку (ID: ${orderId}) как кандидат.`,
      );
    } catch (error) {
      console.error(
        `Ошибка при назначении мастера на заказ ${orderId}:`,
        error,
      );
      throw error;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (selectedService.length === 0) {
      setFormError('Выберите услуги');
      return;
    }
    if (!selectedMaster.id) {
      setFormError('Сначала выберите мастера на карте');
      return;
    }

    const orderData = {
      title: selectedService.map((item) => prices[item].name).join(' '),
      description,
      client_price: getSumPrice(),
      section: sectionId,
      subsection: subsectionId,
      service: selectServices[0],
      orderType: 'request',
      winnerMaster: selectedMaster.id,
      type: 'order',
    };

    try {
      console.log('Создание заказа...');
      const creationResponse = await createRequest({ data: orderData });
      const newOrderId = creationResponse?.data?.b_id;

      if (!newOrderId) {
        throw new Error('Не удалось получить ID созданного заказа.');
      }
      console.log(`Заказ успешно создан. ID: ${newOrderId}`);

      await assignMasterToOrder(newOrderId, selectedMaster);

      setShow(false);
      setVisibleBlockPayment(true);
    } catch (err) {
      console.error(
        'Произошла ошибка в процессе создания/назначения заказа:',
        err,
      );
      setFormError(err.message || 'Произошла неизвестная ошибка.');
    }
  };

  useEffect(() => {
    document.title = device.name;
  }, [device.name]);

  function getSumPrice() {
    var sum = 0;
    selectedService.forEach((index) => {
      if (!ignoreSelectedServices.includes(index)) {
        sum += test_price[index]['price'];
      }
    });
    return sum;
  }

  function addRemoveIgnoreService(index) {
    var list = [...ignoreSelectedServices];
    if (list.includes(index)) {
      list = list.filter((number) => number !== index);
    } else {
      list.push(index);
    }
    setIgnoreSelectedServices(list);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  //~ const [modalImage, setModalImage] = useState('');

  const openModal = (imageSrc) => {
    //~ setModalImage(imageSrc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  function addRemoveService(index) {
    var list = [...selectedService];
    if (list.includes(index)) {
      list = list.filter((number) => number !== index);
    } else {
      list.push(index);
    }
    setSelectedService(list);
  }
  // todo: проверить, совпадают ли типы categ.id, sectionId, subsec.id, subsectionId и можно ли использовать строгое сравнение
  const prices = categories.flatMap((categ) => {
    return String(categ.id) === normalizedSectionId
      ? categ.subsections.flatMap((subsec) => {
          return String(subsec.id) === normalizedSubsectionId
            ? subsec.services.map((service) => ({
                price: 100,
                model: subsec.name,
                delivery: `от 30 мин`,
                name: service.name,
                img: 'https://cdn-icons-png.flaticon.com/512/10473/10473245.png',
              }))
            : [];
        })
      : [];
  });

  const totalPrice = getSumPrice();

  const handlePaymentClose = () => setVisibleBlockPayment(false);

  const handlePaymentConfirm = () => {
    setVisibleBlockPayment(false);
    setVisibleConfirm(true);
  };

  const handleOrderModalClose = () => {
    setFormError('');
    setShow(false);
  };

  const toggleSelectedServicesVisibility = () => {
    setVisibleListSelectedServices((prev) => !prev);
  };
  return (
    <ServiceDetailContext.Provider value={selectedValue}>
      <PaymentBlock
        isOpen={visibleBlockPayment}
        onClose={handlePaymentClose}
        onConfirm={handlePaymentConfirm}
        selectedIdx={selectedIdx}
        onSelectMethod={setSelectedIdx}
        errorBalance={errorBalance}
        errorCash={errorCash}
        errorSumm={errorSumm}
      />
      <ConfirmBlock
        isOpen={visibleConfirm}
        onClose={() => setVisibleConfirm(false)}
      />

      <div>
        <section
          className={`main__info container detail-container ${style.container_service}`}
        >
          <div className="main__info__content">
            <h1>
              Стоимость услуг по ремонту <strong>{device.name}</strong>
            </h1>
            <div className="df align-center">
              <img src="/img/search.png" className="paugfheotw" alt="" />
              <input
                type="text"
                placeholder="Поиск..."
                className="searchaproblemEnter"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={`main__info__image ${style.iphone_mobile}`}>
              <img
                className={style.iphone_mobile__img}
                src="/img/detail-iphone.png"
                alt=""
              />
              <p>
                Запчасти для ремонта уже включены в стоимость работы. Это
                окончательная цена
              </p>
            </div>

            {prices.length === 0 && (
              <div className="order__no-cards">
                <img src="/img/many_people.png" alt="" />
                <p>
                  Пожалуйста, выберите на карте ниже организацию которая ближе к
                  вашему дому и оформите заказ выбрав те услуги которые вам
                  необходимы!
                </p>
              </div>
            )}

            <div className={`order__cards__to__scrolls ${style.orders_list}`}>
              {prices.length > 0 &&
                prices.map((obj, index) => (
                  <div
                    key={index}
                    className={`first__s__card ${style.order_row}`}
                  >
                    <div className="main__info__content__card">
                      <div className="main__card__first">
                        <h4>Услуга</h4>
                        <p>
                          {obj.name} {obj.model}
                        </p>
                      </div>
                      <div style={{ flex: 1 }}></div>
                      <div
                        className="main__card__price"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <p>{obj.price} ₽</p>
                      </div>
                      <div className="main__card__second">
                        <p>{obj.delivery}</p>
                        <button
                          className="pickfaf"
                          onClick={() => addRemoveService(index)}
                        >
                          {selectedService.includes(index) ? 'Убрать' : 'Выбрать'}
                        </button>
                      </div>
                      <div
                        className={`main__card__third ${
                          selectedService.includes(index)
                            ? 'main__card__third--active'
                            : null
                        }`}
                      ></div>
                    </div>
                    <div className="main__card__third activeijpqwothweoruh"></div>
                  </div>
                ))}
            </div>

            {selectedMaster.id && (
              <div className={style.button_wrap}>
                <button
                  className={style.button_services}
                  onClick={() => {
                    setShow(true);
                  }}
                >
                  Оформить заказ
                </button>
              </div>
            )}

            <div
              className="popupdetailfwpruhwe"
              style={show ? null : { display: 'none' }}
            >
              <OrderModal
                isOpen={show}
                onClose={handleOrderModalClose}
                onSubmit={onSubmit}
                formError={formError}
                isAuthorized={ui.isAuthorized}
                name={name}
                phone={phone}
                onNameChange={setName}
                onPhoneChange={setPhone}
                description={description}
                onDescriptionChange={setDescription}
                selectedService={selectedService}
                prices={prices}
                totalPrice={totalPrice}
                visibleListSelectedServices={visibleListSelectedServices}
                onToggleSelectedServices={toggleSelectedServicesVisibility}
                ignoreSelectedServices={ignoreSelectedServices}
                onToggleIgnoreService={addRemoveIgnoreService}
                defaultName={user.u_name}
                defaultPhone={user.u_phone}
              />
            </div>
          </div>

          <div className={`main__info__image ${style.iphone_desktop}`}>
            <img
              src="/img/detail-iphone.png"
              alt=""
              style={{
                width: '540px',
                height: '570px',
                objectFit: 'contain',
              }}
            />
            <p>
              Запчасти для ремонта уже включены в стоимость работы. Это
              окончательная цена
            </p>
          </div>
        </section>

        <PriceCarousel prices={prices} selectedService={selectedService} />

        <section className="map">
          <YMap
            masters={masters}
            selectedMaster={selectedMaster}
            selectMaster={onSelectMaster}
          />
        </section>
      </div>

      <MasterInfoPanels
        isVisible={Boolean(selectedMaster.id)}
        showSmallModal={showSmallModal}
        showBigModal={showBigModal}
        selectedMaster={selectedMaster}
        onClose={handleCloseModals}
        galleryItems={test_price}
        onOpenGallery={openModal}
      />

      <GalleryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        images={test_price}
      />
    </ServiceDetailContext.Provider>
  );
}

export default ServiceDetail;
