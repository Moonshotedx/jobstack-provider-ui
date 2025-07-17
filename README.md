# ONEST Jobs - Mobile-First Job Posting Platform

A modern, mobile-friendly web application for posting jobs and managing candidates, built with Vite, React, and TypeScript.

## Features

- **Mobile-First Responsive Design**: Optimized for a seamless experience on mobile, tablet, and desktop devices.
- **Mobile-First Design**: Optimized for mobile devices with responsive design and touch-friendly interface.
- **Job Management**: Create, edit, and manage job postings.
- **Candidate Management**: View and manage applicants for each job.
- **Employer Management**: Functionality for employers to manage their profiles and job listings.
- **User Authentication**: Secure login, registration, and password reset functionality.
- **Internationalization (i18n)**: Support for multiple languages using `i18next`.
- **Modern Tech Stack**: Built with the latest technologies for a fast and reliable user experience.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Internationalization**: i18next
- **Testing**: Vitest, React Testing Library

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/your_username/onest-jobs.git
   ```
2. Install NPM packages:
   ```sh
   pnpm install
   ```

### Running the Application

To run the app in development mode, execute the following command. This will start the development server on `http://localhost:3000`.

```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` or `pnpm start`: Starts the development server.
- `pnpm build`: Builds the app for production.
- `pnpm serve`: Serves the production build locally.
- `pnpm test`: Runs the test suite.

## Folder Structure

```
/
├── public/              # Static assets and i18n translation files
├── src/
│   ├── components/      # Reusable UI components
│   ├── constants/       # Application constants
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Integrations with third-party libraries
│   ├── lib/             # Utility functions and libraries
│   ├── routes/          # Application routes (file-based routing)
│   ├── stores/          # Zustand state management stores
│   └── types/           # TypeScript type definitions
├── .gitignore           # Git ignore file
├── index.html           # Main HTML file
├── package.json         # Project metadata and dependencies
├── pnpm-lock.yaml       # PNPM lock file
├── tsconfig.json        # TypeScript configuration
└── vite.config.js       # Vite configuration
```

## Internationalization (i18n)

This project uses `i18next` for internationalization. The translation files are located in the `public/locales` directory, organized by language.

## Styling

Styling is done using Tailwind CSS. Custom components are built using Shadcn/ui.

- `tailwind.config.js`: Tailwind CSS configuration.
- `src/styles.css`: Global styles.

## Deployment

To build the application for production, run:

```bash
pnpm build
```

This command creates a `dist` folder with the production-ready files. You can then deploy this folder to any static hosting service.