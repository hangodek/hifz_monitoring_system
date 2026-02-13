class AppSetting < ApplicationRecord
  has_one_attached :logo

  validates :app_name, presence: true
  
  # Custom validation for logo
  validate :logo_validation, if: -> { logo.attached? }

  # Singleton pattern - only one settings record should exist
  def self.instance
    first_or_create!(
      app_name: "Sistem Manajemen Hifz",
      app_subtitle: "Sistem Monitoring Hafalan",
      institution_name: "MATAN"
    )
  end

  # Get logo URL - returns attached logo or nil for default
  def logo_url
    if logo.attached?
      Rails.application.routes.url_helpers.rails_blob_path(logo, only_path: true)
    else
      nil
    end
  end

  # Get favicon URL - returns logo if available, otherwise default favicon
  def favicon_url
    if logo.attached?
      Rails.application.routes.url_helpers.rails_blob_path(logo, only_path: true)
    else
      "/favicon.jpeg"
    end
  end

  private

  def logo_validation
    allowed_types = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
    max_size = 5.megabytes

    unless allowed_types.include?(logo.content_type)
      errors.add(:logo, 'must be PNG, JPG, JPEG, or SVG format')
    end

    if logo.byte_size > max_size
      errors.add(:logo, 'must be less than 5MB')
    end
  end
end
