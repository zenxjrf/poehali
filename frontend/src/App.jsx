import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = import.meta.env.VITE_DISPATCHER_USERNAME || 'admin'

// Языковые пакеты
import ru from './locales/ru.json'
import uz from './locales/uz.json'

const translations = { ru, uz }

// Fallback для отсутствующих ключей
const defaultTranslations = {
  app_title: 'Poehali',
  app_subtitle: 'Поездки с комфортом',
  directions: {
    tashkent_fergana: 'Ташкент → Фергана',
    fergana_tashkent: 'Фергана → Ташкент'
  },
  buttons: {
    view_drivers: '👨‍✈️ Посмотреть водителей',
    leave_request: '📞 Оставить заявку',
    back: '← Назад',
    call: '📞 Позвонить',
    message: '💬 Написать',
    send_request: '📞 Отправить заявку',
    sending: 'Отправка...',
    return_to_menu: 'Вернуться в меню'
  },
  drivers: {
    title: 'Наши водители',
    experience: 'Стаж',
    years: 'лет',
    car: 'Автомобиль',
    year: 'г.в.',
    amenities: {
      air_conditioning: '❄️ Кондиционер',
      large_trunk: '🧳 Большой багажник',
      pets_allowed: '🐾 Можно с животными'
    }
  },
  order: {
    title: 'Заявка на поездку',
    direction: 'Направление',
    price: 'Цена',
    name: 'Ваше имя',
    name_placeholder: 'Введите имя',
    phone: 'Номер телефона',
    phone_placeholder: '+998 90 123 45 67',
    call_time: 'Удобное время для звонка',
    call_time_placeholder: 'Например: с 9:00 до 18:00',
    passengers: 'Количество пассажиров',
    comment: 'Комментарий (необязательно)',
    comment_placeholder: 'Пожелания к поездке'
  },
  success: {
    title: 'Заявка отправлена!',
    message: 'Мы перезвоним вам в течение 5 минут.',
    icon: '✅'
  }
}

