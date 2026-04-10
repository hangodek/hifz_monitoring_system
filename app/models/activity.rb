class Activity < ApplicationRecord
  has_one_attached :audio

  belongs_to :student

  enum :activity_type, {
    memorization: 0,
    revision: 1
  }
  
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

  private

  def set_default_scores
    self.kelancaran ||= 25  # Default middle value (K: 1-50)
    self.fashohah ||= 8     # Default middle value (F: 1-15)
    self.tajwid ||= 8       # Default middle value (T: 1-15)
  end
end
