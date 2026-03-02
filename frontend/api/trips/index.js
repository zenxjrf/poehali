// Vercel Serverless Function для получения всех поездок
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Базовая информация о поездках
    const trips = [
      {
        id: 1,
        direction: 'tashkent_fergana',
        price: 150000,
        duration: '4 часа',
        available: true
      },
      {
        id: 2,
        direction: 'fergana_tashkent',
        price: 150000,
        duration: '4 часа',
        available: true
      }
    ];
    
    return res.status(200).json(trips);
    
  } catch (error) {
    console.error('Ошибка получения поездок:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
