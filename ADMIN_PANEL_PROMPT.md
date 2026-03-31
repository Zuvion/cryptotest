# ПРОМТ: Создание админ-панели CRYPTEXA

## Общее описание

Создай **полноценную веб-админ-панель** для управления крипто-биржей CRYPTEXA. Это **отдельное приложение** (отдельный репозиторий), которое подключается к backend CRYPTEXA через REST API. Оба приложения работают на Railway 24/7.

**Стек**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
**Деплой**: Railway (отдельный сервис)
**Авторизация**: Один админ, пароль хранится в `ADMIN_PASSWORD` env. При логине — сессия через JWT (localStorage). При каждом запросе к CRYPTEXA API — header `X-Admin-API-Key`.

---

## Переменные окружения

```
CRYPTEXA_API_URL=https://your-cryptexa-app.railway.app   # URL бэкенда CRYPTEXA
ADMIN_API_KEY=your_64_char_hex_key                        # API ключ для X-Admin-API-Key header
ADMIN_PASSWORD=your_admin_password                        # Пароль для входа в панель
JWT_SECRET=your_jwt_secret                                # Секрет для JWT токенов сессии
```

---

## Авторизация и безопасность

1. Страница логина: поле пароля → сравнение с `ADMIN_PASSWORD` → генерация JWT → сохранение в localStorage
2. Все страницы защищены — без JWT редирект на логин
3. JWT проверяется на собственном backend (простой Express/Fastify сервер, который проксирует запросы к CRYPTEXA API и добавляет `X-Admin-API-Key` header)
4. **ADMIN_API_KEY никогда не попадает на фронтенд** — только backend-прокси знает ключ
5. Кнопка выхода — очистка JWT, редирект на логин

---

## Архитектура

```
admin-panel/
├── src/
│   ├── components/        # UI компоненты
│   ├── pages/             # Страницы
│   ├── hooks/             # React hooks
│   ├── lib/               # API client, utils
│   ├── types/             # TypeScript типы
│   └── App.tsx            # Router
├── server/
│   └── index.ts           # Express proxy server (добавляет X-Admin-API-Key)
├── .env.example
└── package.json
```

**Proxy server** (Express):
- `POST /auth/login` — проверка пароля, выдача JWT
- `GET/POST /proxy/admin/*` — проксирование запросов к `CRYPTEXA_API_URL/api/admin/*` с header `X-Admin-API-Key`
- Проверка JWT на каждом `/proxy/*` запросе

---

## Дизайн

Тёмная тема, профессиональная — стиль Binance Admin / CRM dashboard:
- **Фон**: `#0f1117` (основной), `#1a1d29` (карточки)
- **Акцент**: `#8b5cf6` (фиолетовый), `#10b981` (зелёный/рост), `#ef4444` (красный/падение)
- **Текст**: `#e2e8f0` (основной), `#94a3b8` (вторичный)
- Sidebar навигация слева (collapsible)
- Адаптивный — работает на планшете и десктопе

---

## Страницы и функционал

### 1. Dashboard (`/`)
Главная страница со статистиками.

**API**: `GET /api/admin/dashboard` + `GET /api/admin/stats` + `GET /api/admin/online-count`

Карточки:
- Всего пользователей (total_users)
- Онлайн сейчас (online_count) — с зелёным индикатором
- Депозиты сегодня / неделя / месяц (deposits_today/week/month) в USDT
- Активные сделки (active_trades)
- Ожидающие выводы (pending_withdrawals) — с красным badge если > 0
- Общий баланс платформы (total_balance) в USDT

Дополнительно:
- Список онлайн-пользователей (из online-count endpoint)
- Автообновление каждые 30 секунд

---

### 2. Пользователи (`/users`)
Список и управление пользователями.

**API**: `GET /api/admin/users?page=1&limit=20&search=&filter=`

