class Student < ApplicationRecord
  has_one_attached :avatar do |attachable|
    attachable.variant :thumb, resize_to_limit: [100, 100], preprocessed: true
    attachable.variant :medium, resize_to_limit: [300, 300], preprocessed: true
  end

  has_many :activities, dependent: :destroy
  has_many :student_surah_progressions, dependent: :destroy
  has_many :parent_users, -> { where(role: "parent") }, class_name: "User", foreign_key: "student_id"

  scope :active, -> { where(status: "active") }

  # Validate avatar file type and size
  validate :acceptable_avatar

  # Process avatar after upload to optimize it
  after_commit :process_avatar, on: [:create, :update]

  def recalculate_total_juz_memorized!
    # This method calculates how many juz a student has fully memorized.
    # A juz is considered memorized only if all of its surahs are 'tuntas'.

    # Get all 'tuntas' progressions for the student
    tuntas_surah_names = student_surah_progressions.where(completion_status: 'tuntas').pluck(:surah).map(&:downcase).uniq

    completed_juz_count = 0
    (1..30).each do |juz_number|
      # Get the list of surah names for the current juz from the mapping
      surah_names_in_juz = SurahJuzMapping::JUZ_TO_SURAHS[juz_number]
      next if surah_names_in_juz.nil? || surah_names_in_juz.empty?

      # Normalize the names from the mapping
      normalized_surah_names_in_juz = surah_names_in_juz.map(&:downcase)

      # Check if all surahs in the juz are present in the student's 'tuntas' list
      if (normalized_surah_names_in_juz - tuntas_surah_names).empty?
        completed_juz_count += 1
      end
    end

    # Update the count in the database
    update_column(:total_juz_memorized, completed_juz_count)
  end

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
