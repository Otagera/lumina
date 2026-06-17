# Entity Relationship Diagram

```mermaid
erDiagram
    users {
        UUID    user_id         PK
        TEXT    email           UK
        TEXT    password
        TEXT    plan_name
        UUID    plan_id         FK
        JSONB   preferences
        JSONB   email_preferences
    }

    plans {
        UUID    id              PK
        TEXT    name            UK
        INT     storage_mb
        INT     compute_units_per_month
        TEXT    price_usd
        TEXT    price_ngn
        BOOL    is_highlighted
        JSONB   features
        INT     order
    }

    albums {
        UUID    album_id        PK
        TEXT    album_name
        UUID    created_by      FK
        UUID    storage_config_id FK
        UUID    cover_image_id  FK
        TEXT    share_token     UK
        TEXT    shared_link
        TEXT    qr_color
        TEXT    qr_logo_url
        TSTZ    creation_date
        TSTZ    deleted_at
    }

    album_settings {
        UUID    album_id        PK "FK → albums"
        BOOL    is_event
        BOOL    requires_approval
        TEXT    tagging_policy
        TSTZ    expires_at
        BOOL    allow_guest_uploads
        TEXT    webhook_url
        BOOL    semantic_search_enabled
        BOOL    curating
        BOOL    delivered
        TEXT    tagline
        JSONB   theme_config
    }

    album_members {
        UUID    id              PK
        UUID    album_id        FK
        UUID    user_id         FK
        TEXT    role
        TEXT    passcode
        TEXT    invite_token    UK
        TSTZ    expires_at
        TSTZ    created_at
    }

    album_images {
        UUID    album_images_id PK
        UUID    album_id        FK
        UUID    image_id        FK
    }

    images {
        UUID    image_id        PK
        TEXT    image_path
        TEXT    optimized_path
        TEXT    storage_provider
        TEXT    storage_key
        TEXT    status
        INT     original_width
        INT     original_height
        INT     size
        INT     optimized_size
        TEXT    file_hash
        TEXT    perceptual_hash
        TEXT    rejection_reason
        UUID    uploaded_by     FK
        UUID    guest_session_id
        VECTOR  embedding
        TEXT    embedding_model
        TSTZ    expires_at
        TSTZ    upload_date
        TSTZ    update_date
        TSTZ    deleted_at
    }

    faces {
        INT     face_id         PK
        UUID    image_id        FK
        UUID    person_id       FK
        REAL[]  embedding
        JSONB   bounding_box
        FLOAT   det_score
        TSTZ    processed_time
    }

    people {
        UUID    person_id       PK
        TEXT    name
        UUID    user_id         FK
        TSTZ    created_at
        TSTZ    updated_at
    }

    ignored_faces {
        INT     id              PK
        UUID    person_id       FK
        INT     face_id         FK
        TSTZ    created_at
    }

    reactions {
        UUID    id              PK
        UUID    image_id        FK
        TEXT    type
        UUID    user_id
        UUID    guest_session_id
        TSTZ    created_at
    }

    user_storage_configs {
        UUID    id              PK
        UUID    user_id         FK
        TEXT    provider
        TEXT    bucket
        TEXT    endpoint
        TEXT    access_key_id
        TEXT    secret_access_key
        TEXT    region
        TSTZ    created_at
        TSTZ    updated_at
    }

    usage_logs {
        INT     id              PK
        UUID    user_id         FK
        UUID    album_id
        TEXT    resource
        TEXT    operation
        INT     quantity
        JSONB   metadata
        TSTZ    timestamp
    }

    notifications {
        UUID    id              PK
        UUID    user_id         FK
        TEXT    type
        BOOL    is_read
        JSONB   metadata
        TSTZ    created_at
    }

    webhook_events {
        UUID    id              PK
        UUID    album_id        FK
        TEXT    event_type
        JSONB   payload
        TEXT    status
        INT     attempts
        TSTZ    created_at
    }

    refresh_tokens {
        UUID    id              PK
        TEXT    token           UK
        UUID    user_id         FK
        TSTZ    expires_at
        TSTZ    created_at
    }

    password_resets {
        UUID    id              PK
        TEXT    token           UK
        UUID    user_id         FK
        TSTZ    expires_at
        TSTZ    created_at
    }

    %% ── User & Plans ──────────────────────────────────────
    users                   }o--|| plans                  : "subscribes to"
    users                   ||--o{ albums                 : "owns"
    users                   ||--o{ images                 : "uploads"
    users                   ||--o{ people                 : "manages"
    users                   ||--o{ user_storage_configs   : "configures"
    users                   ||--o{ usage_logs             : "incurs"
    users                   ||--o{ album_members          : "joins"
    users                   ||--o{ notifications          : "receives"
    users                   ||--o{ refresh_tokens         : "holds"
    users                   ||--o{ password_resets        : "requests"

    %% ── Albums ────────────────────────────────────────────
    albums                  ||--|| album_settings         : "has settings"
    albums                  ||--o{ album_images           : "contains"
    albums                  ||--o{ album_members          : "has members"
    albums                  ||--o{ webhook_events         : "emits"
    albums                  }o--o| images                 : "cover image"
    albums                  }o--o| user_storage_configs   : "stored in"

    %% ── Images ────────────────────────────────────────────
    album_images            }o--|| images                 : "references"
    images                  ||--o{ faces                  : "contains"
    images                  ||--o{ reactions              : "receives"

    %% ── Faces & People ────────────────────────────────────
    faces                   }o--o| people                 : "belongs to"
    people                  ||--o{ ignored_faces          : "ignores"
    faces                   ||--o{ ignored_faces          : "ignored via"
```

## Notes

- `tagging_policy` — `HOST_ONLY` | `GUESTS_SELF` | `ANYONE`
- `album_members.role` — `VIEWER` | `CONTRIBUTOR` | `ADMIN`
- `images.status` — `PENDING` | `APPROVED` | `REJECTED`
- `images.embedding` — `vector(512)` (pgvector); model tracked in `embedding_model`
- `faces.embedding` — `REAL[]` (InsightFace 512-dim ArcFace)
- `album_settings.theme_config` — `JSONB` storing `ThemeConfig` (accent, font, heroLayout, gridStyle, cornerRadius, backgroundTexture, branding, heroMode, heroSlideshow, etc.)
- `album_settings.tagging_policy` defaults to `HOST_ONLY`
- `images.expires_at` — free-tier 14-day TTL; `NULL` on paid plans
- `webhook_events.status` — `PENDING` | `SUCCESS` | `FAILED`
