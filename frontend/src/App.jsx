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
    leave_request: 'Оставить отзыв',
    back: '← Назад',
    call: 'Позвонить',
    message: 'Написать',
    send_request: 'Отправить',
    sending: 'Отправка...',
    return_to_menu: 'В меню'
  },
  review: {
    title: 'Оставить отзыв',
    rating: 'Оцените сервис',
    name: 'Ваше имя',
    name_placeholder: 'Как к вам обращаться',
    phone: 'Телефон',
    phone_placeholder: '+998 90 123 45 67',
    review: 'Ваш отзыв',
    review_placeholder: 'Расскажите о вашей поездке...'
  },
  success: {
    title: 'Спасибо за отзыв!',
    message: 'Ваше мнение очень важно для нас',
    icon: '✓'
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
    comment: '',
    rating: 0
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus('loading')

    try {
      const response = await fetch(`${API_URL}/reviews`, {
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
        setFormData({ customer_name: '', customer_phone: '', comment: '', rating: 0 })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Ошибка отправки отзыва:', error)
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
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-black to-red-900/10"></div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-2 border-orange-500/30 rounded-2xl mx-auto mb-4 relative overflow-hidden backdrop-blur-sm bg-black/50">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[shimmer_2s_infinite]"></div>
          </div>
          <p className="text-orange-400/40 text-xs tracking-[0.3em] uppercase font-light">Poehali</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-orange-600/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-t from-red-600/5 to-transparent rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
            <span className="text-[10px] text-neutral-500 tracking-widest uppercase">Ver 2.1</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="text-xs text-neutral-400 hover:text-white transition-colors tracking-widest uppercase backdrop-blur-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
          >
            {language === 'ru' ? 'UZ' : 'RU'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-10 relative z-10">
          <div className="max-w-sm mx-auto w-full">
            {/* Logo & Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center">
                  <span className="text-4xl">🚕</span>
                </div>
              </div>
              <h1 className="text-4xl font-light text-white mb-3 tracking-tight bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">Поехали</h1>
              <p className="text-neutral-400 text-xs tracking-widest uppercase mb-6">{t.app_subtitle}</p>
              <div className="w-px h-16 bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent mx-auto"></div>
            </div>

            {/* Price Card */}
            <div className="backdrop-blur-xl bg-white/[0.03] rounded-3xl p-8 mb-8 border border-white/5 shadow-2xl shadow-orange-500/5">
              <p className="text-neutral-600 text-[10px] tracking-widest uppercase text-center mb-6">{safeGet(t, 'home.price_label', 'Стоимость')}</p>
              <div className="text-center mb-6">
                <p className="text-6xl font-extralight text-white tracking-tighter">{basePrice.toLocaleString()}</p>
                <p className="text-neutral-600 text-xs mt-4 uppercase tracking-wider">{safeGet(t, 'home.per_person', 'с человека')}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-white/5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/20"></div>
                <p className="text-neutral-500 text-xs">{safeGet(t, 'home.mail_label', 'Посылки')} <span className="text-neutral-300 font-medium">{safeGet(t, 'home.mail_from', 'от')} {mailPrice.toLocaleString()}</span></p>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/20"></div>
              </div>
            </div>

            {/* Direction Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setDirection('tashkent_fergana')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase rounded-2xl backdrop-blur-sm ${
                  direction === 'tashkent_fergana'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-white/[0.02] text-neutral-500 hover:bg-white/[0.05] border border-white/5'
                }`}
              >
                {directionLabels.tashkent_fergana}
              </button>

              <button
                onClick={() => setDirection('fergana_tashkent')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase rounded-2xl backdrop-blur-sm ${
                  direction === 'fergana_tashkent'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-white/[0.02] text-neutral-500 hover:bg-white/[0.05] border border-white/5'
                }`}
              >
                {directionLabels.fergana_tashkent}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('review')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-600/30 font-medium"
              >
                ⭐ {t.buttons.leave_request}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCall}
                  className="bg-white/[0.02] text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:bg-white/[0.05] border border-white/5 backdrop-blur-sm"
                >
                  {t.buttons.call}
                </button>
                <button
                  onClick={handleMessage}
                  className="bg-white/[0.02] text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:bg-white/[0.05] border border-white/5 backdrop-blur-sm"
                >
                  {t.buttons.message}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center relative z-10">
          <p className="text-neutral-700 text-[9px] tracking-widest uppercase">© 2025 Poehali Taxi</p>
        </div>
      </div>
    )
  }

  // Экран формы отзыва
  if (currentView === 'review') {
    return (
      <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-3xl"></div>

        <div className="max-w-sm mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentView('home')}
              className="text-neutral-400 hover:text-white transition-colors p-2 -ml-2"
            >
              ← Назад
            </button>
            <h1 className="text-xs font-medium text-white tracking-widest uppercase">Оставить отзыв</h1>
            <button
              onClick={toggleLanguage}
              className="text-xs text-neutral-400 hover:text-white transition-colors tracking-widest uppercase backdrop-blur-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="text-center py-20 backdrop-blur-xl bg-white/[0.03] rounded-3xl border border-white/5">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl border border-white/5 flex items-center justify-center">
                  <p className="text-orange-400 text-3xl font-light">✓</p>
                </div>
              </div>
              <h2 className="text-xl font-light text-white mb-3">Спасибо за отзыв!</h2>
              <p className="text-neutral-400 text-xs mb-8">Ваше мнение очень важно для нас</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-10 py-4 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-600/30"
              >
                В меню
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 backdrop-blur-xl bg-white/[0.03] rounded-3xl p-6 border border-white/5">
              {/* Rating */}
              <div className="pb-5 border-b border-white/5">
                <label className="block text-neutral-500 text-[10px] tracking-widest uppercase mb-4 text-center">Оцените сервис</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className={`text-4xl transition-all ${
                        formData.rating >= star 
                          ? 'text-orange-500 scale-110' 
                          : 'text-neutral-700 hover:text-neutral-500'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <p className="text-neutral-400 text-xs text-center mt-4">
                    {formData.rating === 5 && 'Отлично! ⭐⭐⭐⭐⭐'}
                    {formData.rating === 4 && 'Хорошо! ⭐⭐⭐⭐'}
                    {formData.rating === 3 && 'Нормально ⭐⭐⭐'}
                    {formData.rating === 2 && 'Плохо ⭐⭐'}
                    {formData.rating === 1 && 'Ужасно ⭐'}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-neutral-500 text-[10px] tracking-widest uppercase mb-3">Ваше имя</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors placeholder-neutral-600 backdrop-blur-sm"
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-neutral-500 text-[10px] tracking-widest uppercase mb-3">Телефон</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors placeholder-neutral-600 backdrop-blur-sm"
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-neutral-500 text-[10px] tracking-widest uppercase mb-3">Ваш отзыв</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors placeholder-neutral-600 backdrop-blur-sm resize-none"
                  placeholder="Расскажите о вашей поездке..."
                  rows="5"
                  required
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="text-red-400 text-xs py-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  Ошибка. Попробуйте ещё раз.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading' || !formData.rating}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitStatus === 'loading' ? 'Отправка...' : 'Отправить отзыв'}
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
