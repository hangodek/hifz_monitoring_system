module SurahJuzMapping
  extend ActiveSupport::Concern

  JUZ_TO_SURAHS = {
    1 => ["Al-Fatihah", "Al-Baqarah"],
    2 => ["Al-Baqarah"],
    3 => ["Al-Baqarah", "Ali 'Imran"],
    4 => ["Ali 'Imran", "An-Nisa"],
    5 => ["An-Nisa"],
    6 => ["An-Nisa", "Al-Ma'idah"],
    7 => ["Al-Ma'idah", "Al-An'am"],
    8 => ["Al-An'am", "Al-A'raf"],
    9 => ["Al-A'raf", "Al-Anfal"],
    10 => ["Al-Anfal", "At-Tawbah"],
    11 => ["At-Tawbah", "Yunus", "Hud"],
    12 => ["Hud", "Yusuf"],
    13 => ["Yusuf", "Ar-Ra'd", "Ibrahim"],
    14 => ["Al-Hijr", "An-Nahl"],
    15 => ["Al-Isra", "Al-Kahf"],
    16 => ["Al-Kahf", "Maryam", "Ta-Ha"],
    17 => ["Al-Anbiya", "Al-Hajj"],
    18 => ["Al-Mu'minun", "An-Nur"],
    19 => ["An-Nur", "Al-Furqan", "Ash-Shu'ara"],
    20 => ["An-Naml", "Al-Qasas"],
    21 => ["Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah"],
    22 => ["Al-Ahzab"],
    23 => ["Al-Ahzab", "Saba", "Fatir", "Ya-Sin"],
    24 => ["As-Saffat", "Sad", "Az-Zumar"],
    25 => ["Az-Zumar", "Ghafir", "Fussilat"],
    26 => ["Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat"],
    27 => ["At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
    28 => ["Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"],
    29 => ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"],
    30 => ["An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"]
  }.freeze

  SURAH_TO_JUZ = JUZ_TO_SURAHS.each_with_object({}) do |(juz, surahs), map|
    surahs.each do |surah|
      key = surah.downcase.gsub(/[^a-z0-9]/, "")
      map[key] ||= juz
    end
  end.freeze

  private

  def map_surah_to_juz(surah_name)
    return nil if surah_name.blank?

    key = surah_name.to_s.downcase.gsub(/[^a-z0-9]/, "")
    SURAH_TO_JUZ[key]
  end
  
  def completed_juz_count_up_to(activities, cutoff_time = nil)
    scope = activities.where(activity_type: "memorization").where.not(surah: [ nil, "" ])
    scope = scope.where("created_at <= ?", cutoff_time) if cutoff_time.present?

    latest_status_by_surah = {}
    tuntas_status = Activity.completion_statuses[:tuntas]

    scope.order(:created_at, :id)
         .pluck(:juz, :surah, :completion_status)
         .each do |juz, surah, completion_status|
      resolved_juz = juz || map_surah_to_juz(surah)
      normalized_surah = normalize_surah_name(surah)
      next if resolved_juz.blank? || normalized_surah.blank?

      latest_status_by_surah[[resolved_juz.to_i, normalized_surah]] = completion_status
    end

    completed_surahs_by_juz = Hash.new { |hash, key| hash[key] = [] }
    latest_status_by_surah.each do |(juz, surah), status|
      next unless status == tuntas_status

      completed_surahs_by_juz[juz] << surah
    end

    completed_surahs_by_juz.count do |juz, completed_surahs|
      expected_surahs = Array(JUZ_TO_SURAHS[juz]).map { |surah| normalize_surah_name(surah) }
      expected_surahs.all? { |surah| completed_surahs.uniq.include?(surah) }
    end
  end

  def normalize_surah_name(surah_name)
    surah_name.to_s.downcase.gsub(/[^a-z0-9]/, "")
  end

  def total_juz_completed_for_student(student)
    # Source of truth follows teacher mode: student_surah_progressions.
    progressions = student.student_surah_progressions

    completed_surahs_by_juz = Hash.new { |hash, key| hash[key] = [] }
    progressions.each do |progression|
      next unless progression.completion_status.to_s == "tuntas"

      juz = progression.juz.to_i
      surah = normalize_surah_name(progression.surah)
      next if juz <= 0 || surah.blank?

      completed_surahs_by_juz[juz] << surah unless completed_surahs_by_juz[juz].include?(surah)
    end

    (1..30).count do |juz|
      expected_surahs = Array(JUZ_TO_SURAHS[juz]).map { |surah| normalize_surah_name(surah) }
      expected_surahs.present? && expected_surahs.all? { |surah| completed_surahs_by_juz[juz].include?(surah) }
    end
  end

  def total_juz_completed_for_student_up_to(student, cutoff_time = nil)
    progressions = student.student_surah_progressions.where(completion_status: :tuntas)
    progressions = progressions.where("last_activity_at <= ?", cutoff_time) if cutoff_time.present?

    completed_surahs_by_juz = Hash.new { |hash, key| hash[key] = [] }
    progressions.find_each do |progression|
      juz = progression.juz.to_i
      surah = normalize_surah_name(progression.surah)
      next if juz <= 0 || surah.blank?

      completed_surahs_by_juz[juz] << surah unless completed_surahs_by_juz[juz].include?(surah)
    end

    (1..30).count do |juz|
      expected_surahs = Array(JUZ_TO_SURAHS[juz]).map { |surah| normalize_surah_name(surah) }
      expected_surahs.present? && expected_surahs.all? { |surah| completed_surahs_by_juz[juz].include?(surah) }
    end
  end
end
