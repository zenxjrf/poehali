import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const DISPATCHER_USERNAME = 'fakertop'

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
    }, 1000)
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
      // Устанавливаем цену по умолчанию
      setTrip({ id: 1, direction, price: 15000 })
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
      console.warn('Не удалось сохранить язык в localStorage:', error)
    }
  }

  const directionLabels = {
    tashkent_fergana: safeGet(t, 'directions.tashkent_fergana', 'Ташкент → Фергана'),
    fergana_tashkent: safeGet(t, 'directions.fergana_tashkent', 'Фергана → Ташкент')
  }

  // Цена: 15000 с человека + почта от 60000
  const basePrice = 15000
  const mailPrice = 60000

  // Preloader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#4a4a4a] border-t-[#6b6b6b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8a8a8a] text-sm font-medium">Poehali</p>
        </div>
      </div>
    )
  }

  // Главный экран
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4 flex flex-col">
        {/* Версия */}
        <div className="absolute top-4 left-4">
          <span className="text-xs text-[#5a5a5a] font-mono">VER 1.1 [Beta]</span>
        </div>

        {/* Переключатель языка */}
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-[#8a8a8a]"
        >
          {language === 'ru' ? 'UZ' : 'RU'}
        </button>

        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#e0e0e0] mb-1">Poehali</h1>
            <p className="text-[#6b6b6b] text-sm">Ташкент ↔ Фергана</p>
          </div>

          {/* Цена */}
          <div className="bg-[#2a2a2a] rounded-2xl p-6 mb-6 border border-[#3a3a3a]">
            <div className="text-center">
              <p className="text-[#6b6b6b] text-xs mb-2 uppercase tracking-wide">Стоимость</p>
              <div className="mb-4">
                <p className="text-3xl font-bold text-[#e0e0e0]">{basePrice.toLocaleString()} сум</p>
                <p className="text-[#6b6b6b] text-xs mt-1">с человека</p>
              </div>
              <div className="border-t border-[#3a3a3a] pt-4">
                <p className="text-[#8a8a8a] text-xs">Посылки от <span className="text-[#e0e0e0] font-semibold">{mailPrice.toLocaleString()} сум</span></p>
              </div>
            </div>
          </div>

          {/* Направление */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setDirection('tashkent_fergana')}
              className={`w-full py-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'tashkent_fergana'
                  ? 'bg-[#4a4a4a] text-[#e0e0e0]'
                  : 'bg-[#2a2a2a] text-[#8a8a8a] hover:bg-[#3a3a3a]'
              }`}
            >
              📍 {directionLabels.tashkent_fergana}
            </button>

            <button
              onClick={() => setDirection('fergana_tashkent')}
              className={`w-full py-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'fergana_tashkent'
                  ? 'bg-[#4a4a4a] text-[#e0e0e0]'
                  : 'bg-[#2a2a2a] text-[#8a8a8a] hover:bg-[#3a3a3a]'
              }`}
            >
              📍 {directionLabels.fergana_tashkent}
            </button>
          </div>

          {/* Кнопки */}
          <div className="space-y-3 mt-auto">
            <button
              onClick={() => setCurrentView('order')}
              className="w-full bg-[#4a4a4a] text-[#e0e0e0] py-4 rounded-xl font-medium hover:bg-[#5a5a5a] transition-all text-sm"
            >
              📞 Оставить заявку
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCall}
                className="bg-[#2a2a2a] text-[#e0e0e0] py-4 rounded-xl font-medium hover:bg-[#3a3a3a] transition-all text-sm"
              >
                📞 Позвонить
              </button>
              <button
                onClick={handleMessage}
                className="bg-[#2a2a2a] text-[#e0e0e0] py-4 rounded-xl font-medium hover:bg-[#3a3a3a] transition-all text-sm"
              >
                💬 Написать
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
      <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] p-4">
        <div className="max-w-md mx-auto">
          {/* Переключатель языка */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="text-[#6b6b6b] hover:text-[#8a8a8a]"
            >
              ← Назад
            </button>
            <h1 className="text-base font-medium">Заявка на поездку</h1>
            <button
              onClick={toggleLanguage}
              className="bg-[#2a2a2a] px-3 py-1 rounded-lg text-xs font-semibold text-[#8a8a8a]"
            >
              {language === 'ru' ? 'UZ' : 'RU'}
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-8 rounded-2xl text-center">
              <p className="text-3xl mb-4">✅</p>
              <h2 className="text-lg font-medium mb-2 text-[#e0e0e0]">Заявка отправлена!</h2>
              <p className="text-[#6b6b6b] text-sm mb-4">Мы перезвоним вам в течение 5 минут.</p>
              <button
                onClick={() => {
                  setSubmitStatus(null)
                  setCurrentView('home')
                }}
                className="bg-[#4a4a4a] text-[#e0e0e0] px-6 py-2.5 rounded-xl text-sm font-medium"
              >
                Вернуться в меню
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#2a2a2a] rounded-2xl p-5 border border-[#3a3a3a] space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Направление</label>
                <div className="bg-[#1a1a1a] p-3 rounded-xl text-[#e0e0e0] text-sm">
                  {directionLabels[direction]}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Ваше имя</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#4a4a4a]"
                  placeholder="Введите имя"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Номер телефона</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#4a4a4a]"
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Удобное время для звонка</label>
                <input
                  type="text"
                  value={formData.preferred_call_time}
                  onChange={(e) => setFormData({...formData, preferred_call_time: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#4a4a4a]"
                  placeholder="Например: с 9:00 до 18:00"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Количество пассажиров</label>
                <select
                  value={formData.passengers_count}
                  onChange={(e) => setFormData({...formData, passengers_count: parseInt(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#4a4a4a]"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#6b6b6b] mb-2">Комментарий</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 text-[#e0e0e0] text-sm focus:outline-none focus:border-[#4a4a4a]"
                  placeholder="Пожелания к поездке"
                  rows="3"
                />
              </div>

              {submitStatus === 'error' && (
                <div className="bg-[#3a2a2a] border border-[#4a3a3a] text-[#c97a7a] px-4 py-3 rounded-xl text-xs">
                  Ошибка при отправке заявки. Пожалуйста, попробуйте ещё раз.
                </div>
              )}

              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-[#4a4a4a] text-[#e0e0e0] py-4 rounded-xl font-medium hover:bg-[#5a5a5a] transition-all disabled:opacity-50 text-sm"
              >
                {submitStatus === 'loading' ? 'Отправка...' : '📞 Отправить заявку'}
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
