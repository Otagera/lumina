# Lumina: Building a Collaborative AI Photo Intelligence Layer

[**Live Demo**](https://lumina.otagera.xyz/) | [**GitHub Repository**](https://github.com/Otagera/lumina)

For a long time, I’ve been fascinated by how effortlessly Google Photos groups faces. You upload thousands of images, and somehow it understands *who is who*.

That raises an obvious question:

> Can you build something similar—without locking users into a proprietary system or sacrificing control over their data?

**Lumina** is my attempt at answering that. It’s a distributed system that turns raw photo storage into an **intelligence layer**: detect faces, cluster identities, and let users instantly find themselves in large, shared photo collections.

What started as a simple script evolved into a system with:
- asynchronous AI processing
- collaborative event-based photo sharing
- Bring Your Own Storage (BYOS)
- and a fully decoupled ML pipeline

---

# From Script to System

## 1. The “Call Python From Node” Phase (Late 2025)

The first version was exactly what you’d expect: an Express API with an image upload endpoint that used `child_process.exec` to call a Python script utilizing the standard `face_recognition` (dlib) library.

It proved the idea and was functional, but extremely fragile:
- **Cold start overhead**: Spawning a Python process per image added ~400–800ms latency.
- **No concurrency model**: Requests blocked on CPU-heavy work.
- **Model limitations**: It struggled significantly with diverse lighting, side profiles, and partial occlusion.

---

## 2. Decoupling the AI Layer: Embracing Elysia and Bun

The first real architectural shift was to stop treating ML like a script and start treating it like a service. I rewrote the backend using **ElysiaJS** on **Bun** and split the system into:

- **Bun API**: Handles validation, auth, and usage limits.
- **BullMQ Worker**: Orchestrates the heavy asynchronous pipeline.
- **FastAPI ML Service**: Powered by InsightFace's `buffalo_l` model, keeping the engine "warm" in memory.

### Latency Improvement
| Approach              | Latency per image |
|----------------------|------------------|
| Python script (cold) | ~400–800ms       |
| FastAPI service      | ~40–100ms        |

---

## 3. The Product Shift: From Gallery to Collaboration

The real unlock was realizing Lumina shouldn't just be a personal gallery—it should be a **collaborative hub**. I introduced **Collaborative Events**. 

Imagine a wedding: The host shares a QR code. Guests upload photos. Instead of scrolling through thousands of strangers, a guest can simply **take a selfie**. Lumina uses that selfie to instantly perform a vector search, finding every photo they appear in within that specific event.

---

# Architecture Overview

At a high level, the system operates as a distributed pipeline. The goal is to move heavy computation off the main thread while maintaining strict control over data locality.

```text
       [  CLIENT / USER  ]
               ↕
      ┌─────────────────┐
      │  BUN / ELYSIA   │ <───┐
      │  (The Waiter)   │     │
      └────────┬────────┘     │
               │              │
        1. Adds Job           │   [ THE SHARED PANTRY ]
               ▼              │   (Postgres DB & Storage)
      ┌─────────────────┐     │           ↕
      │ BULLMQ / REDIS  │     │─── Both talk here to
      │  (To-Do List)   │     │    save & get files
      └────────┬────────┘     │
               │              │
        2. Picks up Job       │
               ▼              │
      ┌─────────────────┐     │
      │     WORKER      │ <───┘
      │   (The Chef)    │
      └────────┬────────┘
               │
        3. Asks for help
               ▼
      ┌─────────────────┐
      │   FASTAPI ML    │
      │ (The Specialist)│
      └─────────────────┘
```

I opted for a manual monorepo using **Bun Workspaces**. Instead of taking on the overhead of tools like Turborepo, logic is shared simply through a `packages/` directory, centralizing Prisma models and storage abstractions.

---

# The Processing Pipeline

AI isn’t a single operation; it’s a multi-stage background pipeline.

## 1. Image Optimization
We use `Sharp` to generate a 2000px WebP version. This reduces bandwidth significantly and keeps the UI snappy without forcing the browser to load 10MB originals.

```typescript
import sharp from "sharp";

/**
 * Optimizes the image for the web (WebP, max 2000px dimension)
 */
export const createWebPVersion = async (imageBuffer: Buffer): Promise<Buffer> => {
    return await sharp(imageBuffer)
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
};
```

## 2. Perceptual Hashing (Duplicate Detection)
To identify "visual duplicates," we calculate a 64-bit **dHash**. This catches resized or re-compressed versions of the same photo by resizing to 9x8 and comparing adjacent pixel brightness.

```typescript
/**
 * Calculates a 64-bit dHash for perceptual duplicate detection.
 * Resizes to 9x8, converts to grayscale, and compares adjacent pixels.
 */
export const calculatePerceptualHash = async (imageBuffer: Buffer): Promise<string> => {
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
    
    // Convert binary string to hexadecimal
    return BigInt(`0b${hash}`).toString(16).padStart(16, "0");
};
```

## 3. Face Embeddings
The worker calls the FastAPI service, which extracts **512-dimensional embeddings** using the **InsightFace `buffalo_l`** model. This model offers a fantastic balance of accuracy vs. speed and is robust to lighting variations.

---

# PostgreSQL Face Similarity Search Without pgvector

Most systems would reach for `pgvector`. I deliberately chose not to, ensuring the core logic remains **infrastructure-agnostic**. Lumina can run on *any* standard PostgreSQL instance (Neon, Supabase, or self-hosted) without custom extensions.

## Pure SQL Cosine Similarity
We store embeddings as standard `Float[]` arrays and calculate distance entirely on the fly using `unnest()` and standard arithmetic:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Finds similar faces using pure SQL Cosine Similarity calculation.
 * Does not require pgvector extension.
 */
export const findSimilarFaces = async (personId: string, threshold: number = 0.45, limit: number = 10) => {
    // We use prisma.$queryRaw to execute the unnesting and math logic directly in Postgres
    const similarFaces = await prisma.$queryRaw`
        WITH distances AS (
            SELECT
                f.face_id,
                f.image_id,
                (
                    SELECT 1.0 - (
                        SUM(u1.val * u2.val) / (SQRT(SUM(u1.val * u1.val)) * SQRT(SUM(u2.val * u2.val)))
                    )
                    FROM unnest(f.embedding) WITH ORDINALITY AS u1(val, idx)
                    JOIN unnest(p_faces.embedding) WITH ORDINALITY AS u2(val, idx) ON u1.idx = u2.idx
                ) as distance
            FROM faces f, faces p_faces
            WHERE p_faces.person_id = ${personId}::uuid
              AND f.person_id IS DISTINCT FROM ${personId}::uuid -- Don't compare person to themselves
        )
        SELECT face_id, image_id, distance
        FROM distances
        WHERE distance <= ${threshold}
        ORDER BY distance ASC
        LIMIT ${limit};
    `;

    return similarFaces;
};
```

### Tradeoffs
- **Pros**: Zero extensions, fully portable, zero vendor lock-in.
- **Cons**: O(n) scans per query. However, since searches are usually scoped per event or album, the effective dataset stays small enough for this approach to remain lightning-fast.

---

# System Reliability & Backpressure

## Job Reliability (The Unsexy Part)
Background systems fail in the real world. We use **BullMQ** to handle the heavy lifting:
- **Retries**: Exponential backoff for ML service timeouts.
- **Idempotency**: Jobs can be retried safely without duplicating database records or storage writes.
- **Error Compensation**: If a storage write succeeds but the DB update fails, the system compensates by retrying the failed step rather than assuming a perfect transaction across distributed systems.

## Concurrency & Backpressure
A single user uploading 500 photos shouldn't take down the ML service. We implement strict backpressure:
- **Queue concurrency** is capped at the worker level to prevent overwhelming the FastAPI service.
- **Worker scaling** can be adjusted dynamically; adding more workers horizontally increases throughput without changing the core code.

---

# Bring Your Own Storage (BYOS)

Lumina’s core philosophy is that the platform should not own your data. Each Lumina album can define its own storage backend (Local, Cloudflare R2, or S3). The worker pipeline dynamically initializes the provider based on the album's config:

```typescript
const { provider } = getStorageProvider(image, albumStorageConfig);
```

### Where does the data live?
- **Images**: Remain in the user's defined storage (BYOS). Lumina never holds your high-res originals hostage.
- **Intelligence**: Facial embeddings (the "digital fingerprints") and metadata are stored in Lumina's Postgres database. This allows us to perform identity searches while you maintain control of the source files.

---

# Measuring the Cost of AI

AI is compute-intensive. Lumina tracks usage via **Compute Units**:
- **Face detection**: Cost proportional to the number of faces detected.
- **Storage**: Exact byte tracking for data delta.

We use middleware to verify quotas before jobs are even enqueued:

```typescript
/**
 * Middleware to ensure the user has not exceeded their compute quota before processing.
 */
export const quotaMiddleware = async (c: Context) => {
    const userId = (c.store as any).user?.user_id; 
    if (!userId) return;

    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        include: { plan: true }
    });

    if (!user || !user.plan) {
        return new Response(JSON.stringify({ error: "No active plan found." }), { status: 403 });
    }

    // Calculate usage for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const computeUsage = await prisma.usage_logs.aggregate({
        _sum: { quantity: true },
        where: {
            user_id: userId,
            resource: "compute",
            timestamp: { gte: startOfMonth }
        }
    });

    if ((computeUsage._sum.quantity || 0) >= user.plan.compute_units_per_month) {
        return new Response(
            JSON.stringify({ error: "Compute quota exceeded. Please upgrade your plan." }), 
            { status: 429 }
        );
    }
};

/**
 * Helper to log usage after a successful job/upload.
 */
export const logUsage = async (userId: string, operation: string, cost: number = 1) => {
    await prisma.usage_logs.create({
        data: {
            user_id: userId,
            resource: operation === "upload" ? "storage" : "compute",
            operation: operation,
            quantity: cost,
        }
    });
};
```

---

# Final Thoughts

Lumina isn't just about face recognition; it's about how to design systems that combine multiple ecosystems (JS + Python) while remaining portable and vendor-neutral. By treating AI as a first-class system concern rather than a bolt-on feature, we built something that feels like magic but is grounded in solid engineering.

The biggest lesson learned? **Most of the complexity wasn’t in the model—it was in making the system reliable, scalable, and fast enough to feel like magic.**