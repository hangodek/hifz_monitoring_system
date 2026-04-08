class Activity < ApplicationRecord
  has_one_attached :audio

  belongs_to :student

  enum :activity_type, {
    memorization: 0,
    revision: 1
  }

  validates :surah, :ayat_from, :ayat_to, :kelancaran, :fashohah, :tajwid, presence: true
  validates :kelancaran, inclusion: { in: 1..50 }
  validates :fashohah, inclusion: { in: 1..15 }
  validates :tajwid, inclusion: { in: 1..5 }
end
