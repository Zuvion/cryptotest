# CRYPTEXA Exchange - Telegram Mini App

## Overview
CRYPTEXA is a Telegram Mini App — a cryptocurrency trading and wallet management platform. Users can manage crypto wallets, deposit/withdraw USDT, exchange cryptocurrencies, trade binary options, invite friends via referral program, and access customer support — all within Telegram.

## User Preferences
- Всегда пиши на русском
- Подробные объяснения
- Итеративная разработка
- Спрашивай перед крупными изменениями

## Project Structure
```
main.py              — Backend (FastAPI, все API, бот, торговля)
templates/base.html  — HTML шаблон
static/js/app.js     — Frontend (Vanilla JS + Telegram WebApp SDK)
static/css/style.css  — Стили (Binance-style dark theme)
static/img/           — Логотипы и иконки
static/uploads/       — Пользовательские файлы (поддержка)
i18n/translations.json — Переводы (RU/EN)
requirements.txt      — Python зависимости
railway.json          — Конфиг деплоя Railway
.env.example          — Пример переменных окружения
```

## Tech Stack
- **Backend**: FastAPI (Python), PostgreSQL (async SQLAlchemy)
- **Frontend**: Vanilla JavaScript, Telegram WebApp SDK, TradingView Lightweight Charts
- **APIs**: OKX (цены/свечи), OxaPay (депозиты, white-label V1), xRocket (депозиты через Telegram-бота), CoinMarketCap (курсы), Telegram Bot API

## Environment Variables
- `BOT_TOKEN` — Telegram Bot Token
- `ADMIN_ID` — Telegram ID администратора
- `ADMIN_API_KEY` — API ключ для внешней админ-панели (header `X-Admin-API-Key`)
- `CMC_API_KEY` — CoinMarketCap API ключ
- `OXAPAY_API_KEY` — OxaPay General API Key (обмены)
- `OXAPAY_MERCHANT_KEY` — OxaPay Merchant API Key (приём платежей, white-label)
- `XROCKET_API_KEY` — xRocket API Key (депозиты через @xRocket бота)
- `DATABASE_URL` — PostgreSQL connection string

## Key Features
- **Кошелёк**: 10 криптовалют, реальные цены OKX, индивидуальные балансы
- **Депозиты**: Два метода: xRocket (через Telegram-бота, 12 валют) + OxaPay white-label (12 монет, адрес+QR), комиссия 0%
- **Вывод**: USDT на крипто-адрес (TRC20/ERC20/BEP20/SOL/TON), мин. 10 USDT, комиссия 0%
- **Обмен**: Крипто-крипто обмен по курсам OKX, комиссия 2%
- **Торговля**: Бинарные опционы 30с-30м, реальные цены, 70% выплата (на balance_usdt)
- **Рефералы**: 5% бонус от первого депозита приглашённого
- **Поддержка**: Чат с админом в реальном времени
- **Lucky Mode**: Принудительные выигрыши по-пользовательски (настраивается через отдельную админ-панель)
- **Подарочные чеки**: Создание чеков через /check_create
- **Админ-панель**: Встроена в приложение (tab Профиль для admin). Dashboard, управление пользователями, Lucky Mode, выводы, рассылка, чеки, логи

## Business Logic
- **Баланс**: `balance_usdt` для USDT, `wallets` (JSON dict) для остальных криптовалют. Депозиты зачисляются в валюте пополнения (BTC→wallets["BTC"], ETH→wallets["ETH"], USDT→balance_usdt). Вывод, торговля, чеки работают с balance_usdt. Обмен работает с обоими (wallets и balance_usdt). Колонка `virtual_balance` сохранена в БД, но обнулена и больше не используется.
- **Сделки (predetermined_result)**: Результат определяется ПРИ СОЗДАНИИ сделки (random < win_rate → WIN). `custom_win_rate` per user (0.0-1.0), дефолт 73%. При закрытии — используется predetermined_result. Chart manipulation: `_t` (trend) в API active trades, `priceOffset`/`returningToReal` в JS для визуального подтверждения.
- **Lucky Mode**: Если включен для пользователя — гарантированный WIN (100% win rate).
- **Маркеры графика**: Закрытые сделки (WIN/LOSS) отображаются 5 минут после закрытия, затем исчезают.
- **Комиссии**: Депозит 0%, Вывод 0%, Обмен 2%, Торговля 2%.
- **Вывод**: Списывается напрямую из balance_usdt. WithdrawPayload: {amount, currency, address, network}.

