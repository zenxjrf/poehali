import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = 'fakertop'

// Языковые пакеты
import ru from './locales/ru.json'
import uz from './locales/uz.json'

const translations = { ru, uz }

// Fallback для отсутствующих ключей
const defaultTranslations = {
  app_title: 'Поехали',
  app_subtitle: 'Ташкент ↔ Фергана',
  app_description: 'Премиум сервис такси',
  directions: {
    tashkent_fergana: 'Ташкент → Фергана',
    fergana_tashkent: 'Фергана → Ташкент'
  },
  buttons: {
    leave_request: 'Заказать',
    back: '← Назад',
    call: 'Позвонить',
    message: 'Написать',
    send_request: 'Отправить',
    sending: 'Отправка...',
    return_to_menu: 'В меню',
    get_location: '📍 Геолокация',
    location_added: '✅ Добавлена'
  },
  order: {
    title: 'Заявка',
    direction: 'Направление',
    price: 'Цена',
    name: 'Имя',
    name_placeholder: 'Ваше имя',
    phone: 'Телефон',
    phone_placeholder: '+998 90 123 45 67',
    call_time: 'Время звонка',
    call_time_placeholder: 'Например: 10:00 - 18:00',
    passengers: 'Пассажиры',
    comment: 'Комментарий',
    comment_placeholder: 'Пожелания',
    location: 'Геолокация',
    location_placeholder: 'Добавить местоположение'
  },
  success: {
    title: 'Готово!',
    message: 'Перезвоним в течение 5 минут',
    icon: '✓'
  },
  home: {
    price_label: 'Стоимость',
    per_person: 'с человека',
    mail_label: 'Посылки',
    mail_from: 'от'
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
  const [trip, setTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState(null)
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
    comment: '',
    location: ''
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
    }, 600)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      fetchTrip()
    }
  }, [direction, isLoading])

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
      setTrip({ id: 1, direction, price: 200000 })
    }
  }

  const getLocation = () => {
    if (tg && tg.LocationManager) {
      tg.LocationManager.getData((location) => {
        if (location && location.latitude && location.longitude) {
          const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`
          setFormData(prev => ({ ...prev, location: locationUrl }))
          tg.showAlert('Геолокация добавлена!')
        }
      })
    } else {
      // Fallback через браузер
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`
            setFormData(prev => ({ ...prev, location: locationUrl }))
            if (tg) tg.showAlert('Геолокация добавлена!')
          },
          (error) => {
            console.error('Ошибка получения геолокации:', error)
            if (tg) tg.showAlert('Не удалось получить геолокацию')
          }
        )
      } else {
        if (tg) tg.showAlert('Геолокация не поддерживается')
      }
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
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Ошибка отправки заявки:', error)
      setSubmitStatus('error')
    }
  }

  const handleCall = () => {
    window.location.href = 'tel:+998941365474'
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
      console.warn('Не удалось сохранить язык:', error)
    }
  }

  const directionLabels = {
    tashkent_fergana: safeGet(t, 'directions.tashkent_fergana', 'Ташкент → Фергана'),
    fergana_tashkent: safeGet(t, 'directions.fergana_tashkent', 'Фергана → Ташкент')
  }

  const basePrice = 200000
  const mailPrice = 60000

  // Preloader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-amber-500/30 rounded-sm mx-auto mb-4 relative">
            <div className="absolute inset-0 border-t border-amber-500 rounded-sm animate-spin"></div>
          </div>
          <p className="text-amber-500/60 text-xs tracking-[0.3em] uppercase">Poehali</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-[10px] text-neutral-600 tracking-widest uppercase">Ver 1.5</span>
          <button
            onClick={toggleLanguage}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors tracking-widest uppercase"
          >
            {language === 'ru' ? 'UZ' : 'RU'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-10">
          <div className="max-w-sm mx-auto w-full">
            {/* Logo & Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-light text-white mb-2 tracking-tight">Поехали</h1>
              <p className="text-neutral-600 text-xs tracking-widest uppercase mb-6">{t.app_subtitle}</p>
              <div className="w-px h-12 bg-gradient-to-b from-amber-500/50 to-transparent mx-auto"></div>
            </div>

            {/* Price Card */}
            <div className="mb-10">
              <p className="text-neutral-600 text-[10px] tracking-widest uppercase text-center mb-4">{t.home.price_label}</p>
              <div className="text-center mb-2">
                <p className="text-5xl font-light text-white tracking-tight">{basePrice.toLocaleString()}</p>
                <p className="text-neutral-600 text-xs mt-3">{t.home.per_person}</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="w-8 h-px bg-neutral-800"></div>
                <p className="text-neutral-500 text-xs">{t.home.mail_label} <span className="text-neutral-300">{t.home.mail_from} {mailPrice.toLocaleString()}</span></p>
                <div className="w-8 h-px bg-neutral-800"></div>
              </div>
            </div>

            {/* Direction Buttons */}
            <div className="space-y-3 mb-8">
              <button
                onClick={() => setDirection('tashkent_fergana')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase ${
                  direction === 'tashkent_fergana'
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800'
                }`}
              >
                {directionLabels.tashkent_fergana}
              </button>

              <button
                onClick={() => setDirection('fergana_tashkent')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase ${
                  direction === 'fergana_tashkent'
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800'
                }`}
              >
                {directionLabels.fergana_tashkent}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('order')}
                className="w-full bg-amber-500 text-black py-5 transition-all text-xs tracking-widest uppercase hover:bg-amber-400"
              >
                {t.buttons.leave_request}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCall}
                  className="bg-neutral-900 text-white py-5 transition-all text-xs tracking-widest uppercase hover:bg-neutral-800"
                >
                  {t.buttons.call}
                </button>
                <button
                  onClick={handleMessage}
                  className="bg-neutral-900 text-white py-5 transition-all text-xs tracking-widest uppercase hover:bg-neutral-800"
                >
                  {t.buttons.message}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center">
          <p className="text-neutral-700 text-[9px] tracking-widest uppercase">© 2025 Poehali Taxi</p>
        </div>
      </div>
    )
  }

  // Экран формы заявки
  if (currentView === 'order') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentView('home')}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ←
            </button>
            <h1 className="text-xs font-medium text-white tracking-widest uppercase">{t.order.title}</h1>
            <button
              onClick={toggleLanguage}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors tracking-widest uppercase"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border border-amber-500/30 rounded-sm flex items-center justify-center mx-auto mb-6">
                <p className="text-amber-500 text-2xl font-light">{t.success.icon}</p>
              </div>
              <h2 className="text-lg font-light text-white mb-3">{t.success.title}</h2>
              <p className="text-neutral-600 text-xs mb-8">{t.success.message}</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-amber-500 text-black px-10 py-4 transition-all text-xs tracking-widest uppercase hover:bg-amber-400"
              >
                {t.buttons.return_to_menu}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Direction Info */}
              <div className="pb-5 border-b border-neutral-900">
                <p className="text-neutral-600 text-[10px] tracking-widest uppercase mb-2">{t.order.direction}</p>
                <p className="text-white text-sm font-light">{directionLabels[direction]}</p>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-neutral-600 text-[10px] tracking-widest uppercase">{t.order.location}</label>
                  <button
                    type="button"
                    onClick={getLocation}
                    className="text-amber-500 hover:text-amber-400 transition-colors text-xs"
                  >
                    {formData.location ? t.buttons.location_added : t.buttons.get_location}
                  </button>
                </div>
                {formData.location && (
                  <p className="text-neutral-500 text-xs truncate">📍 Геолокация добавлена</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-neutral-600 text-[10px] tracking-widest uppercase mb-3">{t.order.name}</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder-neutral-700"
                  placeholder={t.order.name_placeholder}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-neutral-600 text-[10px] tracking-widest uppercase mb-3">{t.order.phone}</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder-neutral-700"
                  placeholder={t.order.phone_placeholder}
                  required
                />
              </div>

              {/* Call Time */}
              <div>
                <label className="block text-neutral-600 text-[10px] tracking-widest uppercase mb-3">{t.order.call_time}</label>
                <input
                  type="text"
                  value={formData.preferred_call_time}
                  onChange={(e) => setFormData({...formData, preferred_call_time: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder-neutral-700"
                  placeholder={t.order.call_time_placeholder}
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-neutral-600 text-[10px] tracking-widest uppercase mb-3">{t.order.passengers}</label>
                <select
                  value={formData.passengers_count}
                  onChange={(e) => setFormData({...formData, passengers_count: parseInt(e.target.value)})}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num} className="bg-black">{num}</option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-neutral-600 text-[10px] tracking-widest uppercase mb-3">{t.order.comment}</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder-neutral-700 resize-none"
                  placeholder={t.order.comment_placeholder}
                  rows="3"
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="text-red-500 text-xs py-4">
                  Ошибка. Попробуйте ещё раз.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-amber-500 text-black py-5 transition-all text-xs tracking-widest uppercase hover:bg-amber-400 disabled:opacity-50 mt-8"
              >
                {submitStatus === 'loading' ? t.buttons.sending : t.buttons.send_request}
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
