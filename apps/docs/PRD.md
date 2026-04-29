# Lumina

### Overview

This application, Lumina, allows users to upload photos and organize them into albums. The primary feature is face-matching. When viewing a photo, a user can select a recognized face and search for other photos within the same album containing that face.  Users will also be able to share their albums by generating a link that will allow others to view the album's photos and perform face searches.

For this demo application, a simplified authentication will be used. This allows users to quickly start uploading pictures and using the app. Only the uploader and those they share album links with will be able to view the content.

The application uses a Python script to analyze uploaded images and store data about the faces it recognizes. Image processing is handled by a background worker for better performance and scalability.

### Image Optimization & Performance

To ensure high performance while maintaining image quality, the application employs a two-tier strategy:
*   **Original Tier:** The original uploaded file is stored to allow high-quality sharing and downloads.
*   **Display Tier:** A worker automatically generates a WebP version of the image (max width 2000px). This optimized version is used for the app's UI, gallery, and face processing to minimize bandwidth and load times.
*   **Storage Management:** Users have the option to purge "Original" files to save storage once the optimized versions are ready.

### Background Uploads

The application implements a non-intrusive background upload system similar to Google Photos:
*   **Persistent Queue:** Uploads are managed in a global queue persisted via **IndexedDB**. This allows uploads to resume automatically if the page is refreshed or the browser is closed.
*   **Background UI:** A floating manager at the bottom of the screen tracks progress, allowing the user to continue using the application during large uploads.
*   **Control:** Users can pause, resume, or retry failed uploads.

### Real-time Updates

*   **Server-Sent Events (SSE):** The application uses SSE to push real-time status updates from the worker to the client. When face recognition is complete, the UI updates automatically without requiring a page refresh.

### Task Tracking

Development is tracked using `beads` (bd). Current active tasks:
*   `lumina-ofp`: Optimization: Worker-based Image Processing
*   `lumina-apr`: Upload: Persistent Background Manager
*   `lumina-kgm`: Real-time: SSE Status Updates
*   `lumina-r2b`: Infrastructure: R2 Migration & BYOS Support
*   `lumina-evt`: Features: Collaborative Events & Moderation

### Collaborative Events

Lumina is evolving from a personal gallery into a social, collaborative platform. **Events** are special types of albums designed for crowdsourcing photos:
*   **Frictionless Contribution:** Guests can upload photos via a QR code or link without creating an account.
*   **"Selfie to Join":** An optional flow where guests take a selfie to instantly find all photos of themselves within the event.
*   **Host Control:** Hosts can review and approve guest uploads before they appear in the main gallery.
*   **Automatic Expiration:** Upload windows can be set to close automatically after a specific duration.

### Storage & Pricing Strategy (Compute vs. Storage)

The application separates the cost of **AI Intelligence** from **Physical Storage**:
*   **Compute Credits:** Users pay for "Compute Units" (CPU/GPU time) consumed by face detection, embedding generation, and clustering.
*   **Managed Storage:** Default storage provided by Lumina (using Cloudflare R2 for zero-egress costs).
*   **BYOS (Bring Your Own Storage):** Power users and pros can connect their own S3-compatible buckets (AWS, Cloudflare R2). In this mode, Lumina acts as the "AI Layer," while the user retains full ownership and cost-control of their image files.

### Infrastructure: Cloudflare R2 Migration

To ensure a sustainable free tier and low-cost scaling, the application is migrating to **Cloudflare R2**:
*   **Zero Egress Fees:** Eliminates bandwidth costs when users view or download photos.
*   **Storage Abstraction:** A unified `StorageService` allows the app to seamlessly switch between local, managed R2, and BYOS buckets.
*   **Direct-to-Cloud Uploads:** Using S3 Presigned URLs, the client uploads directly to storage, bypassing the API server to save resources.

### Scalability Considerations

As this application grows, it will be important to address the following scalability concerns:

*   **Database:** The PostgreSQL database will need to efficiently handle an increasing number of photos and recognized faces. Database query optimization and potential schema adjustments may be needed.
*   **Image Processing:** The Python image processing script (or the future background worker) will need to scale to handle many image uploads concurrently. We will need to make sure that it has enough resources.
*   **Face Matching:** The face-matching algorithm may need to be optimized to maintain fast search times as the number of stored faces increases.
*   **Storage:** The storage solution (local in development, Cloudinary/AWS in production) must be able to accommodate a growing volume of image data.
* **Authentication**: The authentication will need to handle an increasing number of users.

