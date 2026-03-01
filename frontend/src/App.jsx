import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = 'abdurasulovb'
const ADMIN_TELEGRAM_IDS = ['123456789', '987654321'] // Telegram ID администраторов

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

  const loadAdminData = async () => {
    setAdminLoading(true)
    try {
      const [reviewsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/reviews`),
        fetch(`${API_URL}/orders`)
      ])
      const reviews = await reviewsRes.json()
      const orders = await ordersRes.json()
      setAdminData({ reviews, orders })
    } catch (error) {
      console.error('Ошибка загрузки данных админ-панели:', error)
    }
    setAdminLoading(false)
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

  // Проверка прав администратора
  const isAdmin = () => {
    try {
      const tgUserId = tg?.initDataUnsafe?.user?.id?.toString()
      return tgUserId && ADMIN_TELEGRAM_IDS.includes(tgUserId)
    } catch {
      return false
    }
  }

  const [isAdminView, setIsAdminView] = useState(false)
  const [adminData, setAdminData] = useState({ reviews: [], orders: [] })
  const [adminLoading, setAdminLoading] = useState(false)

  // Preloader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-gray-50 to-red-100/10"></div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-2 border-orange-200 rounded-2xl mx-auto mb-4 relative overflow-hidden backdrop-blur-sm bg-white/50">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[shimmer_2s_infinite]"></div>
          </div>
          <p className="text-orange-600/60 text-xs tracking-[0.3em] uppercase font-medium">Poehali</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-t from-red-200/20 to-transparent rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/30"></div>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Ver 2.1</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <button
                onClick={() => {
                  setIsAdminView(!isAdminView)
                  if (!isAdminView) loadAdminData()
                }}
                className="text-xs text-gray-600 hover:text-orange-600 transition-colors tracking-widest uppercase backdrop-blur-sm bg-white/70 px-3 py-1.5 rounded-full border border-gray-200"
              >
                ⚙️
              </button>
            )}
            <button
              onClick={toggleLanguage}
              className="text-xs text-gray-600 hover:text-orange-600 transition-colors tracking-widest uppercase backdrop-blur-sm bg-white/70 px-3 py-1.5 rounded-full border border-gray-200"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-10 relative z-10">
          <div className="max-w-sm mx-auto w-full">
            {/* Logo & Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-3xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-full h-full bg-white backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl flex items-center justify-center">
                  <span className="text-4xl">🚕</span>
                </div>
              </div>
              <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Поехали</h1>
              <p className="text-gray-500 text-xs tracking-widest uppercase mb-6">{t.app_subtitle}</p>
              <div className="w-px h-16 bg-gradient-to-b from-orange-400/50 via-orange-400/20 to-transparent mx-auto"></div>
            </div>

            {/* Price Card */}
            <div className="backdrop-blur-xl bg-white rounded-3xl p-8 mb-8 border border-gray-200 shadow-xl shadow-orange-500/5">
              <p className="text-gray-400 text-[10px] tracking-widest uppercase text-center mb-6">{safeGet(t, 'home.price_label', 'Стоимость')}</p>
              <div className="text-center mb-6">
                <p className="text-6xl font-light text-gray-900 tracking-tighter">{basePrice.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-4 uppercase tracking-wider">{safeGet(t, 'home.per_person', 'с человека')}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-100">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-400/30"></div>
                <p className="text-gray-500 text-xs">{safeGet(t, 'home.mail_label', 'Посылки')} <span className="text-gray-700 font-medium">{safeGet(t, 'home.mail_from', 'от')} {mailPrice.toLocaleString()}</span></p>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-400/30"></div>
              </div>
            </div>

            {/* Direction Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setDirection('tashkent_fergana')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase rounded-2xl backdrop-blur-sm font-medium ${
                  direction === 'tashkent_fergana'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {directionLabels.tashkent_fergana}
              </button>

              <button
                onClick={() => setDirection('fergana_tashkent')}
                className={`w-full py-5 px-6 transition-all text-xs tracking-widest uppercase rounded-2xl backdrop-blur-sm font-medium ${
                  direction === 'fergana_tashkent'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {directionLabels.fergana_tashkent}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('review')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 font-medium"
              >
                ⭐ {t.buttons.leave_request}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCall}
                  className="bg-white text-gray-700 py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:bg-gray-50 border border-gray-200 backdrop-blur-sm font-medium"
                >
                  {t.buttons.call}
                </button>
                <button
                  onClick={handleMessage}
                  className="bg-white text-gray-700 py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:bg-gray-50 border border-gray-200 backdrop-blur-sm font-medium"
                >
                  {t.buttons.message}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center relative z-10">
          <p className="text-gray-400 text-[9px] tracking-widest uppercase">© 2025 Poehali Taxi</p>
        </div>
      </div>
    )
  }

  // Экран формы отзыва
  if (currentView === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-sm mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2 font-medium"
            >
              ← Назад
            </button>
            <h1 className="text-xs font-medium text-gray-900 tracking-widest uppercase">Оставить отзыв</h1>
            <button
              onClick={toggleLanguage}
              className="text-xs text-gray-600 hover:text-orange-600 transition-colors tracking-widest uppercase backdrop-blur-sm bg-white px-3 py-1.5 rounded-full border border-gray-200"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="text-center py-20 backdrop-blur-xl bg-white rounded-3xl border border-gray-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl blur-lg opacity-40"></div>
                <div className="relative w-full h-full bg-white backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl flex items-center justify-center">
                  <p className="text-green-500 text-3xl font-bold">✓</p>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Спасибо за отзыв!</h2>
              <p className="text-gray-500 text-xs mb-8">Ваше мнение очень важно для нас</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 font-medium"
              >
                В меню
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 backdrop-blur-xl bg-white rounded-3xl p-6 border border-gray-200 shadow-xl">
              {/* Rating */}
              <div className="pb-5 border-b border-gray-100">
                <label className="block text-gray-500 text-[10px] tracking-widest uppercase mb-4 text-center font-medium">Оцените сервис</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className={`text-4xl transition-all ${
                        formData.rating >= star
                          ? 'text-orange-500 scale-110'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <p className="text-gray-500 text-xs text-center mt-4">
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
                <label className="block text-gray-500 text-[10px] tracking-widest uppercase mb-3 font-medium">Ваше имя</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-gray-400"
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-500 text-[10px] tracking-widest uppercase mb-3 font-medium">Телефон</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-gray-400"
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-gray-500 text-[10px] tracking-widest uppercase mb-3 font-medium">Ваш отзыв</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-gray-400 resize-none"
                  placeholder="Расскажите о вашей поездке..."
                  rows="5"
                  required
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="text-red-500 text-xs py-4 bg-red-50 rounded-xl border border-red-200">
                  Ошибка. Попробуйте ещё раз.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading' || !formData.rating}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitStatus === 'loading' ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Админ-панель
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setIsAdminView(false)}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2 font-medium"
            >
              ← Назад
            </button>
            <h1 className="text-sm font-semibold text-gray-900 tracking-widest uppercase">⚙️ Админ-панель</h1>
            <div className="w-8"></div>
          </div>

          {adminLoading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-xl">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Загрузка данных...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-2">Отзывы</p>
                  <p className="text-3xl font-bold text-gray-900">{adminData.reviews.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-2">Заказы</p>
                  <p className="text-3xl font-bold text-gray-900">{adminData.orders.length}</p>
                </div>
              </div>

              {/* Последние отзывы */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⭐</span> Последние отзывы
                </h2>
                {adminData.reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет отзывов</p>
                ) : (
                  <div className="space-y-4">
                    {adminData.reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-500 text-sm">{'⭐'.repeat(review.rating)}</span>
                          <span className="text-gray-400 text-xs">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-900 font-medium text-sm mb-1">{review.customer_name}</p>
                        <p className="text-gray-600 text-xs">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Последние заказы */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🚕</span> Последние заказы
                </h2>
                {adminData.orders.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет заказов</p>
                ) : (
                  <div className="space-y-4">
                    {adminData.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 font-medium text-sm">Заказ #{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>{order.status}</span>
                        </div>
                        <p className="text-gray-600 text-xs">{order.customer_name} • {order.customer_phone}</p>
                        <p className="text-gray-500 text-xs mt-1">{order.passengers_count} пасс. • {order.comment?.slice(0, 50) || 'Без комментария'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default App
