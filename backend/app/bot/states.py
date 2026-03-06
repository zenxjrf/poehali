"""
FSM состояния для бота
Используется для пошагового сбора данных заказа
"""
from aiogram.fsm.state import State, StatesGroup


class OrderForm(StatesGroup):
    """Состояния для формы заказа"""
    direction = State()      # Выбор направления
    passengers = State()     # Количество пассажиров
    name = State()           # Имя клиента
    phone = State()          # Телефон клиента
    call_time = State()      #Preferred время звонка
    comment = State()        # Комментарий к заказу
    location = State()       # Геолокация


class AdminForm(StatesGroup):
    """Состояния для админ-панели"""
    broadcast = State()      # Рассылка сообщений
    edit_price = State()     # Редактирование цены


class FeedbackForm(StatesGroup):
    """Состояния для формы отзыва"""
    rating = State()         # Оценка
    comment = State()        # Текст отзыва
