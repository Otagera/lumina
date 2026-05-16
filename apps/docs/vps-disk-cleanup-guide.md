# VPS Emergency Disk Cleanup Guide

This document was created following a critical SQLSTATE[53100] error where the Coolify database could not extend its session table due to the VPS disk being 100% full.

## Phase 1: Aggressive Emergency Cleanup
Run these commands in order via SSH to force-clear hidden space and get the server back online.

### 1. Clear Docker Build Cache
`docker system prune` doesn't always get the deep build cache which can grow to many gigabytes.
```bash
docker builder prune -a -f
```

### 2. Clear System Journal Logs
Linux system logs can sometimes grow to several gigabytes if not rotated.
```bash
sudo journalctl --vacuum-time=1d
```

### 3. Identify the "Space Hog"
Run this to see exactly which Docker sub-folder is consuming the most disk space:
```bash
sudo du -sh /var/lib/docker/* | sort -h
```
*   **`overlay2`**: Old images, layers, or failed build remnants.
*   **`containers`**: Active log files for running containers.
*   **`volumes`**: Your persistent data (Postgres, Redis, user uploads).

---

## Phase 2: Managing AI Service Overhead
The `ai_service` downloads massive models (CLIP, InsightFace) during build. Multiple failed or frequent deployments can leave behind 10GB+ of old layers.

### Emergency Image Purge
If you need space *now* and don't mind a slower first build next time:
```bash
docker image prune -a -f
```

---

## Phase 3: Long-term Maintenance

### 1. External Storage
Ensure all user-uploaded images are being saved to the **Cloudflare R2 bucket** rather than the local VPS disk. Local storage should only be for temporary processing.

### 2. Coolify Cleanup Settings
1.  Go to **Sources** in your Coolify dashboard.
2.  Find **Cleanup Threshold**.
3.  Set it to a high percentage (e.g., **80%**).
4.  Enable **"Auto-cleanup of Docker images/containers"**.

### 3. Disk Requirements
For an AI-heavy stack (Python, ONNX models) + Coolify + Database, a minimum of **40GB-60GB** of disk space is recommended to avoid constant maintenance.
