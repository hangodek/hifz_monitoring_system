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
    26 => ["Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah"],
    27 => ["Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat"],
    28 => ["At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
    29 => ["Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"],
    30 => ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"]
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

    completed_surahs_by_juz = Hash.new { |hash, key| hash[key] = [] }

    scope.where(completion_status: Activity.completion_statuses[:tuntas])
         .pluck(:juz, :surah)
         .each do |juz, surah|
      resolved_juz = juz || map_surah_to_juz(surah)
      next if resolved_juz.blank? || surah.blank?

      completed_surahs_by_juz[resolved_juz.to_i] << normalize_surah_name(surah)
    end

    completed_surahs_by_juz.count do |juz, completed_surahs|
      expected_surahs = Array(JUZ_TO_SURAHS[juz]).map { |surah| normalize_surah_name(surah) }
      expected_surahs.all? { |surah| completed_surahs.uniq.include?(surah) }
    end
  end

  def normalize_surah_name(surah_name)
    surah_name.to_s.downcase.gsub(/[^a-z0-9]/, "")
  end
end
