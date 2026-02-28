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
    return_to_menu: 'Вернуться в меню'
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
    comment_placeholder: 'Пожелания к поездке'
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
      setTrip({ id: 1, direction, price: 150000 })
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

  const basePrice = 150000
  const mailPrice = 60000

  // Preloader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-[#3a3a3a] rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-[#6366f1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[#8a8a8a] text-sm font-medium tracking-wider">ПОЕХАЛИ</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-[#e0e0e0] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <span className="text-xs text-[#5a5a5a] font-mono tracking-wider">VER 1.3</span>
          <button
            onClick={toggleLanguage}
            className="bg-[#1f1f1f] hover:bg-[#2a2a2a] px-3 py-1.5 rounded-full text-xs font-semibold transition-all text-[#6b6b6b] border border-[#2a2a2a]"
          >
            {language === 'ru' ? 'UZ' : 'RU'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-4 pb-8">
          <div className="max-w-md mx-auto w-full">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl mb-4 shadow-lg shadow-[#6366f1]/20">
                <span className="text-3xl">🚕</span>
              </div>
              <h1 className="text-2xl font-bold text-[#e0e0e0] mb-1 tracking-tight">Поехали</h1>
              <p className="text-[#6b6b6b] text-sm font-medium">{t.app_subtitle}</p>
              <p className="text-[#4a4a4a] text-xs mt-2">{t.app_description}</p>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-3xl p-6 mb-6 border border-[#2a2a2a] shadow-xl">
              <div className="text-center">
                <p className="text-[#6b6b6b] text-xs mb-3 uppercase tracking-widest">{t.home.price_label}</p>
                <div className="mb-5">
                  <p className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                    {basePrice.toLocaleString()}
                  </p>
                  <p className="text-[#6b6b6b] text-xs mt-1.5">{t.home.per_person}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl py-3 px-4">
                  <p className="text-[#8a8a8a] text-xs">
                    {t.home.mail_label} <span className="text-[#e0e0e0] font-semibold">{t.home.mail_from} {mailPrice.toLocaleString()} сум</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Direction Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                onClick={() => setDirection('tashkent_fergana')}
                className={`w-full py-4 px-4 rounded-2xl font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                  direction === 'tashkent_fergana'
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/25'
                    : 'bg-[#1f1f1f] text-[#8a8a8a] hover:bg-[#2a2a2a] border border-[#2a2a2a]'
                }`}
              >
                <span>📍</span> {directionLabels.tashkent_fergana}
              </button>

              <button
                onClick={() => setDirection('fergana_tashkent')}
                className={`w-full py-4 px-4 rounded-2xl font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                  direction === 'fergana_tashkent'
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/25'
                    : 'bg-[#1f1f1f] text-[#8a8a8a] hover:bg-[#2a2a2a] border border-[#2a2a2a]'
                }`}
              >
                <span>📍</span> {directionLabels.fergana_tashkent}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => setCurrentView('order')}
                className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white py-4 rounded-2xl font-medium hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all text-sm"
              >
                📋 {t.buttons.leave_request}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleCall}
                  className="bg-[#1f1f1f] text-[#e0e0e0] py-4 rounded-2xl font-medium hover:bg-[#2a2a2a] transition-all text-sm border border-[#2a2a2a]"
                >
                  📞 {t.buttons.call}
                </button>
                <button
                  onClick={handleMessage}
                  className="bg-[#1f1f1f] text-[#e0e0e0] py-4 rounded-2xl font-medium hover:bg-[#2a2a2a] transition-all text-sm border border-[#2a2a2a]"
                >
                  💬 {t.buttons.message}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-[#3a3a3a] text-xs">© 2025 Поехали Taxi</p>
        </div>
      </div>
    )
  }

  // Экран формы заявки
  if (currentView === 'order') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-[#e0e0e0] p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="text-[#6b6b6b] hover:text-[#8a8a8a] transition-colors"
            >
              ← Назад
            </button>
            <h1 className="text-base font-medium text-[#e0e0e0]">{t.order.title}</h1>
            <button
              onClick={toggleLanguage}
              className="bg-[#1f1f1f] px-3 py-1 rounded-full text-xs font-semibold text-[#6b6b6b] border border-[#2a2a2a]"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] px-6 py-10 rounded-3xl text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#22c55e]/20">
                <p className="text-3xl">✅</p>
              </div>
              <h2 className="text-lg font-semibold text-[#e0e0e0] mb-2">{t.success.title}</h2>
              <p className="text-[#6b6b6b] text-sm mb-6">{t.success.message}</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-8 py-3 rounded-xl text-sm font-medium shadow-lg shadow-[#6366f1]/25"
              >
                {t.buttons.return_to_menu}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#1f1f1f] rounded-3xl p-5 border border-[#2a2a2a] space-y-4">
              {/* Direction Info */}
              <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-xl p-4 mb-2">
                <p className="text-[#6b6b6b] text-xs mb-1">{t.order.direction}</p>
                <p className="text-[#e0e0e0] text-sm font-medium">{directionLabels[direction]}</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">{t.order.name}</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                  placeholder={t.order.name_placeholder}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">{t.order.phone}</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                  placeholder={t.order.phone_placeholder}
                  required
                />
              </div>

              {/* Call Time */}
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">{t.order.call_time}</label>
                <input
                  type="text"
                  value={formData.preferred_call_time}
                  onChange={(e) => setFormData({...formData, preferred_call_time: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                  placeholder={t.order.call_time_placeholder}
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">{t.order.passengers}</label>
                <select
                  value={formData.passengers_count}
                  onChange={(e) => setFormData({...formData, passengers_count: parseInt(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} чел.</option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">{t.order.comment}</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#6366f1] transition-colors resize-none"
                  placeholder={t.order.comment_placeholder}
                  rows="3"
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-xl text-xs">
                  Ошибка при отправке. Попробуйте ещё раз.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white py-4 rounded-xl font-medium hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all disabled:opacity-50 text-sm"
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
