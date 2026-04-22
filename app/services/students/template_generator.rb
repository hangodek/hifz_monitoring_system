module Students
  class TemplateGenerator
    def initialize(juz_30_surahs:)
      @juz_30_surahs = Array(juz_30_surahs)
    end

    def generate
      package = Axlsx::Package.new
      workbook = package.workbook
      
      # Define styles
      header_style = workbook.styles.add_style(
        bg_color: "4472C4",
        fg_color: "FFFFFF",
        b: true,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true }
      )
      
      example_style = workbook.styles.add_style(
        bg_color: "E7E6E6",
        alignment: { horizontal: :left, vertical: :center }
      )
      
      workbook.add_worksheet(name: "Import Siswa") do |sheet|
        # Header row - Urutan: NISN, No Induk, Nama, Gender, dst
        base_headers = [
          "NISN",
          "No Induk*",
          "Nama Lengkap*",
          "Gender* (Laki-laki/Perempuan)",
          "Tempat Lahir*",
          "Tanggal Lahir* (YYYY-MM-DD)",
          "Nama Ayah*",
          "Nama Ibu*",
          "No HP Orang Tua",
          "Alamat",
          "Kelas* (7A-12D)",
          "Status* (Aktif/Tidak Aktif)",
          "Juz Hafalan Saat Ini* (1-30)",
          "Surah Hafalan Saat Ini*"
        ]

        juz_30_headers = @juz_30_surahs.map { |surah| juz_30_column_name(surah) }
        sheet.add_row(base_headers + juz_30_headers, style: header_style)
        
        # Example rows (5 siswa) with different Juz 30 patterns.
        base_examples = [
          ["320120010001", "S-2026-001", "Ahmad Fauzan", "Laki-laki", "Bandung", "2012-02-10", "Budi Fauzan", "Siti Aminah", "081210000001", "Jl. Cendana 1", "7A", "Aktif", "30", "An-Naba'"],
          ["320120010002", "S-2026-002", "Naila Putri", "Perempuan", "Bekasi", "2011-09-21", "Rizal Putra", "Nur Aisyah", "081210000002", "Jl. Melati 5", "7B", "Aktif", "30", "An-Nazi'at"],
          ["320120010003", "S-2026-003", "Rafi Maulana", "Laki-laki", "Depok", "2012-05-14", "Deni Maulana", "Fitri Handayani", "081210000003", "Jl. Kenanga 3", "8A", "Aktif", "30", "Abasa"],
          ["320120010004", "S-2026-004", "Alya Rahma", "Perempuan", "Bogor", "2011-12-01", "Irfan Rahma", "Dewi Lestari", "081210000004", "Jl. Anggrek 7", "8B", "Aktif", "30", "At-Takwir"],
          ["320120010005", "S-2026-005", "Farhan Akbar", "Laki-laki", "Jakarta", "2012-07-30", "Hendra Akbar", "Lina Marlina", "081210000005", "Jl. Mawar 9", "9A", "Aktif", "30", "Al-Infitar"]
        ]

        status_patterns = [
          ->(index) { index < 37 ? "tuntas" : "belum_tuntas" },
          ->(index) { index < 25 ? "tuntas" : "belum_tuntas" },
          ->(index) { index < 15 ? "tuntas" : "belum_tuntas" },
          ->(index) { index.even? ? "tuntas" : "belum_tuntas" },
          ->(_index) { "belum_tuntas" }
        ]

        base_examples.each_with_index do |base_example, row_index|
          juz_30_example = @juz_30_surahs.map.with_index do |_surah, index|
            status_patterns[row_index].call(index)
          end

          sheet.add_row(base_example + juz_30_example, style: example_style)
        end
        
        # Set column widths for better readability
        base_widths = [15, 12, 20, 22, 15, 18, 20, 20, 17, 30, 10, 16, 25, 25]
        juz_30_widths = Array.new(@juz_30_surahs.size, 22)
        sheet.column_widths(*(base_widths + juz_30_widths))
      end
      
      package.to_stream.read
    end

    private

    def juz_30_column_name(surah)
      "Juz 30 - #{surah} (tuntas/belum_tuntas)"
    end
  end
end