## xRocket Integration
- **API**: `https://pay.xrocket.tg`, header `Rocket-Pay-Key`
- **Create invoice**: POST `/tg-invoices` → returns `{success, data: {id, link}}`
- **Check invoice**: GET `/tg-invoices/{id}` → returns `{success, data: {status}}`
- **Webhook**: POST `/api/xrocket/webhook` — callback при оплате
- **Invoice ID**: хранится как `xrocket_{id}` в `Transaction.details["invoice_id"]`
- **Валюты**: USDT, TON, BTC, ETH, BNB, USDC, SOL, DOGE, LTC, TRX, NOT, DOGS

## OxaPay Integration
- **Депозиты**: White-label V1 API `https://api.oxapay.com/v1/payment/white-label`, header `merchant_api_key`
- **Status check**: Legacy `https://api.oxapay.com/merchants/inquiry` с `{merchant, trackId}`
- **Webhook**: HMAC-SHA512 подпись обязательна, 403 при неверной подписи
- **Track ID**: хранится как `oxapay_{track_id}` в `Transaction.details["invoice_id"]`

## Admin API (External Panel)
- **Auth**: header `X-Admin-API-Key` == `ADMIN_API_KEY` env variable
- **CORS**: `ADMIN_PANEL_URL` env variable добавляется в allowed origins
- **Endpoints**:
  - `GET /api/admin/health` — проверка подключения (возвращает app name, version, admin_id)
  - `GET /api/admin/dashboard` — расширенная статистика (users, deposits today/week/month, active trades, total balance)
  - `GET /api/admin/stats` — краткая статистика (total_users, online_count, deposits, withdrawals, trades)
  - `GET /api/admin/online-count` — кол-во онлайн + список пользователей
  - `GET /api/admin/users?page=1&limit=20&search=&filter=` — список пользователей (filter: premium/blocked/verified/with_balance)
  - `GET /api/admin/user/{profile_id}` — детали пользователя + транзакции + сделки + выводы + wallets
  - `POST /api/admin/user/{profile_id}/balance` — изменить баланс (body: `{action: "add"|"subtract"|"set", amount: float}`)
  - `POST /api/admin/user/{profile_id}/status` — статус пользователя (body: `{action: "verify"|"premium"|"block"|"unblock", reason?: string}`)
  - `POST /api/admin/user/{profile_id}/winrate` — установить custom_win_rate (body: `{custom_win_rate: 0.0-1.0 | null}`)
  - `POST /api/admin/user/{profile_id}/message` — отправить сообщение через бот (body: `{text: string}`)
  - `GET /api/admin/lucky/users?search=&filter=on|off&page=1` — список Lucky Mode пользователей
  - `POST /api/admin/lucky/set` — настроить Lucky Mode (body: `{target_telegram_id, enabled, reason, until?, max_wins?}`)
  - `GET /api/admin/lucky/history/{profile_id}` — история Lucky Mode изменений
  - `POST /api/admin/trades/{trade_id}/override-result` — переопределить результат сделки (body: `{result: "win"|"loss"}`)
  - `GET /api/admin/withdrawals?status=pending&page=1&limit=20` — выводы (status: pending/completed/cancelled/all)
  - `POST /api/admin/withdrawal/{wd_id}/action` — одобрить/отклонить вывод (body: `{action: "approve"|"reject", reason?: string}`)
  - `POST /api/admin/broadcast` — рассылка (body: `{text: string, filter?: "premium"|"verified"|"with_balance"}`)
  - `POST /api/admin/check/create` — создать подарочный чек (body: `{amount_usdt: float, expires_in_hours?: int}`)
  - `GET /api/admin/logs?page=1&limit=50` — логи действий админа
  - `GET /api/admin/chat/unread` — непрочитанные сообщения поддержки
  - `GET /api/admin/chat/{user_id}` — история чата с пользователем
  - `POST /api/admin/chat/{user_id}/send` — отправить сообщение (body: `{message: string}`)
