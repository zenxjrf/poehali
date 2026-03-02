// Vercel Serverless Function для проверки здоровья API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      status: 'healthy',
      timestamp: Date.now(),
      version: '1.0.0'
    });
    
  } catch (error) {
    console.error('Ошибка проверки здоровья:', error);
    return res.status(500).json({
      status: 'unhealthy',
      message: 'Ошибка сервера'
    });
  }
}
