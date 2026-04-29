# Lumina

![diagram-export-15-04-2025-11_32_33](https://github.com/user-attachments/assets/f4715318-8575-4a6b-9227-4073fb53c234)

## Overview

Lumina is an **AI Intelligence Layer** for your photo library. It allows users to organize photos, perform advanced face recognition, and host **Collaborative Events**. The platform separates AI compute from physical storage, offering a **Bring Your Own Storage (BYOS)** model that gives users full control over their data while leveraging powerful facial recognition and search.

## Features

- **Collaborative Events:** Host weddings, parties, or gatherings where guests can contribute photos via QR code without an account.
- **"Selfie to Join":** Guests can take a selfie to instantly find all photos of themselves within a shared event.
- **BYOS (Bring Your Own Storage):** Connect your own AWS S3 or Cloudflare R2 bucket. Lumina handles the AI, while you own the files and the costs.
- **Face Detection & Recognition:** Automatically detects and clusters faces using a high-performance background worker.
- **Face Search:** Find all occurrences of a specific face across albums or collaborative events.
- **Managed Storage (R2):** Sustainable managed storage with zero egress fees powered by Cloudflare R2.
- **Real-time Updates:** UI updates automatically when image processing is complete via Server-Sent Events (SSE).
- **Background Uploads:** Persistent upload manager (using IndexedDB) allows uploads to continue in the background and resume after page reloads.
- **Image Optimization:** Automatically generates optimized WebP versions of images for fast display.

## Project Structure

Lumina is a monorepo managed with [Bun Workspaces](https://bun.sh/docs/install/workspaces).
- **`apps/`**: Contains the runnable services.
  - `api`: The core backend built with Elysia JS.
  - `client`: The frontend built with React, Vite, and Tailwind CSS.
  - `ai`: The Python/FastAPI service for generating face embeddings.
  - `worker`: The Bun background processor for image optimization and queues.
- **`packages/`**: Contains shared libraries and domain models (e.g., `@lumina/models`, `@lumina/auth`) to separate database logic and utilities from the application layer.

## Installation

### Prerequisites
- [Bun](https://bun.sh/) (v1.2+)
- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) (for full stack deployment)

To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/lumina.git
   cd lumina
   ```

2. **Start Infrastructure (Postgres & Redis):**
   ```bash
   docker-compose up -d db redis
   ```
   
3. **Install Dependencies:**
   ```bash
   bun install
   ```

### Running the Application

The easiest way to run the entire stack is from the root directory:

**Start All Services (Client, API, Worker, AI):**
```bash
bun run dev:all
```

**Alternatively, start services individually:**
- **API (Elysia):** `bun run dev:api`
- **Frontend (React):** `bun run dev`
- **Worker:** `bun run dev:worker`
- **AI Service:** `bun run dev:ai`

### Docker Deployment

To build and start the entire application in containers:
```bash
docker-compose up --build
```

## Usage

1. **Sign Up/Login:** Create an account to start using the application.
2. **Create Album:** Organize your photos by creating albums.
3. **Upload Images:** Drag and drop images into an album. The background uploader will handle the process.
4. **View & Search:** Click on an image to view details. Click on any detected face to find matches in the album.
5. **Tag People:** Click "Tag Person" on a detected face to assign a name.
6. **Share:** Use the "Share" button in an album to generate a public link for others.

## API Endpoints

The API is built with ElysiaJS. Key endpoints include:

**Authentication**
- `POST /api/v1/auth/signup`: Register a new user.
- `POST /api/v1/auth/login`: Log in.

**Albums**
- `GET /api/v1/albums`: List user albums.
- `POST /api/v1/albums`: Create a new album.
- `GET /api/v1/albums/:id`: Get album details.
- `PUT /api/v1/albums/:id`: Update album (rename, generate share token).

**Images**
- `GET /api/v1/images`: List images.
- `POST /api/v1/images`: Upload images.
- `GET /api/v1/images/:id`: Get image details and faces.

**Faces & People**
- `GET /api/v1/faces/:id`: Get face details.
- `POST /api/v1/faces/search`: Search for similar faces.
- `PATCH /api/v1/faces/:id`: Update face (assign person).
- `GET /api/v1/people`: List people.
- `POST /api/v1/people`: Create a new person.

**Settings & Storage**
- `GET /api/v1/settings`: Fetch user preferences and storage configs.
- `POST /api/v1/settings/storage`: Add a new BYOS storage configuration.
- `PUT /api/v1/settings/storage/:id`: Update storage configuration.
- `DELETE /api/v1/settings/storage/:id`: Remove storage configuration.

**Public (Shared & Events)**
- `GET /api/v1/public/albums/:token`: View shared album.
- `POST /api/v1/public/albums/:token/upload`: Guest upload to event.
- `POST /api/v1/public/albums/:token/presigned-url`: Request guest upload URL.
- `POST /api/v1/public/faces/search`: Search faces in shared album.
- `POST /api/v1/public/albums/:token/search-by-image`: "Selfie to Join" search.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your message here"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
