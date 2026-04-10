# frozen_string_literal: true

puts "Resetting seed data..."

Session.delete_all
User.delete_all
Activity.delete_all
StudentSurahProgression.delete_all
Student.delete_all

puts "Creating app setting..."
AppSetting.find_or_create_by!(id: 1) do |setting|
  setting.app_name = "Sistem Manajemen Hifz"
  setting.app_subtitle = "Sistem Monitoring Hafalan"
  setting.institution_name = "MATAN"
  setting.primary_color = "#3B82F6"
  setting.secondary_color = "#8B5CF6"
end

puts "Creating system users..."
User.find_or_create_by!(username: "admin") do |user|
  user.password = "admin"
  user.name = "Administrator"
  user.role = "admin"
end

User.find_or_create_by!(username: "guru1") do |user|
  user.password = "guru123"
  user.name = "Ustadz Ahmad"
  user.role = "teacher"
end

User.find_or_create_by!(username: "guru2") do |user|
  user.password = "guru123"
  user.name = "Ustadzah Fatimah"
  user.role = "teacher"
end

CLASSES = [
  "7A", "7B", "7C", "7D",
  "8A", "8B", "8C", "8D",
  "9A", "9B", "9C", "9D",
  "10A", "10B", "10C", "10D",
  "11A", "11B", "11C", "11D",
  "12A", "12B", "12C", "12D"
].freeze

STATUSES = ["active", "active", "active", "inactive", "graduated"].freeze
GENDERS = ["male", "female"].freeze

MALE_FIRST_NAMES = ["Adam", "Yusuf", "Ibrahim", "Musa", "Dawud", "Sulaiman", "Zayd", "Omar", "Ali", "Hassan"].freeze
FEMALE_FIRST_NAMES = ["Maryam", "Fatima", "Aisha", "Khadija", "Zainab", "Safiya", "Hafsa", "Ruqayyah", "Asma", "Hajar"].freeze
LAST_NAMES = ["Khan", "Ahmed", "Ali", "Hussain", "Malik", "Abdullah", "Rahman", "Siddiqui", "Farooq", "Iqbal"].freeze
CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Depok", "Tangerang", "Bekasi"].freeze

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

RANDOM = Random.new(42)

STARTING_JUZ_POOL = [30, 30, 30, 29, 28, 1, 1, 1, 15, 12].freeze


def random_name(gender)
  first = gender == "male" ? MALE_FIRST_NAMES.sample(random: RANDOM) : FEMALE_FIRST_NAMES.sample(random: RANDOM)
  last = LAST_NAMES.sample(random: RANDOM)
  ["#{first} #{last}", first, last]
end

def random_phone(prefix = "08")
  "#{prefix}#{RANDOM.rand(100_000_000..999_999_999)}"
end

def create_memorization_activity(student:, juz:, surah:, completion_status:, created_at:)
  ayat_from = RANDOM.rand(1..200)
  ayat_to = [ayat_from + RANDOM.rand(0..15), 286].min

  Activity.create!(
    student: student,
    activity_type: :memorization,
    juz: juz,
    surah: surah,
    ayat_from: ayat_from,
    ayat_to: ayat_to,
    completion_status: completion_status,
    kelancaran: RANDOM.rand(25..50),
    fashohah: RANDOM.rand(8..15),
    tajwid: RANDOM.rand(8..15),
    notes: "Setoran #{surah} (#{completion_status})",
    created_at: created_at,
    updated_at: created_at
  )
end


def create_revision_activity(student:, juz:, surah:, created_at:)
  ayat_from = RANDOM.rand(1..200)
  ayat_to = [ayat_from + RANDOM.rand(0..20), 286].min

  Activity.create!(
    student: student,
    activity_type: :revision,
    juz: juz,
    surah: surah,
    ayat_from: ayat_from,
    ayat_to: ayat_to,
    completion_status: :belum_tuntas,
    kelancaran: RANDOM.rand(15..45),
    fashohah: RANDOM.rand(6..14),
    tajwid: RANDOM.rand(6..14),
    notes: "Murajaah #{surah}",
    created_at: created_at,
    updated_at: created_at
  )
end

def weighted_anchor_juz
  STARTING_JUZ_POOL.sample(random: RANDOM)
end

def build_completed_juz_list(anchor_juz, completed_juz_target)
  pool = if anchor_juz == 30
    (21..30).to_a
  elsif anchor_juz == 1
    (1..10).to_a
  else
    (1..30).to_a
  end

  pool.sample(completed_juz_target, random: RANDOM).sort
end

puts "Creating students and activities..."

student_count = 50
students = []

