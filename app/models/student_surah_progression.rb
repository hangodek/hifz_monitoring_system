class StudentSurahProgression < ApplicationRecord
  include StudentJuzCompletion
  belongs_to :student

  enum :completion_status, {
    belum_tuntas: 0,
    tuntas: 1
  }

  validates :juz, presence: true
  validates :surah, presence: true
  validates :completion_status, presence: true
  validates :surah, uniqueness: { scope: [ :student_id, :juz ] }

  def self.sync_from_activities!(student:, juz:, surah:)
    return if student.blank? || juz.blank? || surah.blank?

    latest_activity = Activity
      .where(student_id: student.id, activity_type: Activity.activity_types[:memorization], juz: juz, surah: surah)
      .order(created_at: :desc, id: :desc)
      .first

    if latest_activity.present?
      record = find_or_initialize_by(student_id: student.id, juz: juz, surah: surah)
      record.completion_status = latest_activity.completion_status
      record.last_activity_at = latest_activity.created_at
      record.save!
    else
      where(student_id: student.id, juz: juz, surah: surah).delete_all
    end
  end
end