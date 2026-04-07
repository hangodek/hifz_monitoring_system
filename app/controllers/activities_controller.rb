class ActivitiesController < ApplicationController
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_teacher_or_admin!
  before_action :set_student
  before_action :set_activity, only: [ :destroy ]

  def create
    @activity = @student.activities.build(create_activity_params)

    if @activity.save
      # Invalidate cache untuk teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
      # Update student's hifz progress for memorization activities with completed status
      if @activity.memorization?
        # Parse activity notes to check if status is completed
        notes_data = begin
          JSON.parse(@activity.notes) if @activity.notes.present?
        rescue
          nil
        end

        if notes_data&.dig("entry", "status") == "completed"
          # Calculate total juz memorized and find latest completed activity
          update_student_progress
        end
      end

      redirect_to teachers_path, notice: "Activity was successfully created."
    else
      redirect_to teachers_path, alert: @activity.errors.full_messages.join(", ")
    end
  end

  def destroy
    @activity.destroy
    
    # Invalidate cache untuk teacher mode
    Rails.cache.delete("teacher_active_students")
    Rails.cache.delete("student_activities_#{@student.id}")
    
    redirect_to teachers_path, notice: "Activity was successfully deleted."
  end

  private

  def set_student
    @student = Student.find(params[:student_id])
  end

  def set_activity
    @activity = @student.activities.find(params[:id])
  end

  def create_activity_params
    params.expect(activity: [ :activity_type, :activity_grade, :surah_from, :surah_to, :page_from, :page_to, :juz, :juz_from, :juz_to, :notes, :audio ])
  end

  def update_student_progress
    # Get all completed memorization activities
    completed_activities = @student.activities
      .where(activity_type: :memorization)
      .select { |a| 
        notes = begin
          JSON.parse(a.notes) if a.notes.present?
        rescue
          nil
        end
        notes&.dig("entry", "status") == "completed"
      }

    return if completed_activities.empty?

    # Calculate total unique juz that have been completed
    completed_juz_set = completed_activities.map { |a| a.juz }.compact.uniq.sort.reverse
    total_juz_memorized = completed_juz_set.count

    # Find the latest completed activity to get current memorization point
    latest_completed = completed_activities.max_by { |a| a.created_at }
    
    # Update student record
    update_data = {
      total_juz_memorized: total_juz_memorized,
      current_hifz_in_juz: latest_completed.juz.to_s,
      current_hifz_in_surah: latest_completed.surah_from
    }

    @student.update!(update_data)
  end
end
