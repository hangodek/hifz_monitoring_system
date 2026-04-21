class TeachersController < ApplicationController
  include RoleAuthorization
  include SurahJuzMapping

  skip_before_action :authorize_role
  before_action :require_teacher_or_admin!

  def index
    # Use caching for student list (5 minutes)
    students = Rails.cache.fetch("teacher_active_students", expires_in: 5.minutes) do
      Student.active.order(name: :asc).as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ])
    end

    render inertia: "Teacher/Index", props: {
      students: students,
      recent_activities: [] # Activities loaded per-student via API
    }
  end

  def bulk_edit
    students = Rails.cache.fetch("teacher_active_students", expires_in: 5.minutes) do
      Student.active.order(name: :asc).as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ])
    end

    render inertia: "Teacher/BulkEdit", props: {
      students: students
    }
  end

  def export_scores
    students = Student.order(:class_level, :name).includes(:activities)

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

      students.each_with_index do |student, index|
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

    export_students_by_class(students).each do |class_label, class_students|
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

    send_data package.to_stream.read,
              filename: "ekspor_nilai_guru_#{Date.current}.xlsx",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              disposition: "attachment"
  end

  # Get activities for a specific student
  def student_activities
    student_id = params[:student_id]
    
    if student_id.blank?
      render json: { activities: [] }
      return
    end

    # Cache activities per student (2 minutes)
    payload = Rails.cache.fetch("student_activities_#{student_id}", expires_in: 2.minutes) do
      activities = Activity.joins(:student)
                          .where(student_id: student_id, students: { status: "active" })
                          .order(created_at: :desc)
                          .map do |activity|
        {
          id: activity.id.to_s,
          activity_type: activity.activity_type,
          activity_grade: nil,
          surah_from: activity.surah,
          surah_to: activity.surah,
          page_from: activity.ayat_from,
          page_to: activity.ayat_to,
          juz: activity.juz,
          juz_from: nil,
          juz_to: nil,
          completion_status: activity.completion_status,
          kelancaran: activity.kelancaran,
          fashohah: activity.fashohah,
          tajwid: activity.tajwid,
          notes: activity.notes,
          created_at: activity.created_at.iso8601,
          audio_url: activity.audio.attached? ? url_for(activity.audio) : nil,
          student: {
            id: activity.student.id.to_s,
            name: activity.student.name
          }
        }
      end

      surah_progressions = StudentSurahProgression
        .where(student_id: student_id)
        .select(:juz, :surah, :completion_status, :last_activity_at)
        .map do |progression|
          {
            juz: progression.juz,
            surah: progression.surah,
            completion_status: progression.completion_status,
            last_activity_at: progression.last_activity_at&.iso8601
          }
        end

      {
        activities: activities,
        surah_progressions: surah_progressions
      }
    end

    render json: payload
  end

  def bulk_save_activities
    student = Student.active.find_by(id: params[:student_id])
    return render json: { message: "Siswa tidak ditemukan." }, status: :not_found if student.blank?

    juz = params[:juz].to_s.strip
    return render json: { message: "Juz wajib dipilih." }, status: :unprocessable_entity if juz.blank?

    rows = bulk_activity_rows
    return render json: { message: "Tidak ada data yang dikirim." }, status: :unprocessable_entity if rows.blank?

    saved_rows = []

    ActiveRecord::Base.transaction do
      rows.each_with_index do |row, index|
        normalized_row = normalize_bulk_activity_row(row)

        next unless bulk_activity_row_dirty?(normalized_row)

        validation_error = bulk_activity_row_error(normalized_row, index)
        raise BulkActivityValidationError, validation_error if validation_error.present?

        if bulk_activity_row_requires_activity?(normalized_row)
          activity = bulk_upsert_activity(student, normalized_row, index)
          saved_rows << { row_index: index, id: activity.id.to_s, action: activity.previously_new_record? ? "created" : "updated" }
        else
          progression = bulk_upsert_progression(student, normalized_row)
          saved_rows << { row_index: index, id: progression.id.to_s, action: progression.previously_new_record? ? "created_progression" : "updated_progression" }
        end
      end
    end

    if saved_rows.blank?
      render json: { message: "Tidak ada baris yang valid untuk disimpan." }, status: :unprocessable_entity
      return
    end

    Rails.cache.delete("teacher_active_students")
    Rails.cache.delete("student_activities_#{student.id}")

    render json: {
      message: "#{saved_rows.count} baris berhasil disimpan.",
      saved_rows: saved_rows
    }
  rescue BulkActivityValidationError, ActiveRecord::RecordNotFound => e
    render json: { message: e.message }, status: :unprocessable_entity
  end

  # Search students endpoint for autocomplete
  def search_students
    query = params[:q].to_s.strip
    
    if query.blank?
      render json: []
      return
    end

    # Search with caching per query (2 minutes)
    results = Rails.cache.fetch("student_search_#{query.parameterize}", expires_in: 2.minutes) do
      Student.active
             .where("name LIKE ? OR class_level LIKE ?", "%#{query}%", "%#{query}%")
             .order(name: :asc)
             .limit(20)
             .as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ])
    end

    render json: results
  end

  # Load more activities endpoint
  def load_more_activities
    offset = params[:offset].to_i || 10
    
    activities = Activity.joins(:student)
                         .where(students: { status: "active" })
                         .includes(:student)
                         .order(created_at: :desc)
                         .offset(offset)
                         .limit(10)
                         .map do |activity|
      {
        id: activity.id.to_s,
        activity_type: activity.activity_type,
        activity_grade: nil,
        surah_from: activity.surah,
        surah_to: activity.surah,
        page_from: activity.ayat_from,
        page_to: activity.ayat_to,
        juz: activity.juz,
        juz_from: nil,
        juz_to: nil,
        completion_status: activity.completion_status,
        kelancaran: activity.kelancaran,
        fashohah: activity.fashohah,
        tajwid: activity.tajwid,
        notes: activity.notes,
        created_at: activity.created_at.iso8601,
        audio_url: activity.audio.attached? ? url_for(activity.audio) : nil,
        student: {
          id: activity.student.id.to_s,
          name: activity.student.name
        }
      }
    end

    render json: { activities: activities }
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
    teacher_name = Current.user&.name || ""
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

    # Keep title lines centered and tidy across the same width as metadata block.
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

  def bulk_activity_rows
    raw_rows = params[:activities] || []
    raw_rows = raw_rows.to_unsafe_h.values if raw_rows.respond_to?(:to_unsafe_h)
    raw_rows = raw_rows.values if raw_rows.is_a?(Hash)
    Array(raw_rows)
  end

  def bulk_activity_row_dirty?(row)
    row[:activity_id].present? || row.values_at(:juz, :surah, :ayat, :completion_status, :kelancaran, :fashohah, :tajwid, :notes).any? { |value| value.present? }
  end

  def normalize_bulk_activity_row(row)
    row_hash = if row.respond_to?(:to_unsafe_h)
      row.to_unsafe_h
    else
      row.to_h
    end

    fetch_value = lambda do |hash, snake_key, camel_key|
      hash[snake_key.to_s].presence || hash[snake_key.to_sym].presence || hash[camel_key.to_s].presence || hash[camel_key.to_sym].presence
    end

    {
      activity_id: fetch_value.call(row_hash, :activity_id, :activityId) || fetch_value.call(row_hash, :id, :id),
      juz: fetch_value.call(row_hash, :juz, :juz),
      surah: fetch_value.call(row_hash, :surah, :surah),
      ayat: fetch_value.call(row_hash, :ayat, :ayat),
      completion_status: fetch_value.call(row_hash, :completion_status, :completionStatus),
      kelancaran: fetch_value.call(row_hash, :kelancaran, :kelancaran),
      fashohah: fetch_value.call(row_hash, :fashohah, :fashohah),
      tajwid: fetch_value.call(row_hash, :tajwid, :tajwid),
      notes: fetch_value.call(row_hash, :notes, :notes),
      original_juz: fetch_value.call(row_hash, :original_juz, :originalJuz),
      original_surah: fetch_value.call(row_hash, :original_surah, :originalSurah),
      original_ayat: fetch_value.call(row_hash, :original_ayat, :originalAyat),
      original_completion_status: fetch_value.call(row_hash, :original_completion_status, :originalCompletionStatus),
      original_kelancaran: fetch_value.call(row_hash, :original_kelancaran, :originalKelancaran),
      original_fashohah: fetch_value.call(row_hash, :original_fashohah, :originalFashohah),
      original_tajwid: fetch_value.call(row_hash, :original_tajwid, :originalTajwid),
      original_notes: fetch_value.call(row_hash, :original_notes, :originalNotes)
    }
  end

  def bulk_activity_row_requires_activity?(row)
    row[:activity_id].present? || row[:ayat].present? || row[:kelancaran].present? || row[:fashohah].present? || row[:tajwid].present? || row[:notes].present?
  end

  def bulk_activity_row_dirty?(row)
    current = bulk_activity_current_values(row)
    original = bulk_activity_original_values(row)

    current != original
  end

  def bulk_activity_current_values(row)
    [
      row[:activity_id].presence,
      row[:juz].presence,
      row[:surah].presence,
      row[:ayat].presence,
      row[:completion_status].presence,
      row[:kelancaran].presence,
      row[:fashohah].presence,
      row[:tajwid].presence,
      row[:notes].presence
    ]
  end

  def bulk_activity_original_values(row)
    [
      row[:activity_id].presence,
      row[:original_juz].presence,
      row[:original_surah].presence,
      row[:original_ayat].presence,
      row[:original_completion_status].presence,
      row[:original_kelancaran].presence,
      row[:original_fashohah].presence,
      row[:original_tajwid].presence,
      row[:original_notes].presence
    ]
  end

  def bulk_activity_row_error(row, index)
    if row[:juz].blank? || row[:surah].blank? || row[:completion_status].blank?
      return "Baris #{index + 1}: Juz, surah, dan status wajib diisi."
    end

    juz = row[:juz].to_i
    return "Baris #{index + 1}: Juz tidak valid." if juz <= 0

    allowed_surahs = Array(SurahJuzMapping::JUZ_TO_SURAHS[juz]).map { |surah| normalize_surah_name(surah) }
    unless allowed_surahs.include?(normalize_surah_name(row[:surah]))
      return "Baris #{index + 1}: Surah #{row[:surah]} tidak sesuai dengan Juz #{juz}."
    end

    unless Activity.completion_statuses.key?(row[:completion_status].to_s)
      return "Baris #{index + 1}: Status harus tuntas atau belum_tuntas."
    end

    if bulk_activity_row_requires_activity?(row) || row[:activity_id].present?
      ayat = row[:ayat].to_i
      return "Baris #{index + 1}: Ayat tidak valid." if ayat <= 0

      k = row[:kelancaran].presence || 25
      f = row[:fashohah].presence || 8
      t = row[:tajwid].presence || 8

      return "Baris #{index + 1}: Nilai K harus 1-50." unless (1..50).cover?(k.to_i)
      return "Baris #{index + 1}: Nilai F harus 1-15." unless (1..15).cover?(f.to_i)
      return "Baris #{index + 1}: Nilai T harus 1-15." unless (1..15).cover?(t.to_i)
    end

    nil
  end

  def bulk_upsert_activity(student, row, index)
    activity = if row[:activity_id].present?
      student.activities.find_by(id: row[:activity_id])
    end

    activity ||= student.activities.find_or_initialize_by(
      juz: row[:juz].to_i,
      surah: row[:surah].to_s.strip,
      activity_type: :memorization
    )

    raise ActiveRecord::RecordNotFound, "Aktivitas baris #{index + 1} tidak ditemukan" if activity.blank?

    activity.assign_attributes(bulk_activity_attributes(row))
    activity.save!
    activity
  end

  def bulk_upsert_progression(student, row)
    progression = StudentSurahProgression.find_or_initialize_by(
      student_id: student.id,
      juz: row[:juz].to_i,
      surah: row[:surah].to_s.strip
    )

    progression.completion_status = row[:completion_status].to_s.strip
    progression.last_activity_at = Time.current
    progression.save!
    progression
  end

  def bulk_activity_attributes(row)
    {
      activity_type: :memorization,
      juz: row[:juz].to_i,
      surah: row[:surah].to_s.strip,
      ayat_from: row[:ayat].to_i,
      ayat_to: row[:ayat].to_i,
      notes: row[:notes].to_s.strip,
      kelancaran: (row[:kelancaran].presence || 25).to_i,
      fashohah: (row[:fashohah].presence || 8).to_i,
      tajwid: (row[:tajwid].presence || 8).to_i,
      completion_status: row[:completion_status].to_s.strip
    }
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

  class BulkActivityValidationError < StandardError; end
end