// Безопасное получение перевода
function safeGet(obj, path, defaultVal = '') {
  try {
    return path.split('.').reduce((curr, key) => curr?.[key], obj) || defaultVal
  } catch {
    return defaultVal
  }
}

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [direction, setDirection] = useState('tashkent_fergana')
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [trip, setTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('poehali_language') || 'ru'
    } catch {
      return 'ru'
    }
  })

  // Объединяем с fallback
  const langData = translations[language] || {}
  const t = new Proxy(defaultTranslations, {
    get(target, prop) {
      return langData[prop] !== undefined ? langData[prop] : target[prop]
    }
  })
  
  // Безопасная инициализация Telegram WebApp
  const tg = typeof window !== 'undefined' && window.Telegram ? window.Telegram.WebApp : null

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    preferred_call_time: '',
    passengers_count: 1,
    comment: ''
  })

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (tg) {
      try {
        tg.ready()
        tg.expand()

        // Автоподстановка данных из Telegram
        const user = tg.initDataUnsafe?.user
        if (user) {
          setFormData(prev => ({
            ...prev,
            customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.first_name || '',
            customer_phone: user.phone || ''
          }))
        }
      } catch (error) {
        console.warn('Telegram WebApp не доступен:', error)
      }
    }

    // Имитация загрузки для preloader
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      fetchDrivers()
      fetchTrip()
    }
  }, [direction, isLoading])

  const fetchDrivers = async () => {
    try {
      setApiError(null)
      const response = await fetch(`${API_URL}/drivers`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDrivers(data)
    } catch (error) {
      console.error('Ошибка загрузки водителей:', error)
      setApiError('Не удалось загрузить список водителей. Проверьте подключение к интернету.')
    }
  }

  const fetchTrip = async () => {
    try {
      const response = await fetch(`${API_URL}/trips/${direction}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTrip(data)
    } catch (error) {
      console.error('Ошибка загрузки поездки:', error)
      // Устанавливаем цену по умолчанию
      setTrip({ id: 1, direction, price: 250000 })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus('loading')

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          trip_id: trip?.id || 1
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        if (tg) {
          try {
            tg.sendData(JSON.stringify({
              type: 'order',
              ...formData,
              direction,
              price: trip?.price
            }))
          } catch (error) {
            console.warn('Не удалось отправить данные в Telegram:', error)
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Ошибка сервера:', errorData)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Ошибка отправки заявки:', error)
      setSubmitStatus('error')
    }
  }

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`
  }

  const handleMessage = () => {
    window.open(`https://t.me/${DISPATCHER_USERNAME}`, '_blank', 'noopener,noreferrer')
  }

  const toggleLanguage = () => {
    const newLang = language === 'ru' ? 'uz' : 'ru'
    setLanguage(newLang)
    try {
      localStorage.setItem('poehali_language', newLang)
    } catch (error) {
      console.warn('Не удалось сохранить язык в localStorage:', error)
    }
  }

  const directionLabels = {
    tashkent_fergana: safeGet(t, 'directions.tashkent_fergana', 'Ташкент → Фергана'),
    fergana_tashkent: safeGet(t, 'directions.fergana_tashkent', 'Фергана → Ташкент')
  }

  // Preloader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">{safeGet(t, 'app_title', 'Poehali')}</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 text-white p-4">
        {/* Переключатель языка */}
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-semibold transition-all z-50"
        >
          {language === 'ru' ? 'UZ' : 'RU'}
        </button>

        <div className="max-w-md mx-auto pt-8">
          <h1 className="text-3xl font-bold text-center mb-2">{safeGet(t, 'app_title', 'Poehali')}</h1>
          <p className="text-center opacity-90 mb-8">{safeGet(t, 'app_subtitle', 'Поездки с комфортом')}</p>

          {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {apiError}
            </div>
          )}

          <div className="bg-white text-gray-800 rounded-2xl p-6 mb-4 shadow-lg">
            <p className="text-sm text-gray-500 mb-1">{safeGet(t, 'trip_cost', 'Стоимость поездки')}</p>
            <p className="text-2xl font-bold">
              {trip ? `${trip.price.toLocaleString()} сум` : 'Загрузка...'}
            </p>
            <p className="text-gray-600 mt-2">{directionLabels[direction]}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setDirection('tashkent_fergana')}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                direction === 'tashkent_fergana'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              📍 {directionLabels.tashkent_fergana}
            </button>

            <button
              onClick={() => setDirection('fergana_tashkent')}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                direction === 'fergana_tashkent'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              📍 {directionLabels.fergana_tashkent}
            </button>
          </div>

          <button
            onClick={() => setCurrentView('drivers')}
            className="w-full mt-4 bg-yellow-400 text-gray-800 py-4 rounded-xl font-semibold hover:bg-yellow-300 transition-all"
          >
            {safeGet(t, 'buttons.view_drivers', '👨‍✈️ Посмотреть водителей')}
          </button>

          <button
            onClick={() => setCurrentView('order')}
            className="w-full mt-3 bg-green-400 text-gray-800 py-4 rounded-xl font-semibold hover:bg-green-300 transition-all"
          >
            {safeGet(t, 'buttons.leave_request', '📞 Оставить заявку')}
          </button>

          {/* Кнопки связи */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleCall('+998901234567')}
              className="flex-1 bg-blue-400 text-white py-3 rounded-xl font-semibold hover:bg-blue-300 transition-all"
            >
              {safeGet(t, 'buttons.call', '📞 Позвонить')}
            </button>
            <button
              onClick={handleMessage}
              className="flex-1 bg-purple-400 text-white py-3 rounded-xl font-semibold hover:bg-purple-300 transition-all"
            >
              {safeGet(t, 'buttons.message', '💬 Написать')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Экран водителей
  if (currentView === 'drivers') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Переключатель языка */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('home')}
              className="text-blue-600"
            >
              {safeGet(t, 'buttons.back', '← Назад')}
            </button>
            <h1 className="text-xl font-bold">{safeGet(t, 'drivers.title', 'Наши водители')}</h1>
            <button
              onClick={toggleLanguage}
              className="bg-white px-3 py-1 rounded-lg text-sm font-semibold"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {apiError}
            </div>
          )}

          {drivers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <p className="text-4xl mb-4">🚗</p>
              <p>Водители загружаются...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drivers.map(driver => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className="bg-white rounded-xl p-4 shadow-md cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                      {driver.photo_url ? (
                        <img 
                          src={driver.photo_url} 
                          alt={driver.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = ''
                            e.target.style.display = 'none'
                            e.target.parentNode.innerHTML = '👨‍✈️'
                          }}
                        />
                      ) : (
                        '👨‍✈️'
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{driver.name}</h3>
                      <p className="text-gray-600">{driver.car_brand} {driver.car_model}</p>
                      <p className="text-sm text-gray-500">{driver.car_year} {safeGet(t, 'drivers.year', 'г.в.')}</p>
                      <p className="text-sm text-gray-500">{safeGet(t, 'drivers.experience', 'Стаж')}: {driver.experience_years} {safeGet(t, 'drivers.years', 'лет')}</p>

                      {/* Иконки удобств */}
                      <div className="flex gap-2 mt-2">
                        {driver.has_air_conditioning && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">❄️</span>
                        )}
                        {driver.has_large_trunk && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">🧳</span>
                        )}
                        {driver.pets_allowed && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">🐾</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {driver.description && (
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">{driver.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Экран детального просмотра водителя
  if (selectedDriver) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setSelectedDriver(null)}
            className="mb-4 text-blue-600"
          >
            {safeGet(t, 'buttons.back', '← Назад')}
          </button>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-5xl mb-4 overflow-hidden">
              {selectedDriver.photo_url ? (
                <img 
                  src={selectedDriver.photo_url} 
                  alt={selectedDriver.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = ''
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = '👨‍✈️'
                  }}
                />
              ) : (
                '👨‍✈️'
              )}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">{selectedDriver.name}</h2>
            <p className="text-center text-gray-600 mb-4">
              {selectedDriver.car_brand} {selectedDriver.car_model} ({selectedDriver.car_year})
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{safeGet(t, 'drivers.experience', 'Стаж')}:</span>
                <span className="font-semibold">{selectedDriver.experience_years} {safeGet(t, 'drivers.years', 'лет')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{safeGet(t, 'drivers.car', 'Автомобиль')}:</span>
                <span className="font-semibold">{selectedDriver.car_brand} {selectedDriver.car_model}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{safeGet(t, 'drivers.year', 'г.в.')}:</span>
                <span className="font-semibold">{selectedDriver.car_year}</span>
              </div>
            </div>

            {/* Удобства */}
            <div className="mb-4 space-y-2">
              {selectedDriver.has_air_conditioning && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>❄️</span>
                  <span>{safeGet(t, 'drivers.amenities.air_conditioning', '❄️ Кондиционер')}</span>
                </div>
              )}
              {selectedDriver.has_large_trunk && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>🧳</span>
                  <span>{safeGet(t, 'drivers.amenities.large_trunk', '🧳 Большой багажник')}</span>
                </div>
              )}
              {selectedDriver.pets_allowed && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>🐾</span>
                  <span>{safeGet(t, 'drivers.amenities.pets_allowed', '🐾 Можно с животными')}</span>
                </div>
              )}
            </div>

            {selectedDriver.description && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">{selectedDriver.description}</p>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedDriver(null)
                setCurrentView('order')
              }}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-400 transition-all mb-3"
            >
              📞 {safeGet(t, 'buttons.leave_request', 'Оставить заявку')}
            </button>

            {/* Кнопки связи с водителем (заглушка) */}
            <div className="flex gap-3">
              <button
                onClick={() => handleCall('+998901234567')}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-400 transition-all"
              >
                {safeGet(t, 'buttons.call', '📞 Позвонить')}
              </button>
              <button
                onClick={handleMessage}
                className="flex-1 bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-400 transition-all"
              >
                {safeGet(t, 'buttons.message', '💬 Написать')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Экран формы заявки
  if (currentView === 'order') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Переключатель языка */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('home')}
              className="text-blue-600"
            >
              {safeGet(t, 'buttons.back', '← Назад')}
            </button>
            <h1 className="text-xl font-bold">{safeGet(t, 'order.title', 'Заявка на поездку')}</h1>
            <button
              onClick={toggleLanguage}
              className="bg-white px-3 py-1 rounded-lg text-sm font-semibold"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded-xl text-center">
              <p className="text-4xl mb-4">{safeGet(t, 'success.icon', '✅')}</p>
              <h2 className="text-xl font-bold mb-2">{safeGet(t, 'success.title', 'Заявка отправлена!')}</h2>
              <p>{safeGet(t, 'success.message', 'Мы перезвоним вам в течение 5 минут.')}</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg"
              >
                {safeGet(t, 'buttons.return_to_menu', 'Вернуться в меню')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.direction', 'Направление')}</label>
                <div className="bg-gray-100 p-3 rounded-lg font-semibold">
                  {directionLabels[direction]}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {safeGet(t, 'order.price', 'Цена')}: {trip ? `${trip.price.toLocaleString()} сум` : '...'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.name', 'Ваше имя')}</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={safeGet(t, 'order.name_placeholder', 'Введите имя')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.phone', 'Номер телефона')}</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={safeGet(t, 'order.phone_placeholder', '+998 90 123 45 67')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.call_time', 'Удобное время для звонка')}</label>
                <input
                  type="text"
                  value={formData.preferred_call_time}
                  onChange={(e) => setFormData({...formData, preferred_call_time: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={safeGet(t, 'order.call_time_placeholder', 'Например: с 9:00 до 18:00')}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.passengers', 'Количество пассажиров')}</label>
                <select
                  value={formData.passengers_count}
                  onChange={(e) => setFormData({...formData, passengers_count: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">{safeGet(t, 'order.comment', 'Комментарий')}</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={safeGet(t, 'order.comment_placeholder', 'Пожелания к поездке')}
                  rows="3"
                />
              </div>

              {submitStatus === 'error' && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Ошибка при отправке заявки. Пожалуйста, попробуйте ещё раз.
                </div>
              )}

              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-400 transition-all disabled:opacity-50"
              >
                {submitStatus === 'loading' ? safeGet(t, 'buttons.sending', 'Отправка...') : safeGet(t, 'buttons.send_request', '📞 Отправить заявку')}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default App
