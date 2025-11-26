# User Credentials untuk Testing

## Role: Pengurus (Administrator)
- Username: `admin`
- Password: `admin`
- Akses: Full access ke semua fitur
  - Dashboard (analytics, statistics)
  - Student Management (CRUD)
  - Teacher Mode (record activities)

## Role: Guru (Teacher)
- Username: `guru1` atau `guru2`
- Password: `guru123`
- Akses: Teacher mode only
  - Catat aktiviti hafalan pelajar
  - Lihat history aktiviti
  - Tidak bisa akses dashboard atau student management

## Role: Orang Tua (Parent)
- Username: `parent1`, `parent2`, `parent3`, `parent4`, atau `parent5`
- Password: `parent123`
- Akses: View only untuk progress anak
  - Lihat profil anak (current juz, surah, pages)
  - Lihat chart progress dan statistik
  - Lihat semua aktiviti hafalan anak
  - Hanya ada tombol logout (read-only access)
  
### Parent-Student Mapping:
- `parent1` → Maryam Khan
- `parent2` → Dawud Rahman
- `parent3` → Fatima Malik
- `parent4` → Asma Ahmed
- `parent5` → Hassan Siddiqui

## Sistem Role-Based Access Control

Sistem ini menggunakan 3 role:
1. **Pengurus**: Full access administrator
2. **Guru**: Terbatas ke teacher mode untuk catat aktiviti
3. **Orang Tua**: Read-only access untuk lihat progress anak

### Redirect Behavior setelah Login:
- **Pengurus** → Dashboard (`/dashboard`)
- **Guru** → Teacher Mode (`/teachers`)
- **Orang Tua** → Parent Dashboard (`/parent`)

### Authorization Rules:
- Dashboard: Hanya **pengurus**
- Students Management: Hanya **pengurus**
- Teacher Mode: **Pengurus** dan **Guru**
- Activities CRUD: **Pengurus** dan **Guru**
- Parent Dashboard: Hanya **Orang Tua** (view only untuk anak yang terhubung)