- **Tracking**: `last_online_at` обновляется через middleware (кэш 60с), online = last_online_at >= 5 мин назад
- **Response format**: `{ok: true, ...}` или `{ok: false, error: "..."}`. Chat endpoints: `{success: true, data: {...}}`

## DB Schema Notes
- Withdrawal model: `amount_rub` = сумма USDT, `card_number` = сокращённый адрес, `full_name` = network
- `AdminChat` table: user_id, message_text, is_from_admin, read, created_at
- `custom_win_rate` (Float, nullable) и `last_online_at` (DateTime, nullable) в User model
- Колонки `balance_rub`, `preferred_fiat`, `virtual_balance` в User model остались, но не используются (virtual_balance обнулён миграцией merge_virtual_balance)

## UI Theme
Dark cyberpunk-glass: #0A0E17 (фон), #131A2A (карточки), #E040FB (акцент), #7C4DFF (акцент2), #00E676 (рост), #FF5252 (падение). Стеклянные карточки с backdrop-filter blur. Градиентные кнопки #E040FB→#7C4DFF. Логотип: SVG градиент фиолетовый.

## Navbar
Floating pill (bottom: 12px, border-radius: 24px, max-width: 440px). SVG stroke-иконки (wallet/chart/users/user) с `currentColor`. Неактивные: `#5A6577`, активные: `#E040FB` + drop-shadow. `pointer-events: none` на дочерних элементах для корректной кликабельности всего nav-item. Плавные анимации переходов (fade+slide). Стеклянный фон с backdrop-filter blur.

## Chart Markers
- Активные сделки: стрелка на свече входа + горизонтальная пунктирная линия цены
- Закрытые сделки: кружки WIN/LOSS с цветовым кодированием
- Привязка маркеров к свечам через snapToCandle (UTC timezone fix)

## i18n System
- **Файл переводов**: `i18n/translations.json` — 419 ключей RU + 419 ключей EN
- **Функция перевода**: `t('key')` — возвращает строку на текущем языке
- **Переключение**: Кнопка 🌐 в настройках, сохраняется в localStorage
- **Охват**: ВСЕ пользовательские строки переведены — кошелёк, торговля, депозит, вывод, обмен, рефералы, профиль, поддержка, уведомления, подарочные чеки, админ-панель

## Recent Changes (March 2026)
- **Единый баланс**: Убран virtual_balance — теперь только balance_usdt + wallets. Депозиты зачисляются в валюте пополнения (BTC→wallets["BTC"], USDT→balance_usdt). Миграция merge_virtual_balance переносит остатки. Убрана smart deduction логика. Реферальный бонус рассчитывается по USDT-эквиваленту депозита
- **Admin API для внешней панели**: ADMIN_API_KEY auth, новые endpoints (stats, online-count, winrate, trade override, chat)
- **predetermined_result**: результат сделки определяется при создании (win_rate = custom_win_rate || 0.73)
- **custom_win_rate**: per-user настройка вероятности выигрыша (0.0-1.0)
- **last_online_at**: tracking онлайн-статуса через middleware (кэш 60с)
- **AdminChat**: таблица для чата поддержки через внешнюю админ-панель
- **safe_migrate()**: каждая миграция в отдельной транзакции — устойчивость к ошибкам
- **Полная i18n-адаптация**: все хардкод-строки заменены на t() вызовы — русский и английский полностью
- Добавлен xRocket как метод депозита (выбор: xRocket или крипто-адрес OxaPay)
- Удалён CryptoBot
- Удалён рублёвый вывод на карту — вывод теперь только на крипто-адрес (USDT)
- Удалён выбор fiat валюты (RUB/BYN/UAH) из настроек и обмена
- Обмен теперь только крипто-крипто (без фиатных пар)
