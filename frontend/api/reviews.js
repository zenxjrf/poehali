// Vercel Serverless Function для обработки отзывов
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reviewData = req.body;
    
    // Здесь должна быть логика сохранения в базу данных
    // Временно просто логируем и возвращаем успех
    
    console.log('Новый отзыв:', reviewData);
    
    // Отправка уведомления в Telegram (если нужно)
    // await sendTelegramNotification(reviewData);
    
    return res.status(200).json({
      status: 'success',
      message: 'Отзыв принят',
      review_id: Date.now() // Временный ID
    });
    
  } catch (error) {
    console.error('Ошибка обработки отзыва:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
