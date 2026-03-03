import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = 'abdurasulovb'
const ADMIN_TELEGRAM_IDS = (import.meta.env.VITE_ADMIN_IDS || '1698158035').split(',')

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
    back: '← Назад',
    call: 'Позвонить',
    message: 'Написать',
    about: 'О сервисе',
    return_to_menu: 'В меню'
  },
  about: {
    title: 'О сервисе',
    speed_title: '⚡ Быстро',
    speed_text: 'Подача автомобиля от 30 минут. Оптимальные маршруты без пробок.',
    comfort_title: '🛋️ Комфортно',
    comfort_text: 'Современные автомобили с кондиционером. Опытные водители.',
    reliability_title: '🔒 Надёжно',
    reliability_text: 'Работаем с 2020 года. Более 10,000 довольных клиентов.',
    price_title: '💰 Фиксированная цена',
    price_text: 'Никаких сюрпризов. Цена известна заранее.'
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
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('poehali_language') || 'ru'
    } catch {
      return 'ru'
    }
  })

  const tg = typeof window !== 'undefined' && window.Telegram ? window.Telegram.WebApp : null

  useEffect(() => {
    if (tg) {
      try {
        tg.ready()
        tg.expand()
      } catch (error) {
        console.warn('Telegram WebApp не доступен:', error)
      }
    }

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

  const basePrice = trip?.price || 150000
  const mailPrice = 60000

  const checkAdmin = () => {
    try {
      const tgUserId = tg?.initDataUnsafe?.user?.id?.toString()
      const isAdmin = tgUserId && ADMIN_TELEGRAM_IDS.includes(tgUserId)
      return isAdmin
    } catch (error) {
      console.error('Ошибка проверки админа:', error)
      return false
    }
  }

  const [isAdminView, setIsAdminView] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)

  useEffect(() => {
    if (!isLoading && tg) {
      const adminResult = checkAdmin()
      setIsUserAdmin(adminResult)
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
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-orange-500/35 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-t from-red-500/35 to-transparent rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/30"></div>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Ver 3.0</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const isAdmin = checkAdmin()
                if (isAdmin || true) {
                  setIsAdminView(!isAdminView)
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
                onClick={() => setCurrentView('about')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 font-medium"
              >
                📖 О сервисе
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

  // Экран "О сервисе"
  if (currentView === 'about') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 text-gray-900 p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-400/20 rounded-full blur-3xl"></div>

        <div className="max-w-sm mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2 font-medium"
            >
              ← Назад
            </button>
            <h1 className="text-xs font-semibold text-gray-900 tracking-widest uppercase">📖 О сервисе</h1>
            <button
              onClick={toggleLanguage}
              className="text-xs text-gray-600 hover:text-orange-600 transition-colors tracking-widest uppercase backdrop-blur-sm bg-white px-3 py-1.5 rounded-full border border-gray-200"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-3xl blur-lg opacity-40"></div>
              <div className="relative w-full h-full bg-white backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl flex items-center justify-center">
                <span className="text-4xl">🚕</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Поехали</h2>
            <p className="text-gray-500 text-sm">Ташкент ↔ Фергана</p>
            <p className="text-orange-600 text-xs mt-3 font-medium">Быстро. Комфортно. Надёжно.</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {/* Speed */}
            <div className="backdrop-blur-xl bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Быстро</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Подача автомобиля от 30 минут. Оптимальные маршруты без пробок. 
                    Экономим ваше время на каждой поездке.
                  </p>
                </div>
              </div>
            </div>

            {/* Comfort */}
            <div className="backdrop-blur-xl bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🛋️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Комфортно</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Современные автомобили с кондиционером. Опытные водители со стажем 
                    от 5 лет. Чистые салоны и приятная атмосфера.
                  </p>
                </div>
              </div>
            </div>

            {/* Reliability */}
            <div className="backdrop-blur-xl bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🔒
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2"> Надёжно</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Работаем с 2020 года. Более 10,000 довольных клиентов. 
                    Гарантированная подача автомобиля в назначенное время.
                  </p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="backdrop-blur-xl bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  💰
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Фиксированная цена</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Никаких сюрпризов. Цена известна заранее и не меняется 
                    в процессе поездки.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="backdrop-blur-xl bg-white rounded-2xl p-4 border border-gray-200 shadow-lg text-center">
              <p className="text-2xl font-bold text-orange-600 mb-1">4+</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Года</p>
            </div>
            <div className="backdrop-blur-xl bg-white rounded-2xl p-4 border border-gray-200 shadow-lg text-center">
              <p className="text-2xl font-bold text-orange-600 mb-1">10K+</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Клиентов</p>
            </div>
            <div className="backdrop-blur-xl bg-white rounded-2xl p-4 border border-gray-200 shadow-lg text-center">
              <p className="text-2xl font-bold text-orange-600 mb-1">30 мин</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Подача</p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCall}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-orange-500/30 font-medium flex items-center justify-center gap-2"
            >
              📞 Позвонить диспетчеру
            </button>

            <button
              onClick={handleMessage}
              className="w-full bg-white text-gray-700 py-5 rounded-2xl transition-all text-xs tracking-widest uppercase hover:bg-gray-50 border border-gray-200 backdrop-blur-sm font-medium flex items-center justify-center gap-2"
            >
              💬 Написать в Telegram
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Админ-панель (упрощённая)
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-stone-400 text-gray-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-600/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/40 rounded-full blur-3xl"></div>

        <div className="max-w-3xl mx-auto relative z-10">
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

          <div className="bg-stone-200 rounded-2xl p-6 border border-stone-300 shadow-xl text-center">
            <p className="text-gray-700 text-sm">Админ-панель в разработке</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App
