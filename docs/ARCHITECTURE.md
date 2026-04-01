# AxisX Architecture

## 1) Recommended Folder Structure

- src/app
  - (public routes): home, about, services, projects, feedback, contact
  - login
  - admin
- src/components
  - Navigation, Footer
  - shared UI cards/forms/modals (recommended next step)
- src/context
  - AuthContext
- src/lib
  - supabase.ts (SDK init)
  - supabase-api.ts (auth + data helpers)
  - env.ts (runtime config)
  - admin.ts (admin checks)
  - media.ts (upload/validation helpers)
  - date.ts (timestamp formatting)
- src/types
  - index.ts
- docs
  - ARCHITECTURE.md

## 2) Supabase Data Model

### admins
- uid: string
- email: string
- role: "owner" | "admin"
- createdAt: Timestamp

### contacts
- name: string
- email: string
- phone: string
- subject: string
- message: string
- status: "unread" | "read"
- createdAt: Timestamp

### feedback
- clientName: string
- companyName: string
- email: string
- projectName: string
- message: string
- imageUrls: string[]
- videoUrls: string[]
- consentToPublish: boolean
- createdAt: Timestamp
- updatedAt: Timestamp

### projects
- title: string
- slug: string
- category: string
- clientName: string
- description: string
- technologies: string[]
- coverImageUrl: string
- galleryImageUrls: string[]
- videoUrls: string[]
- isPublished: boolean
- createdAt: Timestamp
- updatedAt: Timestamp

## 3) Supabase Storage Folder Structure

- feedback/
  - submissions/{timestamp-email}/images/{unique-file}
  - submissions/{timestamp-email}/videos/{unique-file}
- projects/
  - {slug-timestamp}/cover/images/{unique-file}
  - {slug-timestamp}/images/{unique-file}
  - {slug-timestamp}/videos/{unique-file}

## 4) App Routing Structure

Public routes:
- /
- /about
- /services
- /projects
- /feedback
- /feedback/new
- /contact

Admin routes:
- /login
- /admin
- /admin/projects
- /admin/feedback
- /admin/contacts
- /admin/settings

Auth behavior:
- Footer lock icon routes to /login
- /admin/* requires signed-in user and membership in admins collection
- No browser-side admin fallback credentials are used in production

## 5) Reusable UI Components List (Current + Suggested)

Current:
- Navigation
- Footer

Suggested next extraction:
- Card
- SectionHeader
- FormField
- UploadDropzone
- AdminDataTable
- ModalLightbox

## 6) Security Notes

- Supabase env values are validated before app init
- Admin access is enforced by checking admins collection
- Media upload type and file-size validation is enforced client-side
- Unique file naming prevents collisions
- Admin deletion also deletes Storage assets
- Apply Supabase Row Level Security policies and storage policies before production deployment
- Public feedback reads should be limited to records with `consentToPublish = true`
