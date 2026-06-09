# NexQA

Prototype React untuk NexQA. Area kerja utama di aplikasi saat ini adalah **Clarity Platform**, yaitu workspace quality governance yang sedang diarahkan bertahap menuju integrasi AI-QA-LAB.

Scope terdekat tidak lagi mengejar integrasi besar sekaligus. Fokus implementasi `dev` saat ini diperkecil ke **test case management** dan **defect management** terlebih dahulu, lalu area lain menyusul setelah fondasi workflow ini stabil.

Issue scope saat ini: [#4 Phase 1: Focus Clarity Platform scope on test case and defect management](https://github.com/hambaliFadib/clarity-verification-platform/issues/4).

## Jalankan

```bash
npm.cmd install
npm.cmd run dev
```

Lalu buka URL lokal yang muncul dari Vite.

## Status Project

- Branch kerja utama: `dev`.
- Brand aplikasi: NexQA.
- Workspace/area produk di sidebar: Clarity Platform.
- Kondisi frontend: prototype React + Vite dengan data mock lokal.
- Kondisi backend: scaffold awal database Neon, belum ada API production.
- Integrasi AI-QA-LAB: masih menjadi arah besar, belum menjadi scope implementasi langsung.

## Neon Database

Jalankan wizard Neon:

```bash
npm.cmd run neon:init
```

Jika CLI menunggu login, selesaikan browser auth secara lokal atau set `NEON_API_KEY` terlebih dahulu. Setelah Neon project dibuat, isi `DATABASE_URL` di `.env.local`, lalu cek koneksi:

```bash
npm.cmd run db:smoke
```

## Fokus Fase 1

Fase pertama dipusatkan pada workflow QA yang paling konkret di project ini:

- Test case management: daftar test case, detail test case, step, status, komentar, dan riwayat perubahan.
- Defect management: daftar defect, pelaporan defect, status/severity/priority, dan hubungan defect dengan test case.
- Hubungan test case dan defect sebagai fondasi sebelum masuk ke integrasi AI-QA-LAB yang lebih luas.

Area seperti Requirements, Test Runs, My Work, Settings, dan orkestrasi AI-QA-LAB tetap ada sebagai arah produk, tetapi untuk saat ini menjadi area pendukung atau fase berikutnya.

## Fitur Demo Saat Ini

- Navigasi React untuk My Work, Requirements, Test Cases, Test Runs, Defects, dan Settings placeholder.
- Mock create project, create requirement, create work item, new test run, report defect, edit test case, manage team, dan post comment.
- Detail test case dengan tab General, Run History, Change History, Defects, dan Comments.
- Search/filter lokal, action menu, modal form, expandable steps, toast feedback, dan data table/kanban sesuai arah visual Figma.

## Struktur

- `src/components` komponen reusable untuk layout, modal, dan UI primitives.
- `src/pages` halaman utama NexQA, termasuk halaman Test Cases dan Defects yang menjadi fokus fase 1.
- `src/hooks/useClarityDemo.js` state dan aksi demo lokal.
- `src/services` adapter data. Saat backend siap, ganti mock repository ke API call.
- `src/data/mockData.js` data dummy untuk demo.
- `.env.example` contoh konfigurasi `VITE_API_BASE_URL`.
- `server` scaffold database Neon server-only.