**Таблица пользователей:**
| Profile ID | Username | Telegram ID | Баланс USDT | Статус | Win Rate | Онлайн | Действия |
|---|---|---|---|---|---|---|---|

- **Поиск**: по username, telegram_id, profile_id
- **Фильтры**: все / premium / verified / blocked / с балансом
- **Пагинация**: page + limit
- **Badges**: ⭐ premium, ✅ verified, 🚫 blocked, 🍀 lucky mode
- **Ссылка на Telegram**: `tg://user?id={telegram_id}` (кликабельная)
- **Клик по строке** → детальная страница пользователя

---

### 3. Детали пользователя (`/users/:profileId`)
Полная информация о конкретном пользователе.

**API**: `GET /api/admin/user/{profile_id}`

**Блоки:**

**Профиль:**
- Profile ID, Telegram ID (ссылка), Username, язык
- Баланс USDT + крипто-кошельки (wallets JSON — показать каждую валюту)
- Реферальный код, реф. доход, кол-во рефералов, кем приглашён
- Верификация, Premium, блокировка (причина)
- Win Rate (custom_win_rate или "По умолчанию 73%")
- Lucky Mode статус (вкл/выкл, до какого числа, макс. побед, использовано)
- Дата регистрации, последний онлайн

**Действия (кнопки):**
- 💰 **Изменить баланс** — модалка: действие (add/subtract/set) + сумма
  - `POST /api/admin/user/{profile_id}/balance` body: `{action, amount}`
- 🎯 **Установить Win Rate** — модалка: ввод 0-100% или "Сбросить"
  - `POST /api/admin/user/{profile_id}/winrate` body: `{custom_win_rate: 0.0-1.0 | null}`
- ✅/🚫 **Верификация / Premium / Блокировка** — toggle-кнопки
  - `POST /api/admin/user/{profile_id}/status` body: `{action: "verify"|"premium"|"block"|"unblock", reason?}`
- 💬 **Отправить сообщение** — модалка с текстовым полем (через бот в Telegram)
  - `POST /api/admin/user/{profile_id}/message` body: `{text}`

**Таблицы истории:**
- Транзакции (тип, сумма, валюта, статус, дата) — из response.transactions
- Сделки (пара, сторона, сумма, результат, выплата, дата) — из response.trades
- Выводы (сумма, адрес, сеть, статус, дата) — из response.withdrawals

---

### 4. Lucky Mode (`/lucky`)
Управление гарантированными выигрышами.

**API**: `GET /api/admin/lucky/users` + `POST /api/admin/lucky/set` + `GET /api/admin/lucky/history/{profile_id}`

**Таблица:**
| Profile ID | Username | Баланс | Lucky Mode | До | Макс. побед | Использовано |

**Фильтры**: все / включён / выключен
**Поиск**: по telegram_id, username

**Включение Lucky Mode** — модалка:
- Telegram ID пользователя
- Причина (обязательно!)
- Срок действия (дата или "бессрочно")
- Максимум побед (число или "без лимита")
- Body: `{target_telegram_id, enabled: true, reason, until?, max_wins?}`

**Выключение** — подтверждение + причина
- Body: `{target_telegram_id, enabled: false, reason}`

**История изменений** — по кнопке, для каждого пользователя
- Показывает кто, когда, что изменил и по какой причине

---

### 5. Сделки — Override (`/trades`)
Переопределение результата активных сделок.

**API**: `POST /api/admin/trades/{trade_id}/override-result` body: `{result: "win"|"loss"}`

Показывать активные сделки (из dashboard/stats) + форма:
- Ввод Trade ID
- Выбор результата: WIN / LOSS
- Кнопка "Переопределить" с подтверждением

**Бизнес-логика**: 
- Работает ТОЛЬКО с активными сделками (status = "active")
- Меняет `predetermined_result` — при закрытии сделки используется этот результат
- WIN: пользователь получает ставку × 1.7 на balance_usdt
- LOSS: пользователь теряет ставку

