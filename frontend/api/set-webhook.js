// Установка webhook для Telegram бота
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN || '8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ'
    const WEBHOOK_URL = 'https://poehali.vercel.app/api/telegram'
    
    console.log('Setting webhook:', WEBHOOK_URL)
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query']
      })
    })
    
    const result = await response.json()
    
    if (result.ok) {
      console.log('Webhook set successfully:', result)
      return res.status(200).json({ 
        success: true, 
        webhook_url: WEBHOOK_URL,
        result 
      })
    } else {
      console.error('Failed to set webhook:', result)
      return res.status(500).json({ 
        success: false, 
        error: result 
      })
    }
    
  } catch (error) {
    console.error('Webhook setup error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
