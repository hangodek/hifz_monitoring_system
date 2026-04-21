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
    # A juz is memorized only if all expected surahs in that juz are marked 'tuntas'
    # within the same juz (juz-aware check).
    tuntas_by_juz = Hash.new { |hash, key| hash[key] = [] }

    student_surah_progressions.where(completion_status: :tuntas).find_each do |progression|
      next if progression.juz.blank? || progression.surah.blank?

      normalized_surah = progression.surah.to_s.downcase
      juz_key = progression.juz.to_i
      tuntas_by_juz[juz_key] << normalized_surah unless tuntas_by_juz[juz_key].include?(normalized_surah)
    end

    completed_juz_count = 0
    (1..30).each do |juz_number|
      # Get the list of surah names for the current juz from the mapping
      surah_names_in_juz = SurahJuzMapping::JUZ_TO_SURAHS[juz_number]
      next if surah_names_in_juz.nil? || surah_names_in_juz.empty?

      # Normalize the names from the mapping
      normalized_surah_names_in_juz = surah_names_in_juz.map(&:downcase)
      completed_surahs_in_juz = tuntas_by_juz[juz_number]

      # Check if all expected surahs in this juz are tuntas for this juz.
      if normalized_surah_names_in_juz.all? { |surah| completed_surahs_in_juz.include?(surah) }
        completed_juz_count += 1
      end
    end

    # Update the count in the database
    update_column(:total_juz_memorized, completed_juz_count)
  end

  def completed_surah_count
    # A surah is counted complete only when all juz segments that contain it are tuntas.
    tuntas_juzs_by_surah = Hash.new { |hash, key| hash[key] = [] }

    student_surah_progressions.where(completion_status: :tuntas).find_each do |progression|
      next if progression.juz.blank? || progression.surah.blank?

      normalized_surah = normalize_surah_name(progression.surah)
      next if normalized_surah.blank?

      juz_key = progression.juz.to_i
      tuntas_juzs_by_surah[normalized_surah] << juz_key unless tuntas_juzs_by_surah[normalized_surah].include?(juz_key)
    end

    required_juzs_by_surah = Hash.new { |hash, key| hash[key] = [] }
    SurahJuzMapping::JUZ_TO_SURAHS.each do |juz, surahs|
      Array(surahs).each do |surah_name|
        normalized_surah = normalize_surah_name(surah_name)
        next if normalized_surah.blank?

        required_juzs_by_surah[normalized_surah] << juz unless required_juzs_by_surah[normalized_surah].include?(juz)
      end
    end

    tuntas_juzs_by_surah.count do |normalized_surah, tuntas_juzs|
      required_juzs = required_juzs_by_surah[normalized_surah]
      required_juzs.present? && (required_juzs - tuntas_juzs).empty?
    end
  end

  private

  def normalize_surah_name(surah_name)
    surah_name.to_s.downcase.gsub(/[^a-z0-9]/, "")
  end

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
