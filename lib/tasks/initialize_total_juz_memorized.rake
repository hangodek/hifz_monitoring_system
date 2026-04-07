namespace :db do
  desc "Initialize total_juz_memorized for existing students"
  task initialize_total_juz_memorized: :environment do
    Student.find_each do |student|
      # Get all completed memorization activities
      completed_activities = student.activities
        .where(activity_type: :memorization)
        .select { |a| 
          notes = begin
            JSON.parse(a.notes) if a.notes.present?
          rescue
            nil
          end
          notes&.dig("entry", "status") == "completed"
        }

      if completed_activities.any?
        # Calculate total unique juz that have been completed
        completed_juz_set = completed_activities.map { |a| a.juz }.compact.uniq
        total_juz_memorized = completed_juz_set.count

        # Find the latest completed activity
        latest_completed = completed_activities.max_by { |a| a.created_at }
        
        # Update student record
        student.update(
          total_juz_memorized: total_juz_memorized,
          current_hifz_in_juz: latest_completed.juz.to_s,
          current_hifz_in_surah: latest_completed.surah_from
        )

        puts "Updated student #{student.name}: #{total_juz_memorized} juz memorized"
      else
        # No completed activities, set to 0
        student.update(total_juz_memorized: 0)
        puts "Student #{student.name}: no completed activities, set to 0 juz"
      end
    end

    puts "Done!"
  end
end
