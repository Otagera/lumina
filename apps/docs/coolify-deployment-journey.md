# Deploying Lumina: A Scalable AI Photo App on Hetzner & Coolify

When it comes to deploying side projects, the modern indie hacker is spoiled for choice. I have used platforms like Railway and Render that offer a smooth "git push to deploy" experience. But as your architecture grows—especially when dealing with databases, background workers, and AI services—those managed platforms can quickly burn a hole in your wallet with usage-based billing.

For [Lumina](https://lumina.otagera.xyz/) (an AI-powered photo sharing and face-matching application), I wanted the magic of PaaS. Railway could have worked, but the educational value of managing my own server, plus the absolute cost predictability of a VPS, made me reconsider. Previously, my deployments involved manually SSHing into a GCP instance, running `git pull`, and restarting `pm2`. It was tedious.

This time, I chose the **Hetzner CX33 plan (4 vCPUs, 8GB RAM, 80GB NVMe for ~$7/month)** paired with [**Coolify**](https://coolify.io/). It's like having your own personal Vercel and Railway, but for a fraction of the cost and with total control over the environment.

Here is the technical breakdown of how I deployed a Monorepo containing a React Dashboard, a lightweight Guest App, Bun API, Python AI Service, BullMQ Worker, Postgres (pgvector), and Redis—starting from absolute scratch, and the trials I faced along the way.

---

## Part 1: The Setup (From Bare Metal to First Deploy)

If you are moving from a managed PaaS to a VPS, the initial setup can seem daunting. Here is the step-by-step guide on how I bridged the gap using Coolify, designed so even a beginner can follow along.

### Step 1: Provisioning the Server & DNS
Before you can install anything, you need a server and a way to reach it.

1. **Get a Server:** I signed up for Hetzner Cloud and created a new project. I selected the **CX33** instance (4 vCPU, 8GB RAM) running **Ubuntu 22.04**. I chose a location close to my target audience and selected IPv4 (Coolify works best with an IPv4 address). 
2. **Get the IP Address:** Once the server booted up (it takes seconds), Hetzner gave me a public IP address (e.g., `123.45.67.89`).
3. **Configure DNS (Cloudflare):** I logged into Cloudflare, where my domain (`otagera.xyz`) is managed. I created a new **A Record**:
   * Name: `admin` (This creates `admin.otagera.xyz` for the Coolify dashboard).
   * Content/IPv4 address: Paste the Hetzner IP address here.
   * Proxy status: **DNS Only (Grey Cloud)** for the initial setup.

### Step 2: Installing Coolify
Coolify installs its entire orchestration stack (Docker, Traefik proxy, its own database, and dashboard) with a single command.

1. Open your terminal and SSH into your new Hetzner server using the password or SSH key Hetzner provided:
   ```bash
   ssh root@123.45.67.89
   ```
2. Run the official Coolify installation script:
   ```bash
   curl -fsSL https://get.coollabs.io/coolify/install.sh | bash
   ```
3. Go grab a coffee. This process takes 5-10 minutes. When it finishes, it will tell you Coolify is running at `http://<server-ip>:8000`.

### Step 3: Securing the Dashboard
1. Open a browser and visit `http://123.45.67.89:8000`.
2. Create your admin account and complete the onboarding.
3. In the Coolify dashboard, navigate to **Settings** -> **General**.
4. Change the "Instance URL" from the default to your secure domain: `https://admin.otagera.xyz`. 
5. Save the settings. Coolify will automatically talk to Let's Encrypt, grab an SSL certificate, and redirect you to the secure `https` version of your dashboard.

### Step 4: Configuring the Resources
Lumina is a monorepo, meaning both the frontend and backend live in the same Git repository. My initial instinct was to deploy everything using one giant `docker-compose.yml`. I quickly learned that frontend and backend architectures require entirely different build processes. 

I navigated to **Projects** -> **Add New Project**, connected my GitHub repository, and set up three distinct resources:

#### 1. The Dashboard (Host Frontend)
For the React/Vite dashboard, I didn't want to use Docker. I wanted it served quickly and cheaply as static files.
* I clicked **Add Resource** -> **GitHub Repository**.
* I chose my `Lumina` repo and selected the **Static** build pack.
* Under **Configuration -> Build Settings**, I set:
  * **Base Directory:** `apps/client`
  * **Build Command:** `bun run build`
  * **Output Directory:** `dist`
* Under **Configuration -> General**, I set the **FQDN (Domain):** to `https://lumina.otagera.xyz`.

#### 2. The Guest App (PWA Frontend)
Similarly, the lightweight guest experience is deployed as a static PWA.
* I clicked **Add Resource** -> **GitHub Repository**.
* I chose the same `Lumina` repo and selected the **Static** build pack.
* Under **Configuration -> Build Settings**, I set:
  * **Base Directory:** `apps/app`
  * **Build Command:** `bun run build`
  * **Output Directory:** `dist`
* Under **Configuration -> General**, I set the **FQDN (Domain):** to `https://lumina-app.otagera.xyz`.

#### 3. The Backend Stack (API, DB, Worker, AI)
For the backend, I needed Docker to orchestrate my database, Redis cache, Bun API, and Python AI service.
* I clicked **Add Resource** -> **GitHub Repository**.
* I chose my `Lumina` repo and selected the **Docker Compose** build pack.
* Coolify automatically found my root `docker-compose.yml` file and parsed the services (`db`, `redis`, `api`, `worker`, `ai_service`).
* In the configuration panel, I found the **`api` service** and set its **FQDN** to `https://lumina-api.otagera.xyz`. 

By assigning a public domain *only* to the `api` service in Coolify, the Database, Redis, Worker, and AI Service remain safely hidden behind the firewall on the internal Docker network. They can talk to each other, but the outside world cannot touch them.

With all my environment variables (database passwords, API keys, etc.) pasted into the Coolify dashboard under the **Environment Variables** tab for both resources, I hit deploy. 

And that’s where the real journey began.

---

## Part 2: The Trials of Production

### Trial 1: The Prisma "Drift" Dilemma

The first deployment of the API failed during the startup command: `bunx prisma db seed`.
The logs showed: `Error: The table public.plans does not exist in the current database.`

**What happened?**
During local development, it's easy to rely on `prisma db push` to force the database schema to match your `schema.prisma`. In production, I use `prisma migrate deploy`, which strictly runs the SQL files located in the `prisma/migrations` folder.

I had added several new tables (like `plans` and `notifications`) to my schema, but had forgotten to generate the migration files. Prisma detected a "Drift" between the schema and the migration history.

**The Fix:**
I synchronized the schema locally. By running a forceful migration generation, I wiped the local dev DB, allowed Prisma to recalculate the state, and generated the missing SQL.

```bash
cd apps/api
bunx prisma migrate dev --name add_plans_and_notifications
```
Once the new migration folder was committed and pushed, Coolify automatically pulled it, ran `migrate deploy`, and successfully created the missing tables. This cannot happen again so we don't lose data in production.

---

### Trial 2: Cloudflare SSL and The Nested Subdomain

Industry standards dictate separating your API and Frontend domains and it sort of looks good. Naturally, I went with:
* Frontend: `https://lumina.otagera.xyz`
* API: `https://api.lumina.otagera.xyz`

But hitting the API returned a **Cloudflare Error 526: Invalid SSL Certificate**.

**What happened?**
Cloudflare's free Universal SSL certificate is a wildcard for `*.yourdomain.com`. It covers exactly *one* level of subdomains. It does **not** cover nested subdomains like `*.*.yourdomain.com` unless you pay for an Advanced Certificate Manager.

**The Fix:**
I flattened the architecture to keep everything on the first level which doesn't look as good but it works:
* Frontend: `https://lumina.otagera.xyz`
* API: `https://lumina-api.otagera.xyz`

*(Bonus Nginx issue: My static client started throwing 404 errors when users hit refresh on pages like `/home`. Because it's a Single Page Application (SPA), Nginx couldn't find a `home.html` file. Toggling the "Is SPA" setting in Coolify instantly injected the required `try_files $uri /index.html;` routing rule.)*

---

### Trial 3: Configuration Drift and The Missing Production Config

With the servers running, I tried to upload a photo. First, the browser blocked the request: `Blocked by CORS policy`. Once I fixed that, the API responded with a wildly incorrect upload URL: `http://localhost:undefined/api/v1/public/images/upload-direct-local`.

**What happened?**
Applications with multiple environment blocks (`development`, `test`, `production`) can be notorious for configuration drift. I had been adding new configuration keys to the `development` block as I built features, but never mirrored them to `production`:
1. **CORS:** My `production` config was missing the `cors_origin` field entirely.
2. **The Undefined Port:** The presigned URL generator was falling back to default variables that only existed in development.

**The Fix:**
I updated the production configuration block to explicitly map my public URLs:

```typescript
// packages/config/src/index.config.ts
production: {
  base_api_url: process.env.BASE_API_URL || "https://lumina-api.otagera.xyz",
  elysia_port: process.env.ELYSIA_PORT || 3005,
  cors_origin: process.env.CORS_ORIGIN,
  ai_service_url: "http://ai_service:8000", // Internal Docker network routing
}
```

I also updated the `normalizeImagePath` utility to correctly format URLs for the client. Since production uses a consistent `base_api_url`, I could remove the port logic that was causing the `undefined` issue.

---

### Trial 4: The OOM Server Crash

Just as I thought I was in the clear, the 8GB of RAM on my Hetzner CX33 instance ran out, and the server started freezing completely during deployments. The Coolify dashboard would throw a **504 Gateway Timeout**, and SSH connections would drop. I restarted the server over and over again, same thing, I even stopped the client server thinking that could help but same result. So I asked Gemini to look at what we could do to optimize things.

**What happened?**
So what happened was the Linux Out-Of-Memory (OOM) killer was terminating processes to free memory. My `apps/ai/Dockerfile` was running `pip install -r requirements.txt`, which included `dlib`—a notoriously heavy C++ machine learning library. Compiling `dlib` from source consumes massive amounts of CPU and gigabytes of RAM. The deployment container was eating all 8GB of the server's memory, taking down the database and API containers along with it.

**The Fix (A 3-Part Strategy):**

**1. Swap File**
I added a 4GB swap file to my Hetzner instance as a safety net:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**2. Dependency Pruning**
Gemini audited the Python code and found that `face_utils.py` was exclusively using `insightface`. The `dlib` and `face-recognition` libraries were legacy dependencies that weren't even being imported. I deleted them from `requirements.txt`, dropping build time from 15+ minutes to 2 minutes.

**3. Docker Resource Limits**
Also, memory limits was added to `docker-compose.yml` to prevent any single service from taking down the server:

```yaml
  ai_service:
    build:
      context: .
      dockerfile: apps/ai/Dockerfile
    deploy:
      resources:
        limits:
          memory: 3.5G
        reservations:
          memory: 1.5G
```

---

### Trial 5: The R2 Image URL Bug

With the API running and uploads working, images weren't displaying on the frontend. The browser was trying to load:
```
https://lumina.otagera.xyz/app/apps/api/src/uploads/1777561104304-20251011_092535.jpg
```
A filesystem path disguised as a URL. Meanwhile, the images were actually stored in my Cloudflare R2 bucket.

**What happened?**
Three compounding issues:

1. **Missing R2 Config in Production:** My `production` config was missing the `r2` section entirely. The `StorageService` singleton checks `config[env].r2` to decide between `R2Provider` and `LocalProvider`. Without it, the app always used `LocalProvider`—even though I had `R2_ACCESS_KEY_ID` and `R2_BUCKET` set as environment variables.

2. **Broken Image URL Generation:** `normalizeImagePath()` only transformed paths for development. In production, it returned the raw `image_path` column value—a local filesystem path like `/app/apps/api/src/uploads/filename.jpg`. The frontend prepended its domain to it, creating an invalid URL.

3. **Local Storage Auth Bug:** When using `LocalProvider`, presigned URLs had no authentication. The upload endpoint required either an `Authorization` header or `shareToken`, neither present in the URL—causing `401 Unauthorized` on every upload.

**The Fix:**

I added the `r2` block to production config:
```typescript
r2: {
  access_key_id: process.env.R2_ACCESS_KEY_ID,
  secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  public_url: process.env.R2_PUBLIC_URL,
},
```

Then updated `normalizeImagePath()` to construct proper R2 URLs in production, with a fallback to the API's static serving endpoint:
```typescript
const normalizeImagePath = (image_path, storage_provider?, storage_key?) => {
  const env = config.env || "production";
  const envConfig = config[env];

  if (env === "test" || env === "development") {
    const port = envConfig.elysia_port;
    const baseUrl = port ? `${envConfig.base_api_url}:${port}` : envConfig.base_api_url;
    const filename = image_path.split("/").pop();
    return `${baseUrl}/api/uploads/${filename}`;
  } else {
    const r2PublicUrl = envConfig?.r2?.public_url;

    if (r2PublicUrl && image_path) {
      const filename = storage_key || image_path.split("/").pop();
      return `${r2PublicUrl}/${filename}`;
    }

    // Fallback: point to the API's serving endpoint
    if (image_path) {
      const baseUrl = envConfig.base_api_url || "https://lumina-api.otagera.xyz";
      const filename = storage_key || image_path.split("/").pop();
      return `${baseUrl}/api/uploads/${filename}`;
    }

    return image_path;
  }
};
```

I also had to update every call site to pass `storage_provider` and `storage_key` to `normalizeImagePath()`. And for the auth bug, I implemented JWT-based authentication in presigned URLs—the URL itself became self-authenticating, mirroring how S3/R2 presigned URLs work natively.

---

### Conclusion

Transitioning to Coolify and Docker Compose has completely transformed how Lumina is deployed. I now have a robust, GitOps-driven deployment pipeline running on a ~$7/mo Hetzner CX33 instance.

Working through these issues—from Prisma migrations and Nginx SPA routing to Linux memory management and config drift—has been a valuable learning experience. PaaS platforms like Vercel and Railway are incredible, but occasionally stepping down to the bare metal level is what truly makes you a better engineer.

### Additional Resources
If you are an absolute beginner looking to replicate this setup, the written steps above will get you there, but seeing it in action is invaluable. I highly recommend watching this comprehensive video guide which covers the Hetzner and Coolify setup process in incredible detail:

📺 [**Self-host EVERYTHING with Coolify - Full Guide**](https://www.youtube.com/watch?v=kCRDidMJRsY)
