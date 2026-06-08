# Database Map

File ini adalah peta baca sederhana untuk model database Restoki.

Cara membaca relasi:

- `A ||--o{ B` artinya satu data A bisa punya banyak data B.
- Kolom dengan akhiran `Id`, seperti `organizationId`, biasanya menunjuk ke tabel lain.
- Di kode Drizzle, relasi terlihat dari `.references(() => tabel.id)`.

## Alur Besar

```txt
user login
  -> user menjadi member organization
    -> organization punya catalog/menu
      -> catalog dipakai untuk order, promo, dan transaksi
```

## Auth dan Organization

```mermaid
erDiagram
  USER ||--o{ SESSION : has
  USER ||--o{ ACCOUNT : has
  USER ||--o{ MEMBER : joins
  ORGANIZATION ||--o{ MEMBER : has
  ORGANIZATION ||--o{ INVITATION : sends
  USER ||--o{ INVITATION : invites

  USER {
    text id PK
    text name
    text email
    boolean email_verified
  }

  ORGANIZATION {
    text id PK
    text name
    text slug
    text logo
  }

  MEMBER {
    text id PK
    text organization_id FK
    text user_id FK
    text role
  }

  SESSION {
    text id PK
    text user_id FK
    text token
    timestamp expires_at
  }

  ACCOUNT {
    text id PK
    text user_id FK
    text provider_id
  }

  INVITATION {
    text id PK
    text organization_id FK
    text inviter_id FK
    text email
    text status
  }
```

## Catalog

```mermaid
erDiagram
  ORGANIZATION ||--o{ ITEM_CATEGORY : has
  ORGANIZATION ||--o{ TAX : has
  ORGANIZATION ||--o{ ITEM : has
  ORGANIZATION ||--o{ ITEM_ATTRIBUTE : has

  ITEM_CATEGORY ||--o{ ITEM : groups
  TAX ||--o{ ITEM : applies_to
  ITEM ||--o{ ITEM_VARIATION : has
  ITEM_ATTRIBUTE ||--o{ ITEM_VARIATION : defines
  ITEM ||--o{ ITEM_EXTRA : has
  ITEM ||--o{ ITEM_ADDON : base_item
  ITEM ||--o{ ITEM_ADDON : addon_item

  ITEM_CATEGORY {
    int id PK
    text organization_id FK
    text name
    text slug
    text status
    int sort
  }

  TAX {
    int id PK
    text organization_id FK
    text name
    text code
    numeric tax_rate
    text type
    text status
  }

  ITEM {
    int id PK
    text organization_id FK
    int item_category_id FK
    int tax_id FK
    text name
    text slug
    numeric price
    text status
    text item_type
  }

  ITEM_ATTRIBUTE {
    int id PK
    text organization_id FK
    text name
    text status
  }

  ITEM_VARIATION {
    int id PK
    int item_id FK
    int item_attribute_id FK
    text name
    numeric price
    text status
  }

  ITEM_EXTRA {
    int id PK
    int item_id FK
    text name
    numeric price
    text status
  }

  ITEM_ADDON {
    int id PK
    int item_id FK
    int addon_item_id FK
    jsonb addon_item_variation
  }
```

## Contoh Data Nyata

```txt
USER
  Budi

ORGANIZATION
  Kopi Mantap

MEMBER
  Budi adalah owner Kopi Mantap

ITEM_CATEGORY
  Kopi
  Snack

ITEM
  Es Kopi Susu, category: Kopi
  Kentang Goreng, category: Snack

ITEM_ATTRIBUTE
  Size

ITEM_VARIATION
  Small untuk Es Kopi Susu
  Large untuk Es Kopi Susu

ITEM_EXTRA
  Extra Shot untuk Es Kopi Susu

ITEM_ADDON
  Es Kopi Susu bisa tambah Kentang Goreng sebagai addon
```

## Urutan Bikin API

Mulai dari yang paling dekat dengan user:

1. Auth: user bisa login.
2. Organization: user tahu dia masuk restoran mana.
3. Category: restoran bisa membuat kategori menu.
4. Item: restoran bisa membuat menu.
5. Tax, attribute, variation, extra, addon: fitur tambahan untuk menu.
6. Order: customer memilih item dari catalog.