student_count.times do |i|
  gender = GENDERS.sample(random: RANDOM)
  full_name, first_name, last_name = random_name(gender)
  father_name = "#{MALE_FIRST_NAMES.sample(random: RANDOM)} #{last_name}"
  mother_name = "#{FEMALE_FIRST_NAMES.sample(random: RANDOM)} #{LAST_NAMES.sample(random: RANDOM)}"

  anchor_juz = weighted_anchor_juz
  completed_juz_target = RANDOM.rand(0..8)
  completed_juz_list = build_completed_juz_list(anchor_juz, completed_juz_target)

  in_progress_candidates = if anchor_juz == 30
    [30, 29, 28]
  elsif anchor_juz == 1
    [1, 2, 3]
  else
    [anchor_juz, [anchor_juz - 1, 1].max, [anchor_juz + 1, 30].min]
  end

  in_progress_juz = (in_progress_candidates - completed_juz_list).sample(random: RANDOM) || anchor_juz
  current_surah = (JUZ_TO_SURAHS[in_progress_juz] || ["Al-Fatihah"]).sample(random: RANDOM)
  current_juz_display = in_progress_juz

  student = Student.create!(
    nisn: format("%010d", RANDOM.rand(1_000_000_000..9_999_999_999)),
    student_number: "#{Date.current.year}#{format('%03d', i + 1)}",
    name: full_name,
    current_hifz_in_juz: current_juz_display.to_s,
    current_hifz_in_pages: RANDOM.rand(1..20).to_s,
    current_hifz_in_surah: current_surah,
    total_juz_memorized: completed_juz_target,
    class_level: CLASSES.sample(random: RANDOM),
    phone: random_phone("081"),
    email: "#{first_name.downcase}.#{last_name.downcase}#{i}@example.com",
    status: STATUSES.sample(random: RANDOM),
    gender: gender,
    birth_place: CITIES.sample(random: RANDOM),
    birth_date: Date.current - RANDOM.rand(11..18).years - RANDOM.rand(0..300).days,
    address: "Jalan #{LAST_NAMES.sample(random: RANDOM)} No. #{RANDOM.rand(1..200)}, #{CITIES.sample(random: RANDOM)}",
    father_name: father_name,
    mother_name: mother_name,
    parent_phone: random_phone("08")
  )

  students << student

  start_date = Date.current - RANDOM.rand(8..18).months

  # Completed juz data: all surahs marked tuntas.
  completed_juz_list.each do |juz|
    surahs = JUZ_TO_SURAHS[juz] || []
    surahs.each_with_index do |surah, idx|
      activity_time = start_date + RANDOM.rand(0..220).days + idx.hours
      create_memorization_activity(
        student: student,
        juz: juz,
        surah: surah,
        completion_status: :tuntas,
        created_at: activity_time
      )

      # Small chance that an older incorrect status existed before final completion.
      if RANDOM.rand < 0.25
        create_memorization_activity(
          student: student,
          juz: juz,
          surah: surah,
          completion_status: :belum_tuntas,
          created_at: activity_time - RANDOM.rand(2..14).days
        )
      end
    end
  end

  # In-progress juz data: mix of tuntas and belum_tuntas, with latest status controlling final state.
  in_progress_surahs = JUZ_TO_SURAHS[in_progress_juz] || ["Al-Fatihah"]
  in_progress_surahs.each do |surah|
    first_time = start_date + RANDOM.rand(30..260).days
    create_memorization_activity(
      student: student,
      juz: in_progress_juz,
      surah: surah,
      completion_status: :tuntas,
      created_at: first_time
    )

    if RANDOM.rand < 0.5
      # Add a later evaluation that can override previous status.
      latest_status = RANDOM.rand < 0.7 ? :belum_tuntas : :tuntas
      create_memorization_activity(
        student: student,
        juz: in_progress_juz,
        surah: surah,
        completion_status: latest_status,
        created_at: first_time + RANDOM.rand(5..60).days
      )
    end
  end

  # Keep the student profile aligned with the active memorization area.
  student.update!(
    current_hifz_in_juz: in_progress_juz.to_s,
    current_hifz_in_surah: current_surah,
    total_juz_memorized: student.student_surah_progressions.where(completion_status: :tuntas).distinct.count(:juz)
  )

  # Additional revision activity spread.
  RANDOM.rand(20..50).times do
    juz = RANDOM.rand(1..30)
    surah = (JUZ_TO_SURAHS[juz] || ["Al-Fatihah"]).sample(random: RANDOM)
    created_at = start_date + RANDOM.rand(0..300).days + RANDOM.rand(8..18).hours
    create_revision_activity(student: student, juz: juz, surah: surah, created_at: created_at)
  end
end

puts "Creating parent users..."
students.select { |s| s.status == "active" }.first(8).each_with_index do |student, index|
  username = "parent#{index + 1}"

  User.find_or_create_by!(username: username) do |user|
    user.password = "parent123"
    user.name = student.father_name
    user.role = "parent"
    user.student_id = student.id
  end
end

puts "Seed complete"
puts "Students: #{Student.count}"
puts "Activities: #{Activity.count}"
puts "Surah progression records: #{StudentSurahProgression.count}"
puts "Users: #{User.count} (admin/teacher/parent)"