---

### 6. Выводы (`/withdrawals`)
Модерация запросов на вывод USDT.

**API**: `GET /api/admin/withdrawals?status=pending&page=1&limit=20`

**Таблица:**
| ID | Пользователь | Сумма USDT | Адрес | Сеть | Статус | Дата | Действия |

**Фильтр по статусу**: pending / completed / cancelled / all

**Действия** для pending-выводов:
- ✅ **Одобрить** — `POST /api/admin/withdrawal/{wd_id}/action` body: `{action: "approve"}`
- ❌ **Отклонить** — модалка с причиной → body: `{action: "reject", reason: "..."}`
  - При отклонении деньги автоматически возвращаются на баланс пользователя

**Поля Withdrawal модели**:
- `amount_rub` = сумма в USDT (legacy название поля)
- `card_number` = крипто-адрес (сокращённый)
- `full_name` = сеть (TRC20/ERC20/BEP20/SOL/TON)
- `usdt_required` = сколько USDT списано

---

### 7. Рассылка (`/broadcast`)
Массовая отправка сообщений через Telegram-бот.

**API**: `POST /api/admin/broadcast` body: `{text, filter?}`

- Текстовое поле для сообщения (поддержка HTML тегов: `<b>`, `<i>`, `<code>`, `<a>`)
- Фильтр получателей:
  - Все пользователи
  - Только premium
  - Только verified
  - Только с балансом > 0
- Предварительный просмотр текста
- Результат: сколько отправлено / не удалось

---

### 8. Подарочные чеки (`/checks`)
Создание подарочных чеков с USDT.

**API**: `POST /api/admin/check/create` body: `{amount_usdt, expires_in_hours?}`

- Ввод суммы USDT
- Срок действия (часы, по умолчанию 24)
- Результат: ссылка на чек `https://t.me/Cryptexa_rubot?start=check_{code}` — кнопка копирования
- Чек списывает средства с баланса админского аккаунта

---

### 9. Чат поддержки (`/support`)
Общение с пользователями через чат.

**API**: 
- `GET /api/admin/chat/unread` — список непрочитанных
- `GET /api/admin/chat/{user_id}` — история чата
- `POST /api/admin/chat/{user_id}/send` body: `{message}`

**Интерфейс:**
- Слева: список пользователей с непрочитанными сообщениями (badge с count)
- Справа: чат (как мессенджер) — сообщения от пользователя слева, от админа справа
- Поле ввода + кнопка отправки
- Сообщения автоматически дублируются в Telegram через бота
- Автообновление каждые 10 секунд
- При открытии чата — сообщения помечаются прочитанными

---

### 10. Логи (`/logs`)
Журнал всех административных действий.

**API**: `GET /api/admin/logs?page=1&limit=50`

**Таблица:**
| ID | Действие | Пользователь | До | После | Причина | Дата |

- Пагинация
- Цветовое кодирование действий (balance_add = зелёный, block = красный, и т.д.)

---

## Технические детали API

### Авторизация запросов
Все запросы к CRYPTEXA API требуют header:
```
X-Admin-API-Key: {ADMIN_API_KEY}
```

### Формат ответов
Два формата (исторически):
1. `{ok: true, ...data}` или `{ok: false, error: "message"}` — большинство endpoints
2. `{success: true, data: {...}}` или `{success: false, error: "message"}` — chat endpoints, stats, trade override

### Endpoint: Health Check
```
GET /api/admin/health
Response: {ok: true, app: "CRYPTEXA", version: "1.0", admin_id: "..."}
```
Используй для проверки подключения при запуске и на странице Settings.

