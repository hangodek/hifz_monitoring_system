# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

puts "Destroying existing records..."

User.destroy_all
Student.destroy_all
Activity.destroy_all

puts "Seeding initial data..."

# Create default users with different roles
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

puts "Creating new student records..."

# --- Data for random selection ---
# Updated class format for SMP/SMA (7-12 dengan A-D)
CLASSES = [
  # Kelas 7-9 (SMP) - fokus penelitian
  "7A", "7B", "7C", "7D",
  "8A", "8B", "8C", "8D",
  "9A", "9B", "9C", "9D",
  # Kelas 10-12 (SMA) - opsional untuk masa depan
  "10A", "10B", "10C", "10D",
  "11A", "11B", "11C", "11D",
  "12A", "12B", "12C", "12D"
]
STATUSES = [ "active", "inactive", "graduated" ]
GENDERS = [ "male", "female" ]

MALE_FIRST_NAMES = [ "Adam", "Yusuf", "Ibrahim", "Musa", "Dawud", "Sulaiman", "Zayd", "Omar", "Ali", "Hassan" ]
FEMALE_FIRST_NAMES = [ "Maryam", "Fatima", "Aisha", "Khadija", "Zainab", "Safiya", "Hafsa", "Ruqayyah", "Asma", "Hajar" ]
LAST_NAMES = [ "Khan", "Ahmed", "Ali", "Hussain", "Malik", "Abdullah", "Rahman", "Siddiqui", "Farooq", "Iqbal" ]
CITIES = [ "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Depok", "Tangerang", "Bekasi" ]

# Activity related data
ACTIVITY_TYPES = [ "memorization", "revision" ]
ACTIVITY_GRADES = [ "excellent", "good", "fair", "needs_improvement" ]

# Mapping of Juz to their corresponding Surahs
JUZ_TO_SURAHS = {
  1 => [ "Al-Fatihah", "Al-Baqarah" ],
  2 => [ "Al-Baqarah" ],
  3 => [ "Al-Baqarah", "Ali 'Imran" ],
  4 => [ "Ali 'Imran", "An-Nisa" ],
  5 => [ "An-Nisa" ],
  6 => [ "An-Nisa", "Al-Ma'idah" ],
  7 => [ "Al-Ma'idah", "Al-An'am" ],
  8 => [ "Al-An'am", "Al-A'raf" ],
  9 => [ "Al-A'raf", "Al-Anfal" ],
  10 => [ "Al-Anfal", "At-Tawbah" ],
  11 => [ "At-Tawbah", "Yunus", "Hud" ],
  12 => [ "Hud", "Yusuf" ],
  13 => [ "Yusuf", "Ar-Ra'd", "Ibrahim" ],
  14 => [ "Al-Hijr", "An-Nahl" ],
  15 => [ "Al-Isra", "Al-Kahf" ],
  16 => [ "Al-Kahf", "Maryam", "Ta-Ha" ],
  17 => [ "Al-Anbiya", "Al-Hajj" ],
  18 => [ "Al-Mu'minun", "An-Nur" ],
  19 => [ "An-Nur", "Al-Furqan", "Ash-Shu'ara" ],
  20 => [ "An-Naml", "Al-Qasas" ],
  21 => [ "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah" ],
  22 => [ "Al-Ahzab" ],
  23 => [ "Al-Ahzab", "Saba", "Fatir", "Ya-Sin" ],
  24 => [ "As-Saffat", "Sad", "Az-Zumar" ],
  25 => [ "Az-Zumar", "Ghafir", "Fussilat" ],
  26 => [ "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah" ],
  27 => [ "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat" ],
  28 => [ "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid" ],
  29 => [ "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim" ],
  30 => [ "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas" ]
}

# --- Generate 20 dummy student records ---
50.times do |i|
  gender = GENDERS.sample

  if gender == 'male'
    first_name = MALE_FIRST_NAMES.sample
    mother_first_name = FEMALE_FIRST_NAMES.sample
    father_first_name = MALE_FIRST_NAMES.sample
  else
    first_name = FEMALE_FIRST_NAMES.sample
    mother_first_name = FEMALE_FIRST_NAMES.sample
    father_first_name = MALE_FIRST_NAMES.sample
  end

  last_name = LAST_NAMES.sample
  student_name = "#{first_name} #{last_name}"
  father_name = "#{father_first_name} #{last_name}"
  mother_name = "#{mother_first_name} #{LAST_NAMES.sample}"

  # Assuming your model is named Student. If not, change Student to your model's name.
  current_juz = rand(1..30)
  current_pages = rand(1..20)

  # Set current surah based on the juz they're in
  current_surah = JUZ_TO_SURAHS[current_juz]&.sample || "Al-Fatihah"

  Student.create!(
    nisn: "#{rand(1000000000..9999999999)}", # NISN 10 digit
    student_number: "#{Date.today.year}#{sprintf('%03d', i + 1)}", # Format: 2026001, 2026002, dst
    name: student_name,
    current_hifz_in_juz: current_juz.to_s,
    current_hifz_in_pages: current_pages.to_s,
    current_hifz_in_surah: current_surah,
    class_level: CLASSES.sample,
    phone: "081#{rand(100..999)}#{rand(1000..9999)}",
    email: "#{first_name.downcase}.#{last_name.downcase}#{i}@example.com",
    status: STATUSES.sample,
    gender: gender,
    birth_place: CITIES.sample,
    birth_date: (Date.today - rand(10..25).years - rand(0..365).days).to_s,
    address: "#{rand(10..100)} Jalan Merdeka, #{CITIES.sample}",
    father_name: father_name,
    mother_name: mother_name,
    parent_phone: "08#{rand(1..9)}#{rand(100..999)}#{rand(1000..9999)}" # No HP Orang Tua (1 saja)
    # avatar is skipped as requested
  )
