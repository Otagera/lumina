# Lumina - Client

This is the frontend application for Lumina, built with React, Vite, and Tailwind CSS. It provides the user interface for uploading, managing, and searching through photos and recognized faces.

## Features

- **Responsive Design**: Built with Tailwind CSS, utilizing a "Cinematic & Stealth" design system (Zinc-950/Indigo-500).
- **Intelligent Bento Grid**: Content-aware layout adapting to image aspect ratios.
- **Theatre Mode**: Immersive image viewing with carousel and side panel.
- **Background Upload Manager**: A persistent queue (via IndexedDB) allows uploads to continue in the background, surviving page reloads.
- **Real-time Updates**: Integrates Server-Sent Events (SSE) to update the UI instantly when the backend finishes processing an image.
- **Shared Album Views**: Provides both owner-level and guest-level views for public shared albums.
- **Selfie Search**: Uses the device camera to search for faces within a shared album.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Data Fetching & State**: Custom hooks utilizing the Fetch API and Context.
- **Icons**: Lucide React

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed. This app is part of the Lumina monorepo, so dependencies should be installed from the root.

### Development

To start the Vite development server for the client app:

```bash
bun run dev
```

Alternatively, you can start it from the root of the monorepo:

```bash
bun run dev:client
```

This will run the frontend on port `5173` (by default). Ensure your API server is also running so that the client can communicate with it.

### Build

To create a production build:

```bash
bun run build
```

This will generate optimized static assets in the `dist` folder.

## Environment Variables

Make sure to configure the `.env` file appropriately (if applicable, typically falling back to the API on localhost:3000 during development).
