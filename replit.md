# CRYPTEXA Exchange - Telegram Mini App

## Overview
CRYPTEXA is a Telegram Mini App functioning as a comprehensive cryptocurrency trading and wallet management platform. It allows users to manage crypto wallets, deposit and withdraw USDT, exchange various cryptocurrencies, engage in binary options trading, participate in a referral program, and access customer support, all seamlessly integrated within Telegram. The project aims to provide a robust and user-friendly crypto experience directly within a widely used messaging application.

## User Preferences
- Всегда пиши на русском
- Подробные объяснения
- Итеративная разработка
- Спрашивай перед крупными изменениями

## System Architecture
The application is built with a backend in FastAPI (Python) and a frontend using Vanilla JavaScript, augmented by the Telegram WebApp SDK and TradingView Lightweight Charts for interactive data visualization. PostgreSQL is used as the database, integrated asynchronously via SQLAlchemy.

**UI/UX Decisions:** The interface follows a dark cyberpunk-glass theme, utilizing colors like `#0A0E17` (background), `#131A2A` (cards), and accent colors `#E040FB`, `#7C4DFF`. It features glass-effect cards with `backdrop-filter blur` and gradient buttons. The navigation bar is a floating pill design with SVG stroke icons for wallet, chart, users, and profile, featuring smooth transitions and a blurred glass background.

**Technical Implementations:**
- **Wallet Management:** Supports 10 cryptocurrencies with real-time pricing from OKX and individual balances. `balance_usdt` manages USDT, while `wallets` (JSON dictionary) handles other cryptocurrencies.
- **Trading:** Binary options trading is available for durations from 30 seconds to 30 minutes, using real-time prices with a default 70% payout. Trade results (`predetermined_result`) are determined at creation based on a `win_rate`, which can be customized per user (`custom_win_rate`). Chart manipulation features like `priceOffset` and `returningToReal` provide visual confirmation.
- **Referral Program:** Offers a 5% bonus on the first deposit of referred users, calculated based on the USDT equivalent.
- **Customer Support:** Real-time chat functionality with an administrator.
- **Admin Features:** Includes an integrated admin panel (accessible via the profile tab for admins) offering a dashboard, user management (including Lucky Mode settings), withdrawal approvals, broadcasting messages, and gift check creation. An external admin API is also available for extended administrative functionalities.
- **Lucky Mode:** A feature allowing administrators to force winning outcomes for specific users.
- **Internationalization (i18n):** All user-facing strings are translated into Russian and English, managed via `i18n/translations.json` and accessed through a `t('key')` function. Language preference is saved in `localStorage`.

**System Design Choices:**
- **Database Schema:** User model includes `custom_win_rate` and `last_online_at` for enhanced user tracking and customizable win probabilities.
- **CORS:** Automatically configured for Railway/Replit domains and the `ADMIN_PANEL_URL`.

## External Dependencies
- **APIs:**
    - **OKX:** For real-time cryptocurrency prices and candlestick data.
    - **OxaPay:** Used for white-label deposit processing (V1 API) and general exchanges.
    - **xRocket:** Facilitates deposits via the @xRocket Telegram bot, supporting multiple cryptocurrencies.
    - **CoinMarketCap:** For cryptocurrency exchange rates.
    - **Telegram Bot API:** For core Telegram integration and bot functionalities.
- **Database:** PostgreSQL.
- **Frontend Libraries:**
    - **Telegram WebApp SDK:** Essential for integrating with Telegram Mini App features.
    - **TradingView Lightweight Charts:** For displaying interactive trading charts.