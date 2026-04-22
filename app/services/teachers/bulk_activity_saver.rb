module Teachers
  class BulkActivitySaver
    include SurahJuzMapping

    class BulkActivityValidationError < StandardError; end

    def initialize(student_id:, juz:, activities_params:)
      @student_id = student_id
      @juz = juz
      @activities_params = activities_params
    end

    def save!
      student = Student.active.find_by(id: @student_id)
      return { success: false, message: "Siswa tidak ditemukan.", status: :not_found } if student.blank?

      juz = @juz.to_s.strip
      return { success: false, message: "Juz wajib dipilih.", status: :unprocessable_entity } if juz.blank?

      rows = bulk_activity_rows
      return { success: false, message: "Tidak ada data yang dikirim.", status: :unprocessable_entity } if rows.blank?

      saved_rows = []

      begin
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
          { success: false, message: "Tidak ada baris yang valid untuk disimpan.", status: :unprocessable_entity }
        else
          # Invalidate cache
          Rails.cache.delete("teacher_active_students")
          Rails.cache.delete("student_activities_#{student.id}")

          {
            success: true,
            message: "#{saved_rows.count} baris berhasil disimpan.",
            saved_rows: saved_rows
          }
        end
      rescue BulkActivityValidationError, ActiveRecord::RecordNotFound => e
        { success: false, message: e.message, status: :unprocessable_entity }
      end
    end

    private

    def bulk_activity_rows
      raw_rows = @activities_params || []
      raw_rows = raw_rows.to_unsafe_h.values if raw_rows.respond_to?(:to_unsafe_h)
      raw_rows = raw_rows.values if raw_rows.is_a?(Hash)
      Array(raw_rows)
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
  end
end
