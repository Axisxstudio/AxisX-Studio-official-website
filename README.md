# AxisX - Premium Web Development Agency

A Next.js application with a public-facing studio site and a protected admin dashboard. The app now uses Supabase only for database, authentication, and media storage.

## Technology Stack

- Next.js App Router
- Tailwind CSS
- Supabase Database, Auth, and Storage
- Lucide React
- React Hot Toast
- React Dropzone

## Local Setup

1. Add your Supabase project values to [`.env.local`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/.env.local).
2. Apply the schema in [`SUPABASE_MIGRATION_SCHEMA.sql`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/SUPABASE_MIGRATION_SCHEMA.sql) to your Supabase project.
3. Create the `media` storage bucket in Supabase and align its policies with your public upload/admin management needs.
4. Run `npm run dev`.
5. Open `http://localhost:3000/login` to access the admin dashboard.

## Project Notes

- Supabase client setup lives in [`src/lib/supabase.ts`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/src/lib/supabase.ts).
- Auth and data helpers live in [`src/lib/supabase-api.ts`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/src/lib/supabase-api.ts).
- Admin session logic lives in [`src/lib/admin.ts`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/src/lib/admin.ts).
- Shared record types live in [`src/types/index.ts`](/c:/Users/Dell/Desktop/Tech%20Axis/axisx/src/types/index.ts).
