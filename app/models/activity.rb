class Activity < ApplicationRecord
  has_one_attached :audio

  belongs_to :student

  enum :activity_type, {
    memorization: 0,
    revision: 1
  }

  attribute :completion_status, :integer

  enum :completion_status, {
    belum_tuntas: 0,
    tuntas: 1
  }

  validates :surah, :ayat_from, :ayat_to, presence: true
  validates :juz, presence: true
  validates :kelancaran, inclusion: { in: 1..50 }, allow_nil: true
  validates :fashohah, inclusion: { in: 1..15 }, allow_nil: true
  validates :tajwid, inclusion: { in: 1..15 }, allow_nil: true
  validates :completion_status, presence: true

  before_save :set_default_scores
  after_commit :sync_surah_progression_after_create, on: :create
  after_commit :sync_surah_progression_after_destroy, on: :destroy

  private

  def set_default_scores
    self.kelancaran ||= 25  # Default middle value (K: 1-50)
    self.fashohah ||= 8     # Default middle value (F: 1-15)
    self.tajwid ||= 8       # Default middle value (T: 1-15)
  end

  def sync_surah_progression_after_create
    return unless memorization?
    return if juz.blank? || surah.blank?

    StudentSurahProgression.sync_from_activities!(student: student, juz: juz, surah: surah)
  end

  def sync_surah_progression_after_destroy
    return unless memorization?
    return if juz.blank? || surah.blank?

    StudentSurahProgression.sync_from_activities!(student: student, juz: juz, surah: surah)
  end
end
