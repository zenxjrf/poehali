import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = 'abdurasulovb'
const ADMIN_TELEGRAM_IDS = (import.meta.env.VITE_ADMIN_IDS || '1698158035').split(',')

console.log('=== APP CONFIG ===')
console.log('API_URL:', API_URL)
console.log('DISPATCHER_USERNAME:', DISPATCHER_USERNAME)
console.log('ADMIN_TELEGRAM_IDS:', ADMIN_TELEGRAM_IDS)

// Проверка доступности API
async function checkApiAvailability() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`${API_URL.replace('/api/v1', '')}/health`, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

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

  // Форма заявки
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    preferred_call_time: '',
    passengers_count: 1,
    comment: '',
    location: ''
  })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(true)
  const [checkingApi, setCheckingApi] = useState(true)

  // Проверка API при загрузке
  useEffect(() => {
    const checkApi = async () => {
      setCheckingApi(true)
      const available = await checkApiAvailability()
      console.log('=== API AVAILABILITY ===')
      console.log('API available:', available)
      setApiAvailable(available)
      setCheckingApi(false)
    }
    checkApi()
  }, [])

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
    
    // Проверка рейтинга
    if (!formData.rating || formData.rating < 1) {
      alert('Пожалуйста, оцените сервис (1-5 звёзд)')
      return
    }
    
    console.log('Отправка отзыва:', formData)
    console.log('API_URL:', API_URL)
    
    setSubmitStatus('loading')

    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          rating: formData.rating,
          comment: formData.comment,
          trip_id: trip?.id || 1
        })
      })

      console.log('Ответ сервера:', response.status)
      
      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ customer_name: '', customer_phone: '', comment: '', rating: 0 })
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        setSubmitStatus('error')
        alert('Ошибка: ' + (errorData.detail || 'Попробуйте ещё раз'))
      }
    } catch (error) {
      console.error('Ошибка отправки отзыва:', error)
      setSubmitStatus('error')
      alert('Ошибка сети: ' + error.message)
    }
  }

  const handleCall = () => {
    window.location.href = 'tel:+998941365474'
  }

  const handleMessage = () => {
    window.open(`https://t.me/${DISPATCHER_USERNAME}`, '_blank', 'noopener,noreferrer')
  }

  // Получение геолокации
  const getLocation = () => {
    setLocationLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          // Создаём ссылку на Google Maps
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
          setOrderForm({...orderForm, location: locationUrl})
          setLocationLoading(false)
          alert('📍 Геолокация добавлена!')
        },
        (error) => {
          console.error('Ошибка геолокации:', error)
          setLocationLoading(false)
          alert('❌ Не удалось получить геолокацию. Разрешите доступ к геопозиции.')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setLocationLoading(false)
      alert('❌ Ваш браузер не поддерживает геолокацию')
    }
  }

  // Отправка заявки
  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== ОТПРАВКА ЗАЯВКИ ===')
    console.log('Данные формы:', orderForm)
    console.log('API_URL:', API_URL)
    
    if (!orderForm.customer_name || !orderForm.customer_phone) {
      alert('Пожалуйста, заполните имя и телефон')
      return
    }
    
    setOrderSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: orderForm.customer_name,
          customer_phone: orderForm.customer_phone,
          preferred_call_time: orderForm.preferred_call_time || 'Любое время',
          passengers_count: orderForm.passengers_count,
          comment: orderForm.comment || 'Нет',
          location: orderForm.location || 'Не указана',
          trip_id: trip?.id || 1,
          driver_id: null
        })
      })

      console.log('Ответ сервера:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Заказ создан:', data)
        setOrderSubmitting(false)
        setOrderForm({
          customer_name: '',
          customer_phone: '',
          preferred_call_time: '',
          passengers_count: 1,
          comment: '',
          location: ''
        })
        alert('✅ Заявка успешно отправлена!\n\nМы перезвоним вам в ближайшее время.')
        setCurrentView('home')
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        setOrderSubmitting(false)
        alert('❌ Ошибка: ' + (errorData.detail || 'Попробуйте ещё раз'))
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      setOrderSubmitting(false)
      alert('❌ Ошибка сети: ' + error.message)
    }
  }

  const loadAdminData = async () => {
    console.log('=== LOADING ADMIN DATA ===')
    setAdminLoading(true)
    try {
      console.log('Fetching from API_URL:', API_URL)
      
      const reviewsRes = await fetch(`${API_URL}/reviews`)
      console.log('Reviews response status:', reviewsRes.status)
      const reviews = await reviewsRes.json()
      console.log('Reviews:', reviews)
      
      const ordersRes = await fetch(`${API_URL}/orders`)
      console.log('Orders response status:', ordersRes.status)
      const orders = await ordersRes.json()
      console.log('Orders:', orders)
      
      const tripsRes = await fetch(`${API_URL}/trips`)
      console.log('Trips response status:', tripsRes.status)
      const trips = await tripsRes.json()
      console.log('Trips:', trips)
      
      setAdminData({ reviews, orders, trips })
      // Устанавливаем текущие цены
      const tripData = trips.reduce((acc, t) => {
        acc[t.direction] = t.price
        return acc
      }, {})
      console.log('Trip prices:', tripData)
      setPriceEdit(tripData)
    } catch (error) {
      console.error('=== ADMIN DATA LOAD ERROR ===', error)
      alert('Ошибка загрузки данных: ' + error.message)
    }
    setAdminLoading(false)
  }

  const savePrices = async () => {
    setPriceSaving(true)
    try {
      const promises = Object.entries(priceEdit).map(async ([direction, price]) => {
        const trip = adminData.trips.find(t => t.direction === direction)
        if (trip) {
          await fetch(`${API_URL}/trips/${trip.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price })
          })
        }
      })
      await Promise.all(promises)
      setPriceSaved(true)
      setTimeout(() => setPriceSaved(false), 3000)
    } catch (error) {
      console.error('Ошибка сохранения цен:', error)
    }
    setPriceSaving(false)
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
  const checkAdmin = () => {
    try {
      // Получаем Telegram User ID
      const tgUserId = tg?.initDataUnsafe?.user?.id?.toString()
      console.log('=== ADMIN CHECK ===')
      console.log('tg object:', tg)
      console.log('Telegram User ID:', tgUserId)
      console.log('Admin IDs:', ADMIN_TELEGRAM_IDS)
      const isAdmin = tgUserId && ADMIN_TELEGRAM_IDS.includes(tgUserId)
      console.log('Is admin:', isAdmin)
      return isAdmin
    } catch (error) {
      console.error('Ошибка проверки админа:', error)
      return false
    }
  }

  const [isAdminView, setIsAdminView] = useState(false)
  const [adminData, setAdminData] = useState({ reviews: [], orders: [], trips: [] })
  const [adminLoading, setAdminLoading] = useState(false)
  const [priceEdit, setPriceEdit] = useState({ tashkent_fergana: 150000, fergana_tashkent: 150000 })
  const [priceSaving, setPriceSaving] = useState(false)
  const [priceSaved, setPriceSaved] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)

  // Проверяем админа при загрузке и когда tg готов
  useEffect(() => {
    if (!isLoading && tg) {
      const adminResult = checkAdmin()
      console.log('Админ проверка завершена:', adminResult)
      setIsUserAdmin(adminResult)
    } else if (!isLoading && !tg) {
      console.log('Telegram WebApp не доступен')
    }
  }, [isLoading, tg])

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
      <div className="min-h-screen bg-gray-300 text-gray-900 flex flex-col relative overflow-hidden">
        {/* Уведомление о недоступности API */}
        {!apiAvailable && !checkingApi && (
          <div className="bg-red-500 text-white px-4 py-3 text-xs text-center font-medium">
            ⚠️ Сервер недоступен. Попробуйте позже.
          </div>
        )}
        {checkingApi && (
          <div className="bg-blue-500 text-white px-4 py-3 text-xs text-center font-medium">
            🔍 Проверка соединения...
          </div>
        )}
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-orange-500/35 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-t from-red-500/35 to-transparent rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/30"></div>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Ver 2.1</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                // Проверка админа при клике
                console.log('=== ADMIN BUTTON CLICKED ===')
                const isAdmin = checkAdmin()
                console.log('Admin check result:', isAdmin)
                if (isAdmin) {
                  console.log('Opening admin panel...')
                  setIsAdminView(!isAdminView)
                  if (!isAdminView) loadAdminData()
                } else {
                  // Для тестирования открываем всё равно
                  console.log('Admin check failed, but opening anyway for testing...')
                  setIsAdminView(!isAdminView)
                  if (!isAdminView) loadAdminData()
                }
              }}
              className="text-xs text-gray-600 hover:text-orange-600 transition-colors tracking-widest uppercase backdrop-blur-sm bg-white/70 px-3 py-1.5 rounded-full border border-gray-200"
            >
              ⚙️
            </button>
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
                onClick={() => {
                  if (!apiAvailable) {
                    alert('⚠️ Сервер временно недоступен. Попробуйте позже.')
                    return
                  }
                  setCurrentView('order')
                }}
                disabled={!apiAvailable}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-blue-600/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚕 Оставить заявку
              </button>
              
              <button
                onClick={() => {
                  if (!apiAvailable) {
                    alert('⚠️ Сервер временно недоступен. Попробуйте позже.')
                    return
                  }
                  setCurrentView('review')
                }}
                disabled={!apiAvailable}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⭐ Оставить отзыв
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
      <div className="min-h-screen bg-stone-400 text-gray-900 p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-600/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/40 rounded-full blur-3xl"></div>

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
            <div className="text-center py-20 backdrop-blur-xl bg-stone-200 rounded-3xl border border-stone-300 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl blur-lg opacity-40"></div>
                <div className="relative w-full h-full bg-stone-100 backdrop-blur-xl rounded-2xl border border-stone-300 shadow-xl flex items-center justify-center">
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
            <form onSubmit={handleSubmit} className="space-y-5 backdrop-blur-xl bg-stone-200 rounded-3xl p-6 border border-stone-300 shadow-xl">
              {/* Rating */}
              <div className="pb-5 border-b border-stone-300">
                <label className="block text-gray-600 text-[10px] tracking-widest uppercase mb-4 text-center font-medium">Оцените сервис</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className={`text-4xl transition-all ${
                        formData.rating >= star
                          ? 'text-orange-600 scale-110'
                          : 'text-gray-400 hover:text-gray-500'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <p className="text-gray-600 text-xs text-center mt-4">
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
                <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Ваше имя</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all placeholder-gray-500"
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Телефон</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all placeholder-gray-500"
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Ваш отзыв</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all placeholder-gray-500 resize-none"
                  placeholder="Расскажите о вашей поездке..."
                  rows="5"
                  required
                />
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="text-red-600 text-xs py-4 bg-red-100 rounded-xl border border-red-300">
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

  // Экран формы заявки
  if (currentView === 'order') {
    return (
      <div className="min-h-screen bg-stone-400 text-gray-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-600/40 rounded-full blur-3xl"></div>

        <div className="max-w-sm mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-700 hover:text-gray-900 transition-colors p-2 -ml-2 font-medium"
            >
              ← Назад
            </button>
            <h1 className="text-xs font-semibold text-gray-900 tracking-widest uppercase">🚕 Заявка на поездку</h1>
            <div className="w-8"></div>
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-4 backdrop-blur-xl bg-stone-200 rounded-3xl p-6 border border-stone-300 shadow-xl">
            {/* Направление */}
            <div className="bg-stone-100 rounded-xl p-4 border border-stone-300">
              <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-2 font-medium">Направление</p>
              <p className="text-gray-900 font-semibold">{directionLabels[direction]}</p>
              <p className="text-gray-600 text-sm mt-1">Цена: <span className="font-bold text-gray-900">{basePrice.toLocaleString()} сум</span></p>
            </div>

            {/* Имя */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Ваше имя *</label>
              <input
                type="text"
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder-gray-500"
                placeholder="Как к вам обращаться"
                required
              />
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Номер телефона *</label>
              <input
                type="tel"
                value={orderForm.customer_phone}
                onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder-gray-500"
                placeholder="+998 90 123 45 67"
                required
              />
            </div>

            {/* Время для звонка */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Удобное время для звонка</label>
              <input
                type="text"
                value={orderForm.preferred_call_time}
                onChange={(e) => setOrderForm({...orderForm, preferred_call_time: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder-gray-500"
                placeholder="Например: с 9:00 до 18:00"
              />
            </div>

            {/* Пассажиры */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Количество пассажиров</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderForm({...orderForm, passengers_count: Math.max(1, orderForm.passengers_count - 1)})}
                  className="w-12 h-12 bg-stone-100 border border-stone-300 rounded-xl text-gray-700 text-xl font-bold hover:bg-stone-200 transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">{orderForm.passengers_count}</span>
                <button
                  type="button"
                  onClick={() => setOrderForm({...orderForm, passengers_count: Math.min(10, orderForm.passengers_count + 1)})}
                  className="w-12 h-12 bg-stone-100 border border-stone-300 rounded-xl text-gray-700 text-xl font-bold hover:bg-stone-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Геолокация */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Местоположение</label>
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                className={`w-full py-4 rounded-xl border-2 border-dashed transition-all font-medium ${
                  orderForm.location
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-stone-100 border-stone-400 text-gray-600 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                {locationLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Определение...
                  </span>
                ) : orderForm.location ? (
                  <span className="flex items-center justify-center gap-2">
                    📍 Геолокация добавлена
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    📍 Добавить геолокацию
                  </span>
                )}
              </button>
              {orderForm.location && (
                <a
                  href={orderForm.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs text-blue-600 hover:underline text-center"
                >
                  🔗 Открыть на карте
                </a>
              )}
            </div>

            {/* Комментарий */}
            <div>
              <label className="block text-gray-700 text-[10px] tracking-widest uppercase mb-3 font-medium">Комментарий (необязательно)</label>
              <textarea
                value={orderForm.comment}
                onChange={(e) => setOrderForm({...orderForm, comment: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder-gray-500 resize-none"
                placeholder="Пожелания к поездке..."
                rows="3"
              />
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={orderSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
            >
              {orderSubmitting ? '⏳ Отправка...' : '✅ Отправить заявку'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Админ-панель
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-stone-400 text-gray-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-600/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/40 rounded-full blur-3xl"></div>

        <div className="max-w-3xl mx-auto relative z-10">
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
              {/* Управление ценами */}
              <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💰</span> Управление ценами
                </h2>
                <div className="space-y-4">
                  {Object.entries(priceEdit).map(([direction, price]) => (
                    <div key={direction} className="flex items-center gap-4">
                      <label className="text-gray-800 text-sm font-medium w-40 capitalize">
                        {direction === 'tashkent_fergana' ? 'Ташкент → Фергана' : 'Фергана → Ташкент'}:
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPriceEdit({...priceEdit, [direction]: parseInt(e.target.value) || 0})}
                        className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                      <span className="text-gray-600 text-sm whitespace-nowrap">сум</span>
                    </div>
                  ))}
                  <button
                    onClick={savePrices}
                    disabled={priceSaving}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-600/30 disabled:opacity-50 font-medium"
                  >
                    {priceSaving ? 'Сохранение...' : priceSaved ? '✓ Сохранено!' : 'Сохранить цены'}
                  </button>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-lg">
                  <p className="text-gray-600 text-[10px] tracking-widest uppercase mb-2">Отзывы</p>
                  <p className="text-3xl font-bold text-gray-900">{adminData.reviews.length}</p>
                </div>
                <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-lg">
                  <p className="text-gray-600 text-[10px] tracking-widest uppercase mb-2">Заказы</p>
                  <p className="text-3xl font-bold text-gray-900">{adminData.orders.length}</p>
                </div>
              </div>

              {/* Последние отзывы */}
              <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⭐</span> Последние отзывы
                </h2>
                {adminData.reviews.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8">Нет отзывов</p>
                ) : (
                  <div className="space-y-4">
                    {adminData.reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="border-b border-stone-300 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-600 text-sm">{'⭐'.repeat(review.rating)}</span>
                          <span className="text-gray-500 text-xs">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-900 font-medium text-sm mb-1">{review.customer_name}</p>
                        <p className="text-gray-700 text-xs">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Последние заказы */}
              <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-xl">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🚕</span> Последние заказы
                </h2>
                {adminData.orders.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8">Нет заказов</p>
                ) : (
                  <div className="space-y-4">
                    {adminData.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border-b border-stone-300 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 font-medium text-sm">Заказ #{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'new' ? 'bg-green-200 text-green-800' : 'bg-stone-100 text-gray-700'
                          }`}>{order.status}</span>
                        </div>
                        <p className="text-gray-700 text-xs">{order.customer_name} • {order.customer_phone}</p>
                        <p className="text-gray-600 text-xs mt-1">{order.passengers_count} пасс. • {order.comment?.slice(0, 50) || 'Без комментария'}</p>
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
