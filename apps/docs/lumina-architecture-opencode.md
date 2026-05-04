# Lumina: Building a Collaborative AI Photo Intelligence Layer

For nearly two years, a specific idea has lived in the back of my mind. It started with a simple observation of how effortlessly Google Photos handles face grouping, and it evolved into a question: *Can I build a platform that offers that same "magic" without the privacy trade-offs or the data silos?*

This is the story of **Lumina**. It’s an engineering journey that began with a messy Python script and evolved into a distributed monorepo capable of handling collaborative events, "Bring Your Own Storage" (BYOS), and asynchronous AI processing at scale.

## The Evolution: From "Does it Work?" to "Will it Scale?"

### 1. The "Script" Era (Late 2025)
Lumina didn't start out elegantly. It began as a basic Express app. Every time an image was uploaded, I used `child_process.exec` to trigger a Python script utilizing the standard `face_recognition` library.

It was functional, but extremely fragile:
*   **The Bottleneck:** Calling Python scripts from Node.js is inherently expensive. The overhead of spinning up a new Python interpreter for every single image was a performance nightmare.
*   **The Accuracy:** While `face_recognition` (based on dlib) is fantastic for hobby projects, it struggled significantly with diverse lighting, angles, and profile shots.

### 2. The Migration: Embracing Elysia and Bun (Early 2026)
As the project grew, it became clear the "Express + Scripts" approach was a dead end. I decided to rewrite the backend, migrating to **Elysia.JS** running on **Bun**.