### Пагинация
Endpoints с пагинацией возвращают:
```json
{
  "ok": true,
  "users": [...],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

### User Detail Response
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "telegram_id": "123456",
    "profile_id": 1001,
    "username": "john",
    "balance_usdt": 500.00,
    "wallets": {"BTC": 0.005, "ETH": 0.1, "TON": 50},
    "is_verified": false,
    "is_premium": false,
    "is_blocked": false,
    "block_reason": null,
    "language": "ru",
    "referral_code": "abc123",
    "referred_by": null,
    "referral_earnings": 25.00,
    "referral_count": 3,
    "lucky_mode": false,
    "lucky_until": null,
    "lucky_max_wins": null,
    "lucky_wins_used": 0,
    "custom_win_rate": null,
    "last_online_at": "2026-03-31T12:00:00",
    "telegram_link": "tg://user?id=123456",
    "created_at": "2026-01-15T10:00:00"
  },
  "transactions": [
    {"id": 1, "type": "deposit", "amount": 100.0, "currency": "USDT", "status": "done", "details": {"method": "xrocket"}, "created_at": "..."}
  ],
  "trades": [
    {"id": 1, "pair": "BTCUSDT", "side": "buy", "amount_usdt": 50.0, "start_price": 95000.0, "close_price": 95100.0, "duration_sec": 60, "status": "closed", "result": "win", "payout": 85.0, "opened_at": "...", "closed_at": "..."}
  ],
  "withdrawals": [
    {"id": 1, "amount_rub": 100.0, "usdt_required": 100.0, "card_number": "TRX...abc", "full_name": "TRC20", "status": "pending", "created_at": "..."}
  ]
}
```

### Dashboard Response
```json
{
  "ok": true,
  "stats": {
    "total_users": 150,
    "active_24h": 45,
    "deposits_today": 5000.00,
    "deposits_week": 25000.00,
    "deposits_month": 80000.00,
    "pending_withdrawals": 3,
    "active_trades": 12,
    "total_balance": 150000.00
  }
}
```

---

## Важные моменты

1. **Withdrawal поля**: `amount_rub` — это USDT (legacy name), `card_number` — крипто-адрес, `full_name` — название сети
2. **Win Rate**: `custom_win_rate` float 0.0-1.0 (0.73 = 73%). NULL = дефолтный (73%). В UI показывать как проценты
3. **Lucky Mode**: гарантированный WIN. Reason обязателен. until/max_wins опциональны
4. **Trade Override**: работает ТОЛЬКО с active сделками. Меняет predetermined_result
5. **Balance actions**: "add" прибавляет, "subtract" вычитает, "set" устанавливает точную сумму
6. **Broadcast**: HTML разметка поддерживается (`<b>`, `<i>`, `<a href="...">`)
7. **Check create**: списывает средства с ADMIN аккаунта. Возвращает ссылку на чек
8. **Online status**: last_online_at >= 5 минут назад = онлайн
9. **Числа**: форматировать с пробелами-разделителями тысяч (65 250.00)
10. **Proxy**: ADMIN_API_KEY добавляется ТОЛЬКО на backend-прокси, НИКОГДА не на фронтенде

---

## Настройка Railway

На Railway будут ДВА отдельных сервиса:
1. **CRYPTEXA** (основное приложение) — уже задеплоено
2. **Admin Panel** (эта панель) — новый сервис

В CRYPTEXA нужно добавить env: `ADMIN_PANEL_URL=https://admin-panel-production-xxxx.up.railway.app`
В Admin Panel нужно добавить env: `CRYPTEXA_API_URL`, `ADMIN_API_KEY`, `ADMIN_PASSWORD`, `JWT_SECRET`

---

## Sidebar навигация

```
📊 Dashboard        /
👥 Пользователи     /users
🍀 Lucky Mode       /lucky
📈 Сделки           /trades
💸 Выводы           /withdrawals
📢 Рассылка         /broadcast
🎁 Чеки             /checks
💬 Поддержка        /support
📋 Логи             /logs
⚙️ Настройки        /settings
```

Страница **Настройки** (`/settings`):
- Статус подключения к CRYPTEXA (health check)
- Текущий ADMIN_ID
- Кнопка выхода
