# 🐍 SnakeAid Frontend

SnakeAid is a specialized platform designed for herpetological incident management, expert-led consultations, and public education. The frontend is built with modern technologies to provide a high-performance, secure, and user-friendly experience for administrators, operators, and the general public.

## ✨ Key Features

- **🛡️ Incident & Rescue Management**: Real-time tracking and handling of snake encounters and emergency rescue missions.
- **🎓 Expert Consultation**: Professional portal for users to seek advice from herpetologists and snake experts.
- **🧠 AI Species Identification**: Integrating advanced AI to help identify snake species through imagery.
- **📚 Educational Hub**: Extensive library of blog posts and lessons regarding snake species, venom types, and first-aid guidelines.
- **🏥 Resource Directory**: Specialized search for antivenoms, hospitals, and treatment facilities.
- **📊 Admin & Analytics**: Comprehensive dashboard for user management, financial tracking, and platform analytics.
- **🌍 Multilingual Support**: Built with internationalization support with `next-intl`.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Interactive Maps**: [Leaflet](https://leafletjs.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Real-time Communication**: [SignalR](https://dotnet.microsoft.com/en-us/apps/aspnet/signalr)
- **Testing**: [Vitest](https://vitest.dev/) (Unit) & [Playwright](https://playwright.dev/) (E2E)
- **Component Library**: [Storybook](https://storybook.js.org/)
## ⚙️ Requirements

- **Node.js**: 20 or higher
- **npm**: 10 or higher

## 🛠️ Getting Started

### 1. Installation

Clone the repository and install dependencies:

```shell
git clone <repository-url>
cd SnakeAid.Frontend
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Development

Run the development server:

```shell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 Available Scripts

- `npm run dev`: Starts the development server with live reload.
- `npm run build`: Compiles the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Analyzes code for quality issues using ESLint.
- `npm run check:types`: Performs static type checking.
- `npm run test`: Executes unit tests with Vitest.
- `npm run test:e2e`: Executes end-to-end tests with Playwright.
- `npm run storybook`: Opens the Storybook UI development environment.

## 📁 Project Structure

```text
src/
├── apis/         # API services and clients
├── app/          # Next.js App Router (pages and layouts)
├── components/   # Reusable UI components
├── constants/    # Global constants and config
├── hooks/        # Custom React hooks
├── libs/         # Library initializations
├── locales/      # Translation files (i18n)
├── styles/       # Tailwind and global CSS
├── types/        # TypeScript definitions
└── utils/        # Helper functions
```

---

© 2026 SnakeAid Team. Built with passion for herpetology and safety.