*   **Why Elysia?** I wanted a framework that felt modern and took full advantage of Bun's speed. Elysia's end-to-end type safety (powered by TypeBox) made refactoring the API incredibly smooth.
*   **Decoupling the Engine:** I moved the Python ML logic into its own dedicated **FastAPI** microservice (powered by InsightFace's `buffalo_l` model). The Bun-based BullMQ worker orchestrates asynchronous calls to this service, keeping the AI engine "warm" in memory for drastically reduced face detection latency.

### 3. The Collaborative Pivot: "Selfie to Join"
The most significant product shift was realizing that Lumina shouldn't just be a personal gallery—it should be a **collaborative hub**. I introduced **Collaborative Events**. 

Imagine a wedding: The host shares a QR code. Guests upload photos. But instead of mindlessly scrolling through thousands of strangers' photos, a guest can simply **take a selfie**. Lumina uses that selfie to instantly perform a vector search, finding every photo they appear in within that specific event.

---

## Under the Hood: The Engineering Deep-Dive

### The Monorepo Strategy
I opted for a manual monorepo using **Bun Workspaces**. Instead of taking on the complexity and overhead of tools like TurboRepo, I chose to share logic simply through a `packages/` directory:
*   `packages/models`: Centralizes the Prisma database schema.
*   `packages/utils`: Contains abstractions like the `StorageProvider`, allowing the app to seamlessly switch between local storage, Cloudflare R2, and user-defined S3 buckets.

### The Background Worker Pipeline (BullMQ)
Processing AI isn't a single API call; it's a multi-stage, asynchronous pipeline. I implemented **BullMQ** to chain these heavy operations safely in the background:

1.  **Image Optimization:** We use `Sharp` to generate a 2000px WebP version for fast UI rendering, saving massive amounts of bandwidth.
2.  **Perceptual Hashing (dHash):** We calculate a 64-bit hash to identify "visual duplicates." This allows us to tell a user, *"You've already uploaded this photo in another album,"* even if the file size, metadata, or name has changed.
3.  **Face Recognition:** The worker calls the FastAPI service, which extracts face embeddings using the state-of-the-art **InsightFace `buffalo_l`** model.

Here is a look at the dHash implementation for visual duplicate detection:
```javascript
const calculatePerceptualHash = async (imageBuffer) => {
    // Resize to 9x8 grayscale to compare adjacent pixels
    const { data } = await sharp(imageBuffer)
        .grayscale()
        .resize(9, 8, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true });

    let hash = "";
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const left = data[row * 9 + col];
            const right = data[row * 9 + col + 1];
            // If the left pixel is brighter than the right, it's a 1
            hash += left > right ? "1" : "0";
        }
    }
    return BigInt(`0b${hash}`).toString(16).padStart(16, "0");
};
```

### The PostgreSQL Vector Hack (Cosine Similarity in SQL)
One of the biggest infrastructure hurdles was performing vector searches. While `pgvector` is excellent, I wanted the core logic to remain **infrastructure-agnostic**—able to run on any standard Postgres instance without requiring custom extensions like `pgvector` to be installed.

> **Zero Vendor Lock-in:** This approach means Lumina runs on *any* PostgreSQL instance—Neon, Supabase, Crunchy Bridge, or your own self-hosted database. Competitors often require dedicated vector databases (Pinecone, Weaviate) or specific database extensions, but Lumina remains portable.

My solution? **Pure SQL Dot Product Math.**

I stored the 512-dimensional facial embeddings as standard `Float[]` arrays in the database. To find similar faces, I wrote a raw SQL query that calculates the **Cosine Distance** using `unnest()` and dot products entirely on the fly.

```sql
-- Manual Cosine Similarity: 1.0 - ((A · B) / (||A|| * ||B||))
WITH distances AS (
  SELECT
    f.face_id,
    (
      SELECT 1.0 - (
        SUM(u1.val * u2.val) / (SQRT(SUM(u1.val * u1.val)) * SQRT(SUM(u2.val * u2.val)))
      )
      FROM unnest(f.embedding) WITH ORDINALITY AS u1(val, idx)
      JOIN unnest(p_faces.embedding) WITH ORDINALITY AS u2(val, idx) ON u1.idx = u2.idx
    ) as distance
  FROM faces f, faces p_faces
  WHERE p_faces.person_id = $1::uuid
)
SELECT * FROM distances WHERE distance <= $2 ORDER BY distance ASC LIMIT 10;
```
This raw math approach handles thousands of vectors beautifully and keeps the database dependencies incredibly lean.

### Measuring the "Cost of AI"
Compute isn't free. To make Lumina financially sustainable, I implemented a strict **Compute Unit** tracking system. Every AI-intensive operation is logged:
*   **Face Recognition:** Logs `n` compute units (where `n` is the number of faces detected).
*   **Storage:** Tracks the precise delta of bytes added to the storage provider.

This usage is verified against the user's active plan limits inside the `uploadPicturesService` before a single job is even added to the BullMQ queue. If a user runs out of quota, their images safely stay in a "Pending" state until they upgrade or their monthly cycle resets.

## Bring Your Own Storage (BYOS)
The final piece of the puzzle was giving users ultimate control over their data. Lumina natively supports **BYOS**. 

In the worker pipeline, the code dynamically initializes the storage provider based on the specific album's configuration:

```typescript
// If albumStorageConfig exists, we connect to the user's specific S3/R2 bucket on-the-fly
const { provider, isLocal } = getStorageProvider(image, albumStorageConfig);
```
This means Lumina can act entirely as the **intelligence layer** for your data, analyzing and serving matches without ever actually "owning" or holding your original high-res files hostage.

## Reflection
Building Lumina has been a masterclass in bridging ecosystems. It demonstrates exactly why "JavaScript only" or "Python only" dogmas are limiting. By picking the right tool for every specific job—**Bun** for a lightning-fast API, **BullMQ** for reliable orchestration, **Python/FastAPI** for heavy ML processing, and **raw PostgreSQL math** for vector search—I was able to build an architecture that feels like absolute magic, yet remains grounded in solid, standardized engineering.

---

## Additional Context

### Missing from This Document (as of May 2026)

- **Thumbnail Generation:** Separate optimization pipeline for preview images distinct from the 2000px WebP versions
- **Real-time Updates:** Server-Sent Events (SSE) at `/api/v1/events` for live notifications on image processing, face detection, and clustering progress
- **Guest Session Management:** Cookie-based sessions with 1-year persistence for unauthenticated event uploads
- **CSRF Protection:** Token-based protection on all mutating API endpoints
- **Multipart Upload:** Large file support with resumable uploads (5MB chunks, 50MB threshold)
- **Face Clustering:** DBSCAN-based automatic grouping of detected faces into people clusters
- **Bulk Download:** Asynchronous ZIP generation for batch exports

### Infrastructure Notes

- **Docker Compose:** Includes `ankane/pgvector:latest` image, but the current implementation uses pure SQL to remain database-agnostic. The infrastructure supports future migration to pgvector for performance gains.
- **Timeline:** This architecture is **ongoing**, not a completed migration. The system continues to evolve with new features and optimizations.
