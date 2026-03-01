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
  app_description: 'Быстро. Комфортно. Надёжно.',
  directions: {
    tashkent_fergana: 'Ташкент → Фергана',
    fergana_tashkent: 'Фергана → Ташкент'
  },
  buttons: {
    leave_request: 'Оставить заявку',
    back: '← Назад',
    call: 'Позвонить',
    message: 'Написать',
    send_request: 'Отправить заявку',
    sending: 'Отправка...',
    return_to_menu: 'Вернуться в меню',
    get_location: '📍 Использовать геолокацию',
    location_added: '✅ Геолокация добавлена'
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
    passengers: 'Пассажиры',
    comment: 'Комментарий',
    comment_placeholder: 'Пожелания к поездке',
    location: 'Ваша геолокация',
    location_placeholder: 'Нажмите кнопку ниже чтобы добавить'
  },
  success: {
    title: 'Заявка отправлена!',
    message: 'Мы перезвоним вам в течение 5 минут.',
    icon: '✅'
  },
  home: {
    price_label: 'Стоимость поездки',
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
    }, 800)
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        
        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}"></div>
          </div>
          <p className="text-gray-400 text-sm font-semibold tracking-widest">ПОЕХАЛИ</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 font-mono tracking-wider">VER 1.4</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-xs font-semibold transition-all text-gray-400 border border-white/10 backdrop-blur-sm"
          >
            {language === 'ru' ? 'UZ' : 'RU'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-5 pb-8 relative z-10">
          <div className="max-w-md mx-auto w-full">
            {/* Logo & Title */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mb-5 shadow-2xl shadow-purple-500/30 transform hover:scale-105 transition-transform">
                <span className="text-4xl">🚕</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Поехали</h1>
              <p className="text-gray-400 text-sm font-medium">{t.app_subtitle}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-500 border border-white/10">✨ Быстро</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-500 border border-white/10">🛋 Комфортно</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-500 border border-white/10">🛡 Надёжно</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 mb-6 border border-white/10 shadow-2xl">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">{t.home.price_label}</p>
                </div>
                <div className="mb-6">
                  <p className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    {basePrice.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">{t.home.per_person}</p>
                </div>
                <div className="bg-black/20 rounded-2xl py-4 px-6 border border-white/5">
                  <p className="text-gray-400 text-xs">
                    {t.home.mail_label} <span className="text-white font-semibold">{t.home.mail_from} {mailPrice.toLocaleString()} сум</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Direction Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setDirection('tashkent_fergana')}
                className={`w-full py-5 px-6 rounded-2xl font-medium transition-all text-sm flex items-center justify-center gap-3 ${
                  direction === 'tashkent_fergana'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/30 scale-105'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-lg">📍</span> {directionLabels.tashkent_fergana}
              </button>

              <button
                onClick={() => setDirection('fergana_tashkent')}
                className={`w-full py-5 px-6 rounded-2xl font-medium transition-all text-sm flex items-center justify-center gap-3 ${
                  direction === 'fergana_tashkent'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/30 scale-105'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-lg">📍</span> {directionLabels.fergana_tashkent}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('order')}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-purple-500/40 transition-all text-sm transform hover:scale-105"
              >
                📋 {t.buttons.leave_request}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCall}
                  className="bg-white/5 text-white py-5 rounded-2xl font-medium hover:bg-white/10 transition-all text-sm border border-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
                >
                  <span>📞</span> {t.buttons.call}
                </button>
                <button
                  onClick={handleMessage}
                  className="bg-white/5 text-white py-5 rounded-2xl font-medium hover:bg-white/10 transition-all text-sm border border-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
                >
                  <span>💬</span> {t.buttons.message}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 text-center relative z-10">
          <p className="text-gray-600 text-xs">© 2025 Поехали Taxi • Все права защищены</p>
        </div>
      </div>
    )
  }

  // Экран формы заявки
  if (currentView === 'order') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-5 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-md mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              ← Назад
            </button>
            <h1 className="text-base font-semibold text-white">{t.order.title}</h1>
            <button
              onClick={toggleLanguage}
              className="bg-white/5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-400 border border-white/10"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-12 rounded-3xl text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
                <p className="text-4xl">✅</p>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{t.success.title}</h2>
              <p className="text-gray-400 text-sm mb-8">{t.success.message}</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-10 py-4 rounded-xl text-sm font-semibold shadow-2xl shadow-purple-500/30"
              >
                {t.buttons.return_to_menu}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5">
              {/* Direction Info */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-5 border border-indigo-500/20">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">{t.order.direction}</p>
                <p className="text-white text-sm font-semibold">{directionLabels[direction]}</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.location}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.location}
                    readOnly
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-gray-300 text-sm focus:outline-none"
                    placeholder={formData.location ? 'Геолокация добавлена' : t.order.location_placeholder}
                  />
                  <button
                    type="button"
                    onClick={getLocation}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3.5 rounded-xl text-sm font-semibold transition-all shrink-0"
                  >
                    📍
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.name}</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={t.order.name_placeholder}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.phone}</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={t.order.phone_placeholder}
                  required
                />
              </div>

              {/* Call Time */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.call_time}</label>
                <input
                  type="text"
                  value={formData.preferred_call_time}
                  onChange={(e) => setFormData({...formData, preferred_call_time: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={t.order.call_time_placeholder}
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.passengers}</label>
                <select
                  value={formData.passengers_count}
                  onChange={(e) => setFormData({...formData, passengers_count: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num} className="bg-[#0a0a0a]">{num} чел.</option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.order.comment}</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder={t.order.comment_placeholder}
                  rows="3"
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs">
                  Ошибка при отправке. Попробуйте ещё раз.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-5 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 text-sm transform hover:scale-105"
              >
                {submitStatus === 'loading' ? t.buttons.sending : `📋 ${t.buttons.send_request}`}
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
