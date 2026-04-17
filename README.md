Redpass — Secure Password Analyzer
Проект представляет собой веб-сервис для локальной оценки криптографической стойкости паролей и проверки на наличие утечек в базах данных. Проект построен с учетом требований конфиденциальности: благодаря использованию модели k-anonymity, реальные пароли пользователей не передаются третьим лицам в открытом виде или в виде полных хешей.

Ключевые возможности
Авторизация: Регистрация и вход по стандарту JWT (JSON Web Tokens).

Локальная оценка: Расчет энтропии и времени взлома пароля на основе алгоритмов библиотеки zxcvbn.

Проверка утечек: Интеграция с API Have I Been Pwned с использованием префиксов SHA-1 хешей (модель k-anonymity).

Управление историей: Сохранение проверенных паролей в маскированном виде с возможностью полного удаления истории пользователем.

Ограничение нагрузки: Защита API от брутфорса и снижение сетевой нагрузки посредством кеширования в Redis.

Клиентская часть: SPA на Vanilla JS и Tailwind CSS.

Технологический стек
Backend: Python 3.11, FastAPI, Pydantic

База данных и ORM: PostgreSQL, SQLAlchemy 2.0 (Async), Alembic

Кеширование и Rate Limit: Redis

Frontend: HTML5, Vanilla JS, Tailwind CSS

Инфраструктура: Docker, Docker Compose

Развертывание через Docker
Клонирование репозитория:

Bash
git clone https://github.com/your-username/redpass.git
cd redpass
Настройка переменных окружения:
Создайте файл .env в корне проекта и укажите доступы:

Фрагмент кода
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/redpass_db
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your_super_secret_jwt_key
Запуск контейнеров:

Bash
docker-compose up -d --build
Приложение будет доступно по адресу: http://127.0.0.1:8000

Локальная разработка (без Docker для бэкенда)

Запуск инфраструктуры (БД и Redis):

docker-compose up -d db redis
Создание и активация виртуального окружения:

python -m venv .venv
source .venv/bin/activate  # Для Windows: .venv\Scripts\activate

Установка зависимостей:

pip install -r requirements.txt

Запуск сервера:

uvicorn main:app --reload
Документация API
Интерактивная документация по стандарту OpenAPI генерируется автоматически и доступна после запуска сервера по следующим адресам:

Swagger UI: http://127.0.0.1:8000/docs

ReDoc: http://127.0.0.1:8000/redoc

