// Vercel Serverless Function для получения всех отзывов
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Временно возвращаем пустой массив
    // В реальном приложении здесь будет запрос к базе данных
    const reviews = [];
    
    return res.status(200).json(reviews);
    
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
