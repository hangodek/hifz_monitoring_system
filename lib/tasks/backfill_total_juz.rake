# frozen_string_literal: true

# lib/tasks/backfill_total_juz.rake
namespace :students do
  desc "Backfill the total_juz_memorized for all students"
  task backfill_total_juz_memorized: :environment do
    puts "Starting to backfill total juz memorized for all students..."

    Student.find_each do |student|
      student.recalculate_total_juz_memorized!
      puts "Updated #{student.name}: #{student.total_juz_memorized} juz memorized."
    end

    puts "Backfill complete."
  end
end
