# frozen_string_literal: true

puts "Resetting seed data..."

Session.delete_all
User.delete_all
Activity.delete_all
StudentSurahProgression.delete_all
Student.delete_all

# Reset PK sequences so test runs start from predictable IDs.
connection = ActiveRecord::Base.connection
tables_to_reset = %w[sessions users activities student_surah_progressions students]

if connection.respond_to?(:reset_pk_sequence!)
  tables_to_reset.each { |table| connection.reset_pk_sequence!(table) }
elsif connection.adapter_name.downcase.include?("sqlite")
  quoted = tables_to_reset.map { |name| "'#{name}'" }.join(",")
  connection.execute("DELETE FROM sqlite_sequence WHERE name IN (#{quoted})")
end

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

JUZ_TO_SURAHS = SurahJuzMapping::JUZ_TO_SURAHS

RANDOM = Random.new(42)

STARTING_JUZ_POOL = [30, 30, 30, 29, 28, 1, 1, 1, 15, 12].freeze
SEED_PROFILES = [
  :juz_30_first,
  :beginner_low_total,
  :mixed_non_linear
].freeze


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

def pick_profile(index, total)
  ratio = index.to_f / total
  return :juz_30_first if ratio < 0.5
  return :beginner_low_total if ratio < 0.75

  :mixed_non_linear
end

def profile_anchor_and_target(profile)
  case profile
  when :juz_30_first
    [ [30, 30, 30, 29, 28].sample(random: RANDOM), RANDOM.rand(2..8) ]
  when :beginner_low_total
    [ [1, 1, 2, 3].sample(random: RANDOM), RANDOM.rand(1..2) ]
  else
    [ RANDOM.rand(1..30), RANDOM.rand(1..7) ]
  end
end

def normalize_surah(surah)
  surah.to_s.downcase.gsub(/[^a-z0-9]/, "")
end

def completed_juz_count_from_progressions(student)
  by_juz = student.student_surah_progressions.where(completion_status: :tuntas).group_by(&:juz)

  JUZ_TO_SURAHS.count do |juz, surahs|
    expected = surahs.map { |s| normalize_surah(s) }.uniq
    actual = Array(by_juz[juz]).map { |row| normalize_surah(row.surah) }.uniq
    (expected - actual).empty?
  end
end

puts "Creating students and activities..."

student_count = 50
students = []
profile_counter = Hash.new(0)

student_count.times do |i|
  gender = GENDERS.sample(random: RANDOM)
  full_name, first_name, last_name = random_name(gender)
  father_name = "#{MALE_FIRST_NAMES.sample(random: RANDOM)} #{last_name}"

  profile = pick_profile(i, student_count)
  profile_counter[profile] += 1

  anchor_juz, completed_juz_target = profile_anchor_and_target(profile)
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

    tuntas_probability = case profile
    when :juz_30_first
      0.65
    when :beginner_low_total
      0.25
    else
      0.45
    end

    if RANDOM.rand < tuntas_probability
      # Optional earlier "belum_tuntas", then final "tuntas" (never downgrade).
      if RANDOM.rand < 0.4
        create_memorization_activity(
          student: student,
          juz: in_progress_juz,
          surah: surah,
          completion_status: :belum_tuntas,
          created_at: first_time - RANDOM.rand(3..20).days
        )
      end

      create_memorization_activity(
        student: student,
        juz: in_progress_juz,
        surah: surah,
        completion_status: :tuntas,
        created_at: first_time
      )
    else
      create_memorization_activity(
        student: student,
        juz: in_progress_juz,
        surah: surah,
        completion_status: :belum_tuntas,
        created_at: first_time
      )
    end
  end

  # Keep the student profile aligned with the active memorization area.
  student.update!(
    current_hifz_in_juz: in_progress_juz.to_s,
    current_hifz_in_surah: current_surah,
    total_juz_memorized: completed_juz_count_from_progressions(student)
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
puts "Seed profiles: #{profile_counter.inspect}"
