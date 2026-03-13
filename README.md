# FinTech App

A modern financial technology application built with React Native and Expo.

## Features

- **Authentication**: Secure login, registration, and forgot password screens.
- **Dashboard**: Overview of accounts, cards, and recent transactions.
- **Navigation**: Drawer and Tab-based navigation for a seamless user experience.
- **Onboarding**: Interactive onboarding screens for new users.
- **Management**: Dedicated screens for expenses, savings, payments, and profile settings.
- **Custom Components**: Includes a custom numpad, currency picker, and step indicators.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Backend**: [Supabase](https://supabase.com/)
- **Storage**: AsyncStorage for local data persistence

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Syber-Tek/fintech_app.git
   cd fintech_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the application**
   ```bash
   npx expo start
   ```

## Folder Structure

- `app/`: Main application screens and routing logic.
- `assets/`: Images, icons, and other static assets.
- `components/`: Reusable UI components.
- `hooks/`: Custom React hooks (e.g., `useCurrency`).
- `lib/`: Library configurations (e.g., Supabase client).
- `utils/`: Utility functions and helper classes.

## License

This project is private and owned by Syber-Tek.
