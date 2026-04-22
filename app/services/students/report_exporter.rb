module Students
  class ReportExporter
    def initialize(students)
      @students = students
    end

    def to_stream
      package = Axlsx::Package.new
      workbook = package.workbook
      styles = build_styles(workbook)
      students_by_class = grouped_students_by_class

      workbook.add_worksheet(name: "Laporan Hafalan") do |sheet|
        sheet.add_row([ "Laporan Hafalan Siswa" ], style: [ styles[:title] ])
        sheet.merge_cells("A1:D1")
        sheet.add_row([])

        sheet.add_row(
          [ "Dibuat pada", I18n.l(Date.current, format: :long), "Jumlah Siswa", @students.size ],
          style: [ styles[:meta_label], styles[:meta_value], styles[:meta_label], styles[:meta_value] ]
        )
        sheet.add_row(
          [ "Jumlah Kelas", students_by_class.size, "", "" ],
          style: [ styles[:meta_label], styles[:meta_value], styles[:meta_value], styles[:meta_value] ]
        )
        sheet.merge_cells("B4:D4")

        sheet.add_row([])
        sheet.add_row([ "Ringkasan Semua Kelas" ], style: [ styles[:section_title] ])
        sheet.merge_cells("A6:D6")

        sheet.add_row(
          [ "Kelas", "Jumlah Siswa", "Total Juz Dihafal", "Total Surah Dihafal" ],
          style: [ styles[:header], styles[:header], styles[:header], styles[:header] ]
        )

        students_by_class.each do |class_name, class_students|
          total_juz = class_students.sum { |student| student.total_juz_memorized || 0 }
          total_surah = class_students.sum(&:completed_surah_count)

          sheet.add_row(
            [ class_name, class_students.size, "#{total_juz} juz", "#{total_surah} surah" ],
            style: [ styles[:name], styles[:value], styles[:value], styles[:value] ]
          )
        end

        students_by_class.each do |class_name, class_students|
          sheet.add_row([])
          sheet.add_row([ "Kelas #{class_name}" ], style: [ styles[:section_title] ])
          section_row = sheet.rows.size
          sheet.merge_cells("A#{section_row}:D#{section_row}")

          sheet.add_row(
            [ "No", "Nama", "Jumlah Juz yang Dihafal", "Jumlah Surah yang Dihafal" ],
            style: [ styles[:header], styles[:header], styles[:header], styles[:header] ]
          )

          class_students.sort_by { |student| [ -(student.total_juz_memorized || 0), -student.completed_surah_count, student.name.to_s ] }
                        .each_with_index do |student, index|
            sheet.add_row(
              [
                index + 1,
                student.name,
                "#{student.total_juz_memorized || 0} juz",
                "#{student.completed_surah_count} surah"
              ],
              style: [ styles[:value], styles[:name], styles[:value], styles[:value] ]
            )
          end
        end

        sheet.column_widths(8, 34, 30, 30)
      end

      package.to_stream.read
    end

    private

    def grouped_students_by_class
      @students
        .group_by { |student| student.class_level.presence || "Tanpa Kelas" }
        .sort_by { |class_name, _| class_level_sort_key(class_name) }
    end

    def class_level_sort_key(class_name)
      match = class_name.to_s.match(/\A(\d+)([A-Za-z]*)\z/)
      return [ 999, class_name.to_s ] unless match

      [ match[1].to_i, match[2].to_s ]
    end

    def build_styles(workbook)
      {
        title: workbook.styles.add_style(
          b: true,
          sz: 14,
          alignment: { horizontal: :center, vertical: :center }
        ),
        section_title: workbook.styles.add_style(
          b: true,
          sz: 12,
          alignment: { horizontal: :left, vertical: :center }
        ),
        meta_label: workbook.styles.add_style(
          b: true,
          border: Axlsx::STYLE_THIN_BORDER,
          alignment: { horizontal: :left, vertical: :center }
        ),
        meta_value: workbook.styles.add_style(
          border: Axlsx::STYLE_THIN_BORDER,
          alignment: { horizontal: :left, vertical: :center }
        ),
        header: workbook.styles.add_style(
          b: true,
          fg_color: "FFFFFF",
          bg_color: "4472C4",
          border: Axlsx::STYLE_THIN_BORDER,
          alignment: { horizontal: :center, vertical: :center, wrap_text: true }
        ),
        name: workbook.styles.add_style(
          border: Axlsx::STYLE_THIN_BORDER,
          alignment: { horizontal: :left, vertical: :center }
        ),
        value: workbook.styles.add_style(
          border: Axlsx::STYLE_THIN_BORDER,
          alignment: { horizontal: :center, vertical: :center }
        )
      }
    end
  end
end
