# frozen_string_literal: true

# lib/tasks/students.rake
namespace :students do
  desc "Recalculate and update the total_juz_memorized for all students"
  task recalculate_total_juz_memorized: :environment do
    puts "Starting recalculation of total juz memorized for all students..."

    # Eager load progressions to avoid N+1 queries inside the loop
    students = Student.includes(:student_surah_progressions)

    # Build a reverse mapping from surah name to surah number
    surah_name_to_number = SurahJuzMapping::SURAHS.each_with_object({}) do |(num, name, _), hash|
      hash[name] = num
    end

    students.find_each do |student|
      # Group progressions by surah_number and get the latest status
      latest_progressions = student.student_surah_progressions
                                   .group_by(&:surah_number)
                                   .transform_values do |progressions|
                                     progressions.max_by(&:updated_at)
                                   end

      completed_juz_count = 0
      (1..30).each do |juz_number|
        surah_names_in_juz = SurahJuzMapping::JUZ_TO_SURAHS[juz_number]
        next if surah_names_in_juz.nil? || surah_names_in_juz.empty?

        # Get the corresponding surah numbers for the names
        surah_numbers_in_juz = surah_names_in_juz.map { |name| surah_name_to_number[name] }.compact

        # Check if all surahs in the juz are 'tuntas'
        is_juz_completed = surah_numbers_in_juz.all? do |surah_number|
          progression = latest_progressions[surah_number]
          progression&.completion_status == "tuntas"
        end

        completed_juz_count += 1 if is_juz_completed
      end

      # Update the student record
      student.update_column(:total_juz_memorized, completed_juz_count)
      puts "Updated #{student.name}: #{completed_juz_count} juz memorized."
    end

    puts "Recalculation complete."
  end
end
