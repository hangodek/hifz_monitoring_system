module SurahJuzMapping
  extend ActiveSupport::Concern

  JUZ_TO_SURAHS = {
    1 => ["Al-Fatihah", "Al-Baqarah"],
    2 => ["Al-Baqarah"],
    3 => ["Al-Baqarah", "Ali Imran"],
    4 => ["Ali Imran", "An-Nisa"],
    5 => ["An-Nisa"],
    6 => ["An-Nisa", "Al-Ma'idah"],
    7 => ["Al-Ma'idah", "Al-An'am"],
    8 => ["Al-An'am", "Al-A'raf"],
    9 => ["Al-A'raf", "Al-Anfal"],
    10 => ["Al-Anfal", "At-Taubah"],
    11 => ["At-Taubah", "Yunus", "Hud"],
    12 => ["Hud", "Yusuf"],
    13 => ["Yusuf", "Ar-Ra'd", "Ibrahim"],
    14 => ["Al-Hijr", "An-Nahl"],
    15 => ["Al-Isra'", "Al-Kahf"],
    16 => ["Al-Kahf", "Maryam", "Ta Ha"],
    17 => ["Al-Anbiya", "Al-Hajj"],
    18 => ["Al-Mu'minun", "An-Nur", "Al-Furqan"],
    19 => ["Al-Furqan", "Asy-Syu'ara'", "An-Naml"],
    20 => ["An-Naml", "Al-Qasas"],
    21 => ["Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah"],
    22 => ["Al-Ahzab", "Saba'", "Fatir", "Ya Sin"],
    23 => ["Ya Sin", "As-Saffat", "Sad", "Az-Zumar"],
    24 => ["Az-Zumar", "Ghafir", "Fussilat"],
    25 => ["Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah", "Al-Ahqaf"],
    26 => ["Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Az-Zariyat"],
    27 => ["Az-Zariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
    28 => ["Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Tagabun", "At-Talaq", "At-Tahrim"],
    29 => ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"],
    30 => ["An-Naba'", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Gasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail", "Ad-Duha", "Al-Insyirah", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takasur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un", "Al-Kautsar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"]
  }.freeze

  SURAH_NORMALIZATION_ALIASES = {
    "alitmran" => "aliimran",
    "attaubah" => "attaubah",
    "attawbah" => "attaubah",
    "alisra" => "alisra",
    "yasin" => "yasin",
    "ashyshura" => "asysyura",
    "aljathiyah" => "aljasiyah",
    "adhdhariyat" => "azzariyat",
    "alhashr" => "alhasyr",
    "attaghabun" => "attagabun",
    "almuddaththir" => "almuddassir",
    "annaba" => "annaba",
    "alinshiqaq" => "alinsyiqaq",
    "alghashiyah" => "algasyiyah",
    "ashshams" => "asysyams",
    "allayl" => "allail",
    "ashsharh" => "alinsyirah",
    "alalaq" => "alalaq",
    "aladiyat" => "aladiyat",
    "attakathur" => "attakasur",
    "alasr" => "alasr",
    "quraysh" => "quraisy",
    "alkawthar" => "alkautsar",
    "almasad" => "allahab"
  }.freeze

  SURAH_TO_JUZ = JUZ_TO_SURAHS.each_with_object({}) do |(juz, surahs), map|
    surahs.each do |surah|
      raw_key = surah.to_s.downcase.gsub(/[^a-z0-9]/, "")
      key = SURAH_NORMALIZATION_ALIASES.fetch(raw_key, raw_key)
      map[key] ||= juz
    end
  end.freeze

  private

  def map_surah_to_juz(surah_name)
    return nil if surah_name.blank?

    key = normalize_surah_key(surah_name)
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
    normalize_surah_key(surah_name)
  end

  def normalize_surah_key(surah_name)
    raw_key = surah_name.to_s.downcase.gsub(/[^a-z0-9]/, "")
    SURAH_NORMALIZATION_ALIASES.fetch(raw_key, raw_key)
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