These are initial considerations and will be revisited as development progresses.

### UI Design

The application will have a clean and modern design, similar to the UI found on [playbook.com](https://playbook.com). The UI should be intuitive and easy to navigate.  Tailwind CSS will be used as the primary styling framework, leveraging its utility classes to create a consistent visual style.

The UI will consist of the following key components:

-   **Welcome Page:** The initial page users see when opening the application.
-   **Albums Page:** This page will display all of the user's albums and provide a way to create new ones.
-   **Album Page:** Displays all the photos within a selected album.
-   **Image Modal:** A modal that appears when a user clicks on a photo in an album. It will display more information about the photo and show the faces that have been recognized in the image.
- **Search Page:** After a face is clicked on in the Image Modal a search will be initiated and the result will be displayed in the Search page.

The following framework will be used:

-   React
-   React Router DOM
-   TypeScript
-   Tailwind CSS
-   `tanstack/react-query`

The color schemes and fonts will be based on what tailwind provides, and will be revisited at a later date.

### Data Source

PostgreSQL will be used as the database for the application. The database will store paths that reference the images. In development, the images will be stored locally on the filesystem, while in production, images will be stored in either AWS S3 or Cloudinary.

The `prisma` ORM will be used for interacting with the PostgreSQL database.

Redis will be used as a caching layer to improve query performance.

#### Database Schema
**Table: `images`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| image\_id         | UUID (Primary)  | Unique identifier for the image                                                |
| image\_path       | TEXT            | Path to the original image (local or cloud)                                    |
| optimized\_path   | TEXT            | Path to the optimized WebP image                                               |
| status            | TEXT            | Moderation status: `PENDING`, `APPROVED`, `REJECTED`                           |
| upload\_date      | TIMESTAMPTZ     | Date and time the image was uploaded (default: `CURRENT_TIMESTAMP`)            |
| update\_date      | TIMESTAMPTZ     | Date and time the image was last updated (default: `CURRENT_TIMESTAMP`)        |
| original\_width   | INT             | Original width of the image                                                   |
| original\_height  | INT             | Original height of the image                                                  |
| uploaded\_by      | UUID (Foreign)  | ID of the user who uploaded the image (references `users.user_id`)             |

**Table: `faces`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| face\_id          | SERIAL (Primary)| Unique identifier for the face                                                 |
| image\_id         | UUID (Foreign)  | ID of the image containing this face (references `images.image_id`)            |
| person\_id        | UUID (Foreign)  | ID of the person tagged in this face (references `people.person_id`)           |
| embedding         | REAL[]          | Vector representation of the face                                              |
| bounding\_box     | JSONB           | JSON object containing bounding box coordinates for the face                   |
| processed\_time   | TIMESTAMPTZ     | Date and time the face was processed (default: `CURRENT_TIMESTAMP`)            |

**Table: `people`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| person\_id        | UUID (Primary)  | Unique identifier for the person                                               |
| name              | TEXT            | Name assigned to the person                                                    |
| user\_id          | UUID (Foreign)  | Owner of this person record (references `users.user_id`)                       |
| created\_at       | TIMESTAMPTZ     | Date and time the person was created (default: `CURRENT_TIMESTAMP`)            |
| updated\_at       | TIMESTAMPTZ     | Date and time the person was last updated (default: `CURRENT_TIMESTAMP`)       |

**Table: `albums`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| album\_id         | UUID (Primary)  | Unique identifier for the album                                                |
| album\_name       | TEXT            | Name of the album                                                              |
| created\_by       | UUID (Foreign)  | ID of the user who created the album (references `users.user_id`)              |
| storage\_config\_id| UUID (Foreign) | Linked BYOS storage (references `user_storage_configs.id`)                     |
| creation\_date    | TIMESTAMPTZ     | Date and time the album was created (default: `CURRENT_TIMESTAMP`)             |
| shared\_link      | TEXT            | The generated link to share the album                                          |
| share\_token      | TEXT (Unique)   | Token used to authenticate public access to shared albums                      |

**Table: `album_settings`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| album\_id         | UUID (Primary)  | Unique identifier (references `albums.album_id`)                               |
| is\_event         | BOOLEAN         | Whether collaborative features are enabled                                     |
| requires\_approval| BOOLEAN         | Whether guest uploads require host approval                                    |
| tagging\_policy   | TEXT            | Who can tag faces (`HOST_ONLY`, `GUESTS_SELF`, `ANYONE`)                       |
| expires\_at       | TIMESTAMPTZ     | When the event upload window closes                                            |
| allow\_guest\_uploads| BOOLEAN      | Whether guests can contribute photos                                           |

**Table: `album_images`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| album\_images\_id | UUID (Primary)  | Unique identifier for the album-image relationship                             |
| image\_id         | UUID (Foreign)  | ID of the image (references `images.image_id`)                                 |
| album\_id         | UUID (Foreign)  | ID of the album (references `albums.album_id`)                                 |

**Table: `user_storage_configs`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| id                | UUID (Primary)  | Unique identifier                                                              |
| user\_id          | UUID (Foreign)  | Owner of the config (references `users.user_id`)                               |
| provider          | TEXT            | Storage provider (`r2`, `s3`)                                                  |
| name              | TEXT            | Friendly name for the config                                                   |
| access\_key\_id   | TEXT            | Encrypted API key                                                              |
| secret\_access\_key| TEXT           | Encrypted API secret                                                           |
| bucket            | TEXT            | Bucket name                                                                    |
| endpoint          | TEXT            | S3-compatible endpoint URL                                                     |
| region            | TEXT            | Optional S3 region                                                             |
| is\_active        | BOOLEAN         | Whether this is the default managed config                                     |

**Table: `usage_logs`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| id                | SERIAL (Primary)| Unique identifier                                                              |
| user\_id          | UUID (Foreign)  | User to charge (references `users.user_id`)                                    |
| resource          | TEXT            | Resource type (`compute_unit`, `storage_gb`)                                   |
| operation         | TEXT            | Specific action (`face_detection`, `clustering`)                               |
| quantity          | INT             | Amount consumed                                                                |
| timestamp         | TIMESTAMPTZ     | Date and time of consumption                                                   |

**Table: `users`**
| Column Name       | Data Type       | Description                                                                     |
| ------------------ | --------------- | ------------------------------------------------------------------------------- |
| user\_id          | UUID (Primary)  | Unique identifier for the user                                                 |
| email             | TEXT (Unique)   | Email address of the user                                                      |
| password          | TEXT            | Password of the user                                                           |
| preferences       | JSONB           | User-level global settings                                                     |



### Implementation Details

-   **Tech Stack:**
    -   Server: TypeScript (Bun, ElysiaJS) - **Fully Migrated from Express**
    -   Client: TypeScript, ReactJS, React Router DOM, Tailwind CSS
- **Python**:
    - Python (FastAPI/Uvicorn) is used for the face recognition service.
-   **Configuration:**
    -   Docker (Compose) is used to deploy the entire stack.
    -   **Base Image:** `oven/bun:1.2` for optimized monorepo support.
    -   **Services:** `db` (pgvector), `redis`, `ai_service` (Python), `api` (Elysia), `worker` (Bun), and `client` (Vite/React).

### Monorepo Architecture

The project has transitioned to a monorepo structure utilizing Bun workspaces to separate concerns and improve maintainability:
-   **`apps/`**: Contains the runnable services.
    -   `apps/api`: The core ElysiaJS backend.
    -   `apps/client`: The React/Vite frontend.
    -   `apps/ai`: The Python FastAPI face recognition service.
    -   `apps/worker`: The Bun worker for background processing (e.g., image optimization).
-   **`packages/`**: Contains shared libraries and domain logic used across apps (e.g., `@lumina/models`, `@lumina/auth`, `@lumina/utils`, `@lumina/config`). This architecture isolates database models and shared utility functions from the application layers.

### Project Milestones

(Agent will check in with the user weekly for feedback and progress confirmation. Check-in will also occur after each milestone.)

**Milestone 1: Prepare this Document (PRD.mdx)**

*   Tasks:
    *   Complete the review and refinement of all sections in the `PRD.mdx` file.
* Status: Done

**Milestone 2: Define and Implement API Endpoints**

*   Tasks:
    *   2.1. User Authentication Endpoints:
        *   Create endpoints for user creation.
        *   Create endpoints for user login.
    *   2.2. Album Management Endpoints:
        *   Create endpoints to list albums.
        *   Create endpoints to create new albums.
        *   Create endpoints to view an album.
        *   Create endpoints to delete an album.
        *   Create endpoints to edit an album.
    * 2.3. Image Management Endpoints:
        *   Create endpoints to upload images.
        *   Create endpoints to view images.
    *   2.4. Face Management Endpoints:
        *   Create endpoints to process faces.
        *   Create endpoints to search for faces.
*   Status: Done.
**Milestone 3: Create Basic Page Outlines**

*   Tasks:
    *   3.1. Welcome Page: Create a basic layout for the Welcome Page.
    *   3.2. Albums Page: Create a basic layout for the Albums Page (listing existing albums and a "create new album" button).
    *   3.3. Album Page: Create a basic layout for an Album Page (displaying the photos in an album).
    *   3.4. Image Modal: Create a basic structure for the Image Modal.
    * 3.5 Search page: Create a basic structure for the search page.
*   Status: Done.

**Milestone 4: Connect Frontend to Backend**

*   Tasks:
    *   4.1. Connect the albums page to the backend.
    *   4.2. Connect the album page to the backend.
*   Status: Done.

**Milestone 5: Implement User Authentication**

* Tasks:
    * 5.1 User Auth Backend: Implement user authentication and session logic on the server.
    * 5.2 User Auth Frontend: Implement user login/registration on the frontend.
    * 5.3 User Auth Endpoints: Test all User auth endpoints.
    * 5.4 User Auth UI: Test all user auth views.
* Status: Done.

**Milestone 6: Implement Album Management**

* Tasks:
    * 6.1 Album Management Backend: Implement album creation, listing, deletion and edition logic on the server.
    * 6.2 Album Management Frontend: Implement album views, album creation on the frontend.
    * 6.3 Album Management Endpoints: Test all album management endpoints.
    * 6.4 Album Management UI: test all album management views.
* Status: Done.

**Milestone 7: Implement Image Upload**

* Tasks:
    * 7.1 Image Upload Backend: Implement image uploading logic on the server.
    * 7.2 Image Upload Frontend: Implement image upload on the frontend.
    * 7.3 Image Upload Endpoints: Test all image upload endpoints.
    * 7.4 Image Upload UI: test all image upload views.
* Status: Done.

**Milestone 8: Implement Image View**

* Tasks:
    * 8.1 Image View Backend: Implement image viewing logic on the server.
    * 8.2 Image View Frontend: Implement image viewing on the frontend.
    * 8.3 Image View Endpoints: Test all image view endpoints.
    * 8.4 Image View UI: test all image view views.
* Status: Done.

**Milestone 9: Implement Face Recognition**

*   Tasks:
    *   9.1. Integrate Python Script: Integrate the existing Python face recognition script with the server.
    *   9.2. Process Faces: Create logic for processing faces on image upload.
    *   9.3. Store Face Embeddings: Store the face embedding information in the `faces` table.
    *   9.4 Test: test that faces are processed correctly.
*   Status: Done.
    
**Milestone 10: Implement Face Search**

* Tasks:
    * 10.1 Face search Backend: Implement face search on the server.
    * 10.2 Face search Frontend: Implement face search on the frontend.
    * 10.3 Face search Endpoints: Test all face search endpoints.
    * 10.4 Face search UI: test all face search views.
* Status: Done.

**Milestone 11: Framework Migration (Express.js to ElysiaJS)**

* Tasks:
    * 11.1 Setup Bun and ElysiaJS environment: Done.
    * 11.2 Convert server code to TypeScript and ES Modules: Done.
    * 11.3 Migrate User Authentication routes: Done.
    * 11.4 Migrate Album Management routes: Done.
    * 11.5 Migrate Image Management routes: Done.
    * 11.6 Migrate Face Management routes: Done.
    * 11.7 Replace Joi with TypeBox for validation: Pending (Standardized Joi usage within Elysia context for now).
    * 11.8 Verify all migrated endpoints with tests: Done.
    * 11.9 Retire legacy Express entry points (`index.ts`, `app.ts`): **Done**.
* Status: Done.

**Milestone 12: Advanced Features**

* Tasks:
    * 12.1 Face Confirmation (Tagging): Implement people management and face tagging. Done.
    * 12.2 Shared Albums: Implement public access with share tokens. Done.
    * 12.3 Real-time Updates: Implement SSE for live status updates. Done.
    * 12.4 Background Uploads: Implement persistent uploads with IndexedDB. Done.
    * 12.5 Image Optimization: Implement WebP conversion worker. Done.
    * 12.6 Selfie Search: Implement camera-based guest search for shared albums. Done.
    * 12.7 Improved Auth UI: Redesign Login/Signup and add Forgot Password flow. Done.
    * 12.8 Fix Album Pagination: Ensure infinite scroll respects limits. Done.
* Status: Done.

**Milestone 13: UI/UX Overhaul & Finalization**

* Tasks:
    * 13.1 Cinematic & Stealth Design: Standardize Zinc-950/Indigo-500 palette. Done.
    * 13.2 Intelligent Bento Grid: Implement content-aware layout using resolution and aspect ratio. Done.
    * 13.3 Theatre Mode: Major refactor of Image Modal with carousel, side panel, and keyboard navigation. Done.
    * 13.4 Feature Parity: Bring shared views up to the same quality as owner views. Done.
    * 13.5 Data Integrity: Fix nested data access across all main views. Done.
* Status: Done.

**Milestone 14: Collaborative Events & BYOS**

* Tasks:
    * 14.1 Storage Abstraction Layer: Implement `StorageService` with R2 and Local providers. Done.
    * 14.2 R2 Migration: Move all existing image flows to Cloudflare R2 with Presigned URLs. Done.
    * 14.3 Settings Infrastructure: Implement Global User Preferences and Local Album/Event settings. Done.
    * 14.4 Event Logic: Implement QR-based guest uploads, moderation queues, and expiration. Done.
    * 14.5 BYOS Support: Implement secure storage for user S3 keys and dynamic provider initialization. Done.
    * 14.6 Usage & Quotas: Implement "Compute Unit" tracking and host-based billing logic. Done.
* Status: Done.

### Monitoring & Observability (LGTM Stack)

The application implements the LGTM stack (Loki, Grafana, Tempo, Mimir/Prometheus) for comprehensive system visibility:
*   **Centralized Logging (Loki):** Consolidates logs from API, Worker, and AI services into a single searchable interface.
*   **Infrastructure Metrics (Prometheus + cAdvisor):** Real-time monitoring of CPU, Memory, and Network usage across all Docker containers, specifically tracking the load of the AI service.

### Structured Logging Implementation

**Current State:** All services use plain text `console.log` which gets captured by Docker's json-file logging driver and forwarded to Loki via Promtail.

**Phase 1 - JSON Logging (Implemented):**
*   Replace plain text logs with structured JSON format across all services
*   JSON format: `{ "timestamp": "...", "level": "info", "service": "api", "message": "...", "metadata": {...} }`
*   Benefits: Advanced filtering, field extraction, dashboarding in Grafana

**Phase 2 - Advanced Observability (Future):**
*   **Direct Loki Push:** Replace Docker logging with direct HTTP push to Loki from each service (bypasses Docker logs)
*   **Distributed Tracing (Tempo):** Add trace IDs to correlate requests across API -> Worker -> AI service boundaries
*   **Application Metrics:** Track business metrics (queue lengths, face match accuracy, user activity)
*   **Infrastructure Exporters:** Add dedicated exporters for PostgreSQL and Redis

### Expected Deliverables

The Lumina application is expected to deliver the following core features and capabilities:

*   **User Authentication:**
    *   Users can create accounts.
    *   Users can log in to their accounts.
    *   Only logged-in users can use the application features.
*   **Album Management:**
    *   Users can create new albums.
    *   Users can view a list of their existing albums.
    *   Users can open an album to view its contents.
    *   Users can delete albums.
    * Users can edit albums.
*   **Image Management:**
    *   Users can upload images to their albums.
    *   Users can view uploaded images.
    * The original size of the image is saved.
*   **Face Recognition:**
    *   The application automatically processes uploaded images to recognize faces.
    *   The application stores data about the recognized faces (embedding and bounding box).
*   **Face Search:**
    *   Users can select a recognized face in an image.
    *   Users can search for other images within the same album containing that face.
*   **Album Sharing:**
    *  Users can generate a link to an album.
    * Users can share the generated link with other users.
    *  Users can view the shared album.
    * Users can use face search in shared album.
*   **Error Handling and Logging:**
    *   The application handles errors gracefully.
    *   The application logs important events and errors.
* **Caching**:
    * The application will use caching to speed up the loading time.
