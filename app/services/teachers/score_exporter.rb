module Teachers
  class ScoreExporter
    include SurahJuzMapping

    def initialize(students, current_user:)
      @students = students
      @current_user = current_user
    end

    def to_stream
      package = Axlsx::Package.new
      workbook = package.workbook

      title_style = workbook.styles.add_style(
        b: true,
        sz: 14,
        alignment: { horizontal: :center, vertical: :center }
      )
      label_style = workbook.styles.add_style(
        b: true,
        alignment: { horizontal: :left, vertical: :center }
      )
      meta_label_style = workbook.styles.add_style(
        b: true,
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :left, vertical: :center }
      )
      meta_value_style = workbook.styles.add_style(
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :left, vertical: :center }
      )
      header_style = workbook.styles.add_style(
        b: true,
        fg_color: "FFFFFF",
        bg_color: "4472C4",
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true }
      )
      subheader_style = workbook.styles.add_style(
        b: true,
        fg_color: "FFFFFF",
        bg_color: "5B9BD5",
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :center, vertical: :center, wrap_text: true }
      )
      value_style = workbook.styles.add_style(
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :center, vertical: :center }
      )
      name_style = workbook.styles.add_style(
        border: Axlsx::STYLE_THIN_BORDER,
        alignment: { horizontal: :left, vertical: :center }
      )

      workbook.add_worksheet(name: "Rekap Semua Siswa") do |sheet|
        setup_export_header(
          sheet,
          "Semua Kelas",
          title_style,
          label_style,
          meta_label_style,
          meta_value_style,
          header_style
        )

        surah_headers = export_surah_headers
        add_export_score_headers(
          sheet,
          static_columns: [ "NO", "NAMA SISWA/I", "KELAS" ],
          surah_headers: surah_headers,
          header_style: header_style,
          subheader_style: subheader_style
        )

        @students.each_with_index do |student, index|
          latest_scores = latest_activity_scores_by_surah(student)
          row = [ index + 1, student.name, class_label_for_export(student.class_level) ]

          surah_headers.each do |surah_label|
            scores = latest_scores[normalize_surah_name(surah_label)] || {}
            k = scores[:kelancaran]
            t = scores[:tajwid]
            f = scores[:fashohah]
            total = [ k, t, f ].compact.sum
            row.concat([ k, t, f, total.zero? ? 0 : total ])
          end

          style_row = [ value_style, name_style, value_style ] + Array.new(surah_headers.length * 4, value_style)
          sheet.add_row(row, style: style_row)
        end

        sheet.column_widths(6, 30, 10, *Array.new(surah_headers.length * 4, 6))
      end

      export_students_by_class(@students).each do |class_label, class_students|
        next if class_students.blank?

        workbook.add_worksheet(name: class_label) do |sheet|
          setup_export_header(
            sheet,
            class_label,
            title_style,
            label_style,
            meta_label_style,
            meta_value_style,
            header_style
          )

          surah_headers = export_surah_headers
          add_export_score_headers(
            sheet,
            static_columns: [ "NO", "NAMA SISWA/I" ],
            surah_headers: surah_headers,
            header_style: header_style,
            subheader_style: subheader_style
          )

          class_students.each_with_index do |student, index|
            latest_scores = latest_activity_scores_by_surah(student)
            row = [ index + 1, student.name ]

            surah_headers.each do |surah_label|
              scores = latest_scores[normalize_surah_name(surah_label)] || {}
              k = scores[:kelancaran]
              t = scores[:tajwid]
              f = scores[:fashohah]
              total = [ k, t, f ].compact.sum
              row.concat([ k, t, f, total.zero? ? 0 : total ])
            end

            style_row = [ value_style, name_style ] + Array.new(surah_headers.length * 4, value_style)
            sheet.add_row(row, style: style_row)
          end

          sheet.column_widths(6, 30, *Array.new(surah_headers.length * 4, 6))
        end
      end

      package.to_stream.read
    end

    private

    def export_students_by_class(students)
      students.group_by { |student| class_label_for_export(student.class_level) }
              .sort_by { |class_label, _students| class_sort_key(class_label) }
              .to_h
    end

    def setup_export_header(sheet, class_label, title_style, label_style, meta_label_style, meta_value_style, header_style)
      app_setting = AppSetting.instance
      academic_year = academic_year_for_export
      semester = current_semester_for_export
      teacher_name = @current_user&.name || ""
      institution_name = app_setting.institution_name.presence || "SMP"

      sheet.add_row([ "DAFTAR PENILAIAN TAHFIZ QUR'AN" ], style: [ title_style ])
      sheet.add_row([ "#{institution_name} TAHUN AJARAN #{academic_year}" ], style: [ title_style ])
      metadata_rows = [
        [ "Nama Guru :", teacher_name ],
        [ "Mata Pelajaran :", "TAHFIZHUL QURAN" ],
        [ "Kelas :", class_label ],
        [ "Semester :", semester.to_s ],
        [ "Tahun Pelajaran :", academic_year ],
        [ "KKM :", "68" ]
      ]

      metadata_rows.each do |label, value|
        sheet.add_row(
          [ label, nil, value, nil, nil, nil ],
          style: [ meta_label_style, meta_label_style, meta_value_style, meta_value_style, meta_value_style, meta_value_style ]
        )
      end

      merge_sheet_cells(sheet, 0, 1, 5, 1)
      merge_sheet_cells(sheet, 0, 2, 5, 2)

      start_row = sheet.rows.size - 5
      6.times do |offset|
        merge_sheet_cells(sheet, 0, start_row + offset, 1, start_row + offset)
        merge_sheet_cells(sheet, 2, start_row + offset, 5, start_row + offset)
      end
      sheet.add_row([])
    end

    def export_surah_headers
      SurahJuzMapping::JUZ_TO_SURAHS.keys.sort.reverse.flat_map do |juz|
        Array(SurahJuzMapping::JUZ_TO_SURAHS[juz]).map { |surah| surah }
      end.uniq
    end

    def add_export_score_headers(sheet, static_columns:, surah_headers:, header_style:, subheader_style:)
      header_row = static_columns.dup
      subheader_row = Array.new(static_columns.length)

      surah_headers.each do |surah_label|
        header_row.concat([ surah_label, nil, nil, "N" ])
        subheader_row.concat([ "K", "T", "F", nil ])
      end

      sheet.add_row(header_row, style: Array.new(header_row.length, header_style))
      sheet.add_row(subheader_row, style: Array.new(subheader_row.length, subheader_style))

      header_row_number = sheet.rows.size - 1
      subheader_row_number = sheet.rows.size

      static_columns.each_index do |column_index|
        merge_sheet_cells(sheet, column_index, header_row_number, column_index, subheader_row_number)
      end

      first_surah_column = static_columns.length
      surah_headers.each_index do |index|
        surah_column = first_surah_column + (index * 4)
        merge_sheet_cells(sheet, surah_column, header_row_number, surah_column + 2, header_row_number)
        merge_sheet_cells(sheet, surah_column + 3, header_row_number, surah_column + 3, subheader_row_number)
      end
    end

    def merge_sheet_cells(sheet, start_column, start_row, end_column, end_row)
      start_ref = "#{excel_column_label(start_column)}#{start_row}"
      end_ref = "#{excel_column_label(end_column)}#{end_row}"
      sheet.merge_cells("#{start_ref}:#{end_ref}")
    end

    def excel_column_label(index)
      label = ""
      current = index + 1

      while current.positive?
        current, remainder = (current - 1).divmod(26)
        label.prepend((65 + remainder).chr)
      end

      label
    end

    def latest_activity_scores_by_surah(student)
      student.activities
             .order(created_at: :desc, id: :desc)
             .each_with_object({}) do |activity, scores|
        next if activity.surah.blank?

        normalized_surah = normalize_surah_name(activity.surah)
        next if normalized_surah.blank? || scores.key?(normalized_surah)

        scores[normalized_surah] = {
          kelancaran: activity.kelancaran,
          fashohah: activity.fashohah,
          tajwid: activity.tajwid
        }
      end
    end

    def class_label_for_export(class_level)
      raw = class_level.to_s.strip
      return raw if raw.blank?

      match = raw.match(/\A(\d+)([A-Za-z])\z/)
      return raw unless match

      grade = match[1].to_i
      section = match[2].upcase
      "#{roman_numeral_for_grade(grade)} #{section}"
    end

    def class_sort_key(class_label)
      match = class_label.to_s.match(/\A([IVXLCDM]+)\s*([A-Za-z])\z/)
      return [ 1, class_label.to_s ] unless match

      [ 0, roman_to_integer(match[1]), match[2] ]
    end

    def roman_numeral_for_grade(grade)
      {
        7 => "VII",
        8 => "VIII",
        9 => "IX",
        10 => "X",
        11 => "XI",
        12 => "XII"
      }[grade] || grade.to_s
    end

    def roman_to_integer(roman)
      values = {
        "I" => 1,
        "V" => 5,
        "X" => 10,
        "L" => 50,
        "C" => 100,
        "D" => 500,
        "M" => 1000
      }

      total = 0
      previous_value = 0

      roman.to_s.upcase.chars.reverse.each do |char|
        current_value = values[char] || 0
        if current_value < previous_value
          total -= current_value
        else
          total += current_value
          previous_value = current_value
        end
      end

      total
    end

    def academic_year_for_export
      today = Date.current
      start_year = today.month >= 7 ? today.year : today.year - 1
      "#{start_year}-#{start_year + 1}"
    end

    def current_semester_for_export
      Date.current.month >= 7 ? 1 : 2
    end
  end
end
