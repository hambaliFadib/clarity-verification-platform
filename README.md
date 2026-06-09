# NexQA React Demo

Prototype tampilan NexQA berbasis React untuk kebutuhan demo. NexQA disiapkan sebagai AI Assisted Quality Governance platform yang nanti akan diintegrasikan dengan AI-QA-LAB untuk eksekusi, analisis, dan manajemen quality governance berbasis project.

## Jalankan

```bash
npm.cmd install
npm.cmd run dev
```

Lalu buka URL lokal yang muncul dari Vite.

## Neon Database

Jalankan wizard Neon:

```bash
npm.cmd run neon:init
```

Jika CLI menunggu login, selesaikan browser auth secara lokal atau set `NEON_API_KEY` terlebih dahulu. Setelah Neon project dibuat, isi `DATABASE_URL` di `.env.local`, lalu cek koneksi:

```bash
npm.cmd run db:smoke
```

## Fitur Demo

- Navigasi React untuk My Work, Requirements, Test Cases, Test Runs, Defects, dan Settings placeholder.
- Mock create project, create requirement, create work item, new test run, report defect, edit test case, manage team, dan post comment.
- Detail test case dengan tab General, Run History, Change History, Defects, dan Comments.
- Search/filter lokal, action menu, modal form, expandable steps, toast feedback, dan data table/kanban sesuai arah visual Figma.

## Struktur

- `src/components` komponen reusable untuk layout, modal, dan UI primitives.
- `src/pages` halaman utama NexQA.
- `src/hooks/useClarityDemo.js` state dan aksi demo lokal.
- `src/services` adapter data. Saat backend siap, ganti mock repository ke API call.
- `src/data/mockData.js` data dummy untuk demo.
- `.env.example` contoh konfigurasi `VITE_API_BASE_URL`.
- `server` scaffold database Neon server-only.
