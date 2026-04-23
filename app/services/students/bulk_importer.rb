require "csv"
require "roo"

module Students
  class BulkImporter
    DEFAULT_HIFZ_PAGE = "1"

    def initialize(juz_30_surahs:)
      @juz_30_surahs = Array(juz_30_surahs)
    end

    def preview(file)
      return { error: "File tidak ditemukan", status: :unprocessable_entity } if file.blank?

      spreadsheet = open_spreadsheet(file)
      return spreadsheet if spreadsheet.is_a?(Hash)

      preview_data = []
      headers = spreadsheet.row(1)

      (2..spreadsheet.last_row).each do |line_number|
        row = spreadsheet.row(line_number)
        next if row.all?(&:blank?)

        row_hash = Hash[headers.zip(row)]
        student_data = build_student_data_for_preview(row_hash, line_number)
        validate_preview_row!(student_data, row_hash)
        preview_data << student_data
      end

      {
        success: true,
        data: preview_data,
        total: preview_data.length,
        valid: preview_data.count { |row| row[:valid] },
        invalid: preview_data.count { |row| !row[:valid] }
      }
    rescue StandardError => e
      { error: "Gagal memproses file: #{e.message}", status: :internal_server_error }
    end

    def bulk_create(raw_students)
      return { error: "Data siswa tidak ditemukan", status: :unprocessable_entity } if raw_students.blank?

      created_students = []
      failed_students = []

      raw_students.each do |raw_student|
        student_params = to_hash(raw_student)

        begin
          student = build_student(student_params)

          if student.save
            import_juz_30_progressions!(student, student_params[:juz_30_statuses])
            student.recalculate_total_juz_memorized!

            created_students << {
              line_number: student_params[:line_number],
              name: student.name,
              id: student.id
            }
          else
            failed_students << {
              line_number: student_params[:line_number],
              name: student_params[:name],
              errors: student.errors.full_messages
            }
          end
        rescue StandardError => e
          failed_students << {
            line_number: student_params[:line_number],
            name: student_params[:name],
            errors: [e.message]
          }
        end
      end

      {
        success: true,
        created: created_students.length,
        failed: failed_students.length,
        created_students: created_students,
        failed_students: failed_students,
        message: "Berhasil membuat #{created_students.length} siswa dari #{raw_students.length} data"
      }
    end

    private

    def open_spreadsheet(file)
      filename = file.original_filename.to_s

      if filename.end_with?(".xlsx")
        Roo::Spreadsheet.open(file.path, extension: :xlsx)
      elsif filename.end_with?(".xls")
        Roo::Spreadsheet.open(file.path, extension: :xls)
      elsif filename.end_with?(".csv")
        Roo::CSV.new(file.path)
      else
        { error: "Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv", status: :unprocessable_entity }
      end
    end

    def build_student_data_for_preview(row_hash, line_number)
      {
        line_number: line_number,
        nisn: row_hash["NISN"]&.to_s&.strip,
        student_number: row_hash["No Induk*"]&.to_s&.strip,
        name: row_hash["Nama Lengkap*"]&.to_s&.strip,
        gender: normalize_import_gender(row_hash["Gender* (Laki-laki/Perempuan)"] || row_hash["Gender* (male/female atau laki-laki/perempuan)"]),
        birth_place: row_hash["Tempat Lahir*"]&.to_s&.strip,
        birth_date: parse_date_from_excel(row_hash["Tanggal Lahir* (YYYY-MM-DD)"]),
        father_name: row_hash["Nama Ayah*"]&.to_s&.strip,
        parent_phone: row_hash["No HP Orang Tua"]&.to_s&.strip,
        address: row_hash["Alamat"]&.to_s&.strip,
        class_level: (row_hash["Kelas* (7A-12D)"] || row_hash["Kelas*"])&.to_s&.strip,
        status: normalize_import_status(row_hash["Status* (Aktif/Tidak Aktif)"] || row_hash["Status* (active/inactive)"]),
        current_hifz_in_juz: row_hash["Juz Hafalan Saat Ini* (1-30)"]&.to_s&.strip,
        current_hifz_in_pages: DEFAULT_HIFZ_PAGE,
        current_hifz_in_surah: row_hash["Surah Hafalan Saat Ini*"]&.to_s&.strip,
        juz_30_statuses: {}
      }
    end

    def validate_preview_row!(student_data, row_hash)
      row_errors = []

      row_errors << "No Induk wajib diisi" if student_data[:student_number].blank?
      row_errors << "Nama lengkap wajib diisi" if student_data[:name].blank?
      row_errors << "Gender wajib diisi (Laki-laki/Perempuan)" if student_data[:gender].blank?
      row_errors << "Gender harus Laki-laki atau Perempuan" unless ["male", "female"].include?(student_data[:gender])
      row_errors << "Tempat lahir wajib diisi" if student_data[:birth_place].blank?
      row_errors << "Tanggal lahir wajib diisi" if student_data[:birth_date].blank?
      row_errors << "Nama ayah wajib diisi" if student_data[:father_name].blank?
      row_errors << "Kelas wajib diisi" if student_data[:class_level].blank?

      if student_data[:class_level].present? && !valid_class_level?(student_data[:class_level])
        row_errors << "Kelas harus antara 7A-12D (contoh: 7A, 8B, 10C, 12D)"
      end

      row_errors << "Status wajib diisi (Aktif/Tidak Aktif)" if student_data[:status].blank?
      row_errors << "Status harus Aktif atau Tidak Aktif" unless ["active", "inactive"].include?(student_data[:status])
      row_errors << "Juz hafalan wajib diisi" if student_data[:current_hifz_in_juz].blank?
      row_errors << "Surah hafalan wajib diisi" if student_data[:current_hifz_in_surah].blank?

      if student_data[:current_hifz_in_juz].present?
        juz_value = student_data[:current_hifz_in_juz].to_i
        row_errors << "Juz hafalan harus di antara 1 sampai 30" unless juz_value.between?(1, 30)
      end

      @juz_30_surahs.each do |surah|
        header = juz_30_column_name(surah)
        raw_status = row_hash[header]
        normalized_status = normalize_import_completion_status(raw_status)

        if raw_status.blank?
          row_errors << "Status #{surah} (Juz 30) wajib diisi: tuntas atau belum_tuntas"
          next
        end

        if normalized_status.blank?
          row_errors << "Status #{surah} (Juz 30) harus 'tuntas' atau 'belum_tuntas'"
          next
        end

        student_data[:juz_30_statuses][surah] = normalized_status
      end

      begin
        Date.parse(student_data[:birth_date]) if student_data[:birth_date].present?
      rescue ArgumentError
        row_errors << "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"
      end

      student_data[:errors] = row_errors
      student_data[:valid] = row_errors.empty?
    end

    def build_student(student_params)
      Student.new(
        nisn: student_params[:nisn],
        student_number: student_params[:student_number],
        name: student_params[:name],
        gender: normalize_import_gender(student_params[:gender]),
        birth_place: student_params[:birth_place],
        birth_date: Date.parse(student_params[:birth_date]),
        father_name: student_params[:father_name],
        parent_phone: student_params[:parent_phone],
        address: student_params[:address],
        class_level: student_params[:class_level]&.upcase,
        status: normalize_import_status(student_params[:status]),
        current_hifz_in_juz: student_params[:current_hifz_in_juz],
        current_hifz_in_pages: DEFAULT_HIFZ_PAGE,
        current_hifz_in_surah: student_params[:current_hifz_in_surah]
      )
    end

    def import_juz_30_progressions!(student, raw_statuses)
      statuses = to_hash(raw_statuses || {})
      now = Time.current

      @juz_30_surahs.each do |surah|
        raw_status = statuses[surah] || statuses[surah.to_sym] || statuses[surah.to_s]
        normalized_status = normalize_import_completion_status(raw_status)
        next if normalized_status.blank?

        progression = StudentSurahProgression.find_or_initialize_by(
          student_id: student.id,
          juz: 30,
          surah: surah
        )

        progression.completion_status = normalized_status
        progression.last_activity_at = now
        progression.save!
      end
    end

    def to_hash(value)
      return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
      return value.to_h if value.respond_to?(:to_h)

      {}
    end

    def valid_class_level?(class_level)
      return false if class_level.blank?

      match = class_level.match(/^(\d+)([A-D])$/i)
      return false unless match

      grade = match[1].to_i
      section = match[2].upcase

      grade >= 7 && grade <= 12 && ["A", "B", "C", "D"].include?(section)
    end

    def parse_date_from_excel(value)
      return nil if value.blank?
      return value.to_s if value.is_a?(Date)
      return value.to_date.to_s if value.respond_to?(:to_date)

      value.to_s.strip
    end

    def juz_30_column_name(surah)
      "Juz 30 - #{surah} (tuntas/belum_tuntas)"
    end

    def normalize_import_gender(value)
      normalized = value.to_s.strip.downcase
      case normalized
      when "male", "laki-laki", "lakilaki", "l"
        "male"
      when "female", "perempuan", "p"
        "female"
      else
        nil
      end
    end

    def normalize_import_status(value)
      normalized = value.to_s.strip.downcase
      case normalized
      when "active", "aktif"
        "active"
      when "inactive", "tidak aktif", "nonaktif", "non-active"
        "inactive"
      else
        nil
      end
    end

    def normalize_import_completion_status(value)
      normalized = value.to_s.strip.downcase
      case normalized
      when "tuntas", "selesai"
        "tuntas"
      when "belum_tuntas", "belum tuntas", "belum"
        "belum_tuntas"
      else
        nil
      end
    end
  end
end
