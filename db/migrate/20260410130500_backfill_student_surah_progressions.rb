class BackfillStudentSurahProgressions < ActiveRecord::Migration[8.0]
  class ActivityRecord < ActiveRecord::Base
    self.table_name = "activities"
  end

  class ProgressionRecord < ActiveRecord::Base
    self.table_name = "student_surah_progressions"
  end

  def up
    latest_rows = ActivityRecord
      .where(activity_type: 0)
      .where.not(juz: nil)
      .where.not(surah: [ nil, "" ])
      .order(:student_id, :juz, :surah, created_at: :desc, id: :desc)
      .pluck(:student_id, :juz, :surah, :completion_status, :created_at)

    seen_keys = {}

    latest_rows.each do |student_id, juz, surah, completion_status, created_at|
      key = [ student_id, juz, surah ]
      next if seen_keys[key]

      seen_keys[key] = true

      ProgressionRecord.create!(
        student_id: student_id,
        juz: juz,
        surah: surah,
        completion_status: completion_status,
        last_activity_at: created_at,
        created_at: Time.current,
        updated_at: Time.current
      )
    end
  end

  def down
    ProgressionRecord.delete_all
  end
end