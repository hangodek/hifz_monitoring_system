class Student < ApplicationRecord
  has_one_attached :avatar do |attachable|
    attachable.variant :thumb, resize_to_limit: [100, 100], preprocessed: true
    attachable.variant :medium, resize_to_limit: [300, 300], preprocessed: true
  end

  has_many :activities, dependent: :destroy

  scope :active, -> { where(status: "active") }

  # Validate avatar file type and size
  validate :acceptable_avatar

  # Process avatar after upload to optimize it
  after_commit :process_avatar, on: [:create, :update]

  private

  def acceptable_avatar
    return unless avatar.attached?

    unless avatar.blob.byte_size <= 5.megabytes
      errors.add(:avatar, "is too large (max 5MB)")
    end

    acceptable_types = ["image/png", "image/jpg", "image/jpeg", "image/webp"]
    unless acceptable_types.include?(avatar.blob.content_type)
      errors.add(:avatar, "must be a PNG, JPG, JPEG, or WebP image")
    end
  end

  def process_avatar
    return unless avatar.attached? && avatar.blob.present?

    # Only process if not already processed
    return if avatar.blob.metadata[:processed]

    # Process the image to optimize size
    avatar.blob.open do |file|
      processed = ImageProcessing::Vips
        .source(file)
        .resize_to_limit(800, 800)  # Max dimensions
        .convert("jpg")              # Convert to JPEG for better compression
        .saver(quality: 85)          # 85% quality - good balance
        .call

      # Replace the original with the processed version
      avatar.attach(
        io: File.open(processed.path),
        filename: "#{avatar.filename.base}.jpg",
        content_type: "image/jpeg",
        metadata: { processed: true }
      )

      # Clean up temp file
      File.delete(processed.path) if File.exist?(processed.path)
    rescue StandardError => e
      Rails.logger.error "Failed to process avatar: #{e.message}"
    end
  end
end