end

puts "Finished!"
puts "Created #{Student.count} student records."

puts "Creating activities for students..."

# Create activities for each student
Student.all.each do |student|
  # Use created_at or generate a realistic join date (1-3 years ago based on their class)
  # For students in higher grades, assume they joined earlier
  class_number = student.class_level.to_i
  years_in_school = [12 - class_number + 1, 6].min.clamp(1, 6) # Calculate years since they would have joined
  
  # Generate join date: earlier for senior students, more recent for junior students
  months_ago = rand((years_in_school * 12 - 6)..(years_in_school * 12 + 6))
  join_date = Date.current - months_ago.months

  # Create activities from join date to now, with more activities in recent months
  total_days_since_joining = (Date.current - join_date).to_i

  # Create 50-120 activities based on how long they've been in the program
  base_activities = 50
  bonus_activities = [ total_days_since_joining / 15, 70 ].min # 2 extra activities per month, max 70 bonus
  activity_count = rand(base_activities..(base_activities + bonus_activities))

  # Generate realistic activity dates first
  activity_dates = []

  # Create activities with realistic patterns - some days have multiple, some have none
  days_to_distribute = (join_date..Date.current).to_a

  activity_count.times do
    # Weight recent dates more heavily
    if rand(100) < 40 && days_to_distribute.size > 90
      # 40% chance for recent dates (last 3 months)
      recent_days = days_to_distribute.last(90)
      selected_date = recent_days.sample
    elsif rand(100) < 70 && days_to_distribute.size > 30
      # 30% chance for medium dates (last 6 months)
      medium_days = days_to_distribute.last(180).first(90)
      selected_date = medium_days.sample
    else
      # 30% chance for any date since joining
      selected_date = days_to_distribute.sample
    end

    activity_dates << selected_date
  end

  # Sort dates and process them
  activity_dates.sort.each do |activity_date|
    activity_type = ACTIVITY_TYPES.sample
    activity_grade = ACTIVITY_GRADES.sample

    # Random time during school hours (8 AM to 6 PM)
    created_time = activity_date.to_time + rand(8..18).hours + rand(0..59).minutes

    # Generate random page numbers
    page_from = rand(1..15)
    page_to = page_from + rand(1..5)

    # Generate juz and surah based on when the activity happened
    current_juz = student.current_hifz_in_juz.to_i
    days_since_activity = (Date.current - activity_date).to_i

    # For older activities, use lower juz numbers (showing progression)
    if days_since_activity > 180 # 6+ months ago
      max_juz_then = [ current_juz - 3, 1 ].max
      activity_juz = rand(1..[ max_juz_then, 1 ].max)
    elsif days_since_activity > 90 # 3-6 months ago
      max_juz_then = [ current_juz - 1, 1 ].max
      activity_juz = rand(1..[ max_juz_then, 1 ].max)
    else # Recent activities
      # Can work on current juz or recent ones for revision
      min_juz = [ 1, current_juz - 2 ].max
      max_juz = [ current_juz, 30 ].min
      activity_juz = rand(min_juz..max_juz)
    end

    # Ensure activity_juz is within valid range (1-30)
    activity_juz = [ [ activity_juz, 1 ].max, 30 ].min

    # Get appropriate surahs for the selected juz
    available_surahs = JUZ_TO_SURAHS[activity_juz] || [ "Al-Fatihah" ]
    surah = available_surahs.sample

    # Ensure surah is not nil
    surah = "Al-Fatihah" if surah.nil? || surah.empty?

    Activity.create!(
      student: student,
      activity_type: activity_type,
      activity_grade: activity_grade,
      surah_from: surah,
      surah_to: surah,
      page_from: page_from,
      page_to: page_to,
      juz: activity_juz,
      notes: "#{activity_type.humanize} session for #{surah} - Grade: #{activity_grade.humanize}",
      created_at: created_time,
      updated_at: created_time
    )
  end
end

puts "Created #{Activity.count} activities."

puts "Creating parent users..."

# Create parent users for first 5 students
Student.limit(5).each_with_index do |student, index|
  parent_username = "parent#{index + 1}"
  
  User.find_or_create_by!(username: parent_username) do |user|
    user.password = "parent123"
    user.name = student.father_name # Use father's name as parent account
    user.role = "parent"
    user.student_id = student.id
  end
  
  puts "Created parent user '#{parent_username}' for student '#{student.name}'"
end

puts "Created #{User.where(role: 'orang_tua').count} parent users."
puts "Seeding completed successfully!"
