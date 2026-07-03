To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

## TODO List
- menambahkan endpoint create data untuk menu dengan user sandyowner organisasi Warung Bebek Kerto

open http://localhost:3000



🔐 Auth & Profile
POST /api/auth/register - Daftar user baru.
POST /api/auth/login - Login (menghasilkan session).
POST /api/auth/logout - Hapus session.
GET /api/users/me - Ambil data profil user yang sedang login.


🏢 Organization & Member
POST /api/organizations - Buat organisasi (restoran) baru.
GET /api/organizations - List organisasi milik user.
POST /api/organizations/:orgId/invitations - Undang member via email.
POST /api/invitations/accept - Terima undangan (menjadi member).
GET /api/organizations/:orgId/members - List member organisasi.


🏪 Master Data (Cabang)
CRUD /api/organizations/:orgId/branches - Kelola cabang.
CRUD /api/branches/:branchId/tables - Kelola meja (dining tables).
CRUD /api/branches/:branchId/time-slots - Kelola jam buka.

🍔 Catalog (Menu)
CRUD /api/organizations/:orgId/categories - Kelola kategori menu.
CRUD /api/organizations/:orgId/taxes - Kelola pajak (PPN, dll).
CRUD /api/organizations/:orgId/attributes - Kelola atribut (misal: Ukuran, Level Pedas).
CRUD /api/organizations/:orgId/items - Kelola menu utama.
CRUD /api/items/:itemId/variations - Kelola variasi (Small, Large).
CRUD /api/items/:itemId/extras - Kelola ekstra (Extra Shot).
CRUD /api/items/:itemId/addons - Kelola addon.

🛒 Order & Transaction (Inti Bisnis)
GET /api/organizations/:orgId/public-menu - Menu publik untuk customer (Read-only).
POST /api/organizations/:orgId/orders - Checkout / Buat pesanan baru.
GET /api/orders - List pesanan (untuk kasir atau history customer).
GET /api/orders/:id - Detail pesanan.
PATCH /api/orders/:id/status - Update status pesanan (Pending -> Processing -> Done).
POST /api/orders/:id/transactions - Catat pembayaran.
