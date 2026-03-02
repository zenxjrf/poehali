// Vercel Serverless Function для Telegram Webhook
import crypto from 'crypto'

export default async function handler(req, res) {
  // Проверяем метод
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok' })
  }

  try {
    const { message, callback_query } = req.body
    
    // Обработка команды /start
    if (message && message.text === '/start') {
      const chatId = message.chat.id
      const userName = message.from.username || message.from.first_name
      
      // Отправляем приветственное сообщение
      await sendTelegramMessage(chatId, {
        text: `👋 *Здравствуйте!*\n\nЯ бот сервиса *Поехали* 🚕\nПомогу вам заказать такси из Ташкента в Фергану и обратно.\n\nНажмите кнопку ниже, чтобы открыть меню:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: "🚕 Открыть меню",
              web_app: { url: "https://poehali.vercel.app" }
            }],
            [{
              text: "📞 Позвонить",
              callback_data: "call_dispatcher"
            },
            {
              text: "💬 Написать", 
              url: "https://t.me/abdurasulovb"
            }]
          ]
        }
      })
      
      // Отправляем дополнительную информацию
      await sendTelegramMessage(chatId, {
        text: `🚕 *Поехали — Ваше такси Ташкент ↔ Фергана*\n\n📌 *Как заказать такси:*\n1️⃣ Нажмите кнопку «🚕 Открыть меню»\n2️⃣ Выберите направление поездки\n3️⃣ Заполните форму заявки\n4️⃣ Добавьте геолокацию (по желанию)\n5️⃣ Дождитесь звонка от диспетчера\n\n💰 *Стоимость:*\n• Поездка: 200 000 сум с человека\n• Посылки: от 60 000 сум\n\n⏱ *Время в пути:* ~4 часа\n🚗 *Комфорт:* Кондиционер, удобные сиденья\n\n✨ *Почему выбирают нас:*\n✓ Фиксированная цена\n✓ Проверенные водители\n✓ Подача в удобное время\n✓ Безопасность и комфорт\n\nНажмите кнопку ниже, чтобы начать:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: "🚕 Открыть меню",
            web_app: { url: "https://poehali.vercel.app" }
          }]]
        }
      })
    }
    
    // Обработка callback query
    if (callback_query && callback_query.data === "call_dispatcher") {
      await answerCallbackQuery(callback_query.id, {
        text: "📞 +998 94 136 54 74",
        show_alert: true
      })
    }
    
    return res.status(200).json({ status: 'ok' })
    
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Вспомогательные функции для работы с Telegram API
async function sendTelegramMessage(chatId, message) {
  const BOT_TOKEN = process.env.BOT_TOKEN || '8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ'
  
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      ...message
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`)
  }
  
  return response.json()
}

async function answerCallbackQuery(callbackQueryId, options) {
  const BOT_TOKEN = process.env.BOT_TOKEN || '8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ'
  
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...options
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to answer callback: ${response.statusText}`)
  }
  
  return response.json()
}
