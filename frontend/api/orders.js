// Vercel Serverless Function для обработки заказов
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderData = req.body;
    
    // Здесь должна быть логика сохранения в базу данных
    // Временно просто логируем и возвращаем успех
    
    console.log('Новый заказ:', orderData);
    
    // Отправка уведомления в Telegram (если нужно)
    // await sendTelegramNotification(orderData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Заявка принята',
      order_id: Date.now() // Временный ID
    });
    
  } catch (error) {
    console.error('Ошибка обработки заказа:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
