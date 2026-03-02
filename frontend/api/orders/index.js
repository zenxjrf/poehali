// Vercel Serverless Function для получения всех заказов
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Временно возвращаем пустой массив
    // В реальном приложении здесь будет запрос к базе данных
    const orders = [];
    
    return res.status(200).json(orders);
    
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
