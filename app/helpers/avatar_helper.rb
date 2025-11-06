# frozen_string_literal: true

module AvatarHelper
  # Generate optimized avatar URL
  # Uses smaller variants to reduce bandwidth and storage
  def avatar_url(user_or_student, size: :medium)
    return nil unless user_or_student&.avatar&.attached?

    case size
    when :thumb
      # 100x100 for small displays
      url_for(user_or_student.avatar.variant(:thumb))
    when :medium
      # 300x300 for profile cards
      url_for(user_or_student.avatar.variant(:medium))
    else
      # Original (but already optimized to max 800x800)
      url_for(user_or_student.avatar)
    end
  rescue StandardError => e
    Rails.logger.error "Failed to generate avatar URL: #{e.message}"
    nil
  end
end
