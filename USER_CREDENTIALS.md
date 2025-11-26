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
- Belum diimplementasi
- Akan dikembangkan nanti

## Sistem Role-Based Access Control

Sistem ini menggunakan 3 role:
1. **Pengurus**: Full access administrator
2. **Guru**: Terbatas ke teacher mode untuk catat aktiviti
3. **Orang Tua**: Reserved untuk future development

### Redirect Behavior setelah Login:
- **Pengurus** → Dashboard (`/dashboard`)
- **Guru** → Teacher Mode (`/teachers`)
- **Orang Tua** → Root path (temporary, belum ada fitur)

### Authorization Rules:
- Dashboard: Hanya **pengurus**
- Students Management: Hanya **pengurus**
- Teacher Mode: **Pengurus** dan **Guru**
- Activities CRUD: **Pengurus** dan **Guru**
