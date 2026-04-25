require_relative 'config/environment'

puts "Generating test Excel..."
headers = [
  "NISN", "No Induk", "Nama Lengkap*", "Gender (Laki-laki/Perempuan)", "Tempat Lahir",
  "Tanggal Lahir (YYYY-MM-DD)", "Nama Ayah", "No HP Orang Tua", "Alamat", "Kelas* (7A-12D)",
  "Status* (Aktif/Tidak Aktif)"
]
juz_30 = SurahJuzMapping::JUZ_TO_SURAHS[30]
juz_30_headers = juz_30.map { |s| "Juz 30 - #{s} (tuntas/belum_tuntas)" }
all_headers = headers + juz_30_headers

package = Axlsx::Package.new
workbook = package.workbook
workbook.add_worksheet(name: "Import Siswa") do |sheet|
  sheet.add_row(all_headers)
  
  # Row 1: Adiba Azzah (all tuntas)
  student_data = ["123", "456", "Adiba Azzah", "Perempuan", "Jakarta", "2010-01-01", "Ayah", "081", "Alamat", "7A", "Aktif"]
  surah_data = Array.new(37, "tuntas")
  sheet.add_row(student_data + surah_data)
end
package.serialize("test_import.xlsx")

puts "Testing preview..."
file = ActionDispatch::Http::UploadedFile.new({
  filename: 'test_import.xlsx',
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  tempfile: File.new("test_import.xlsx")
})

importer = Students::BulkImporter.new(juz_30_surahs: juz_30)
result = importer.preview(file)
if result[:success]
  puts "Preview successful!"
  data = result[:data].first
  puts "Tuntas count: #{data[:juz_30_statuses].values.count('tuntas')}"
  puts "Total count: #{data[:juz_30_statuses].length}"
else
  puts "Preview failed: #{result[:error]}"
end
