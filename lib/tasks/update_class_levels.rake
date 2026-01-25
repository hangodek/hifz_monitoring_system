namespace :db do
  desc "Update class levels from old format (Class A/B/C) to new format (7A-12D)"
  task update_class_levels: :environment do
    puts "Starting class level migration..."
    
    # Mapping from old format to new format
    class_mapping = {
      "Class A" => "7A",
      "Class B" => "7B",
      "Class C" => "7C"
    }
    
    total_updated = 0
    
    Student.find_each do |student|
      old_class = student.class_level
      new_class = class_mapping[old_class]
      
      if new_class
        student.update_column(:class_level, new_class)
        puts "Updated #{student.name}: #{old_class} -> #{new_class}"
        total_updated += 1
      else
        puts "Skipped #{student.name}: #{old_class} (no mapping found)"
      end
    end
    
    puts "\nMigration completed!"
    puts "Total students updated: #{total_updated}"
    puts "Total students in database: #{Student.count}"
  end
end
