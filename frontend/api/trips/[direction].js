// Vercel Serverless Function для получения информации о поездках
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { direction } = req.query;
    
    // Базовая информация о поездках
    const trips = {
      tashkent_fergana: {
        id: 1,
        direction: 'tashkent_fergana',
        price: 150000,
        duration: '4 часа',
        available: true
      },
      fergana_tashkent: {
        id: 2,
        direction: 'fergana_tashkent',
        price: 150000,
        duration: '4 часа',
        available: true
      }
    };
    
    const trip = trips[direction];
    
    if (!trip) {
      return res.status(404).json({ error: 'Поездка не найдена' });
    }
    
    return res.status(200).json(trip);
    
  } catch (error) {
    console.error('Ошибка получения поездки:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера'
    });
  }
}
