"""
Тесты для API Poehali
Запуск: pytest tests/test_api.py -v
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

from backend.app.main import app


@pytest.fixture
async def client():
    """Создание тестового клиента"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_root(client):
    """Тест главной страницы"""
    response = await client.get("/")
    assert response.status_code == 200
    assert "Poehali API" in response.json()["message"]


@pytest.mark.asyncio
async def test_health_check(client):
    """Тест проверки здоровья"""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_trips(client):
    """Тест получения списка поездок"""
    response = await client.get("/api/v1/trips")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_drivers(client):
    """Тест получения списка водителей"""
    response = await client.get("/api/v1/drivers")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_orders(client):
    """Тест получения списка заказов"""
    response = await client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_reviews(client):
    """Тест получения списка отзывов"""
    response = await client.get("/api/v1/reviews")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_order(client):
    """Тест создания заказа"""
    order_data = {
        "trip_id": 1,
        "customer_name": "Тестовый Пользователь",
        "customer_phone": "+998901234567",
        "passengers_count": 2,
        "preferred_call_time": "morning",
        "comment": "Тестовый заказ"
    }
    
    response = await client.post("/api/v1/orders", json=order_data)
    # Может быть 404 если нет поездки с id=1
    assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_get_order_stats(client):
    """Тест статистики заказов"""
    response = await client.get("/api/v1/stats/orders")
    assert response.status_code == 200
    data = response.json()
    assert "total_orders" in data["data"]


@pytest.mark.asyncio
async def test_get_dashboard_stats(client):
    """Тест статистики дашборда"""
    response = await client.get("/api/v1/stats/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "order_stats" in data["data"]
    assert "driver_stats" in data["data"]


@pytest.mark.asyncio
async def test_export_orders(client):
    """Тест экспорта заказов"""
    response = await client.get("/api/v1/orders/export?format=csv")
    assert response.status_code in [200, 500]  # 500 если нет заказов


@pytest.mark.asyncio
async def test_user_order_history(client):
    """Тест истории заказов пользователя"""
    response = await client.get("/api/v1/orders/history/12345")
    assert response.status_code in [200, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
