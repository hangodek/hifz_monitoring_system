# frozen_string_literal: true

# app/models/concerns/student_juz_completion.rb
module StudentJuzCompletion
  extend ActiveSupport::Concern

  included do
    # After a progression is saved (created or updated), trigger recalculation.
    # This ensures that when a surah is marked 'tuntas', the total count is updated.
    after_save :recalculate_student_total_juz_memorized
  end

  def recalculate_student_total_juz_memorized
    student.recalculate_total_juz_memorized!
  end
end
