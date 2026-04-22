class ActivitiesController < ApplicationController
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_teacher_or_admin!
  before_action :set_student
  before_action :set_activity, only: [ :destroy ]

  def create
    # Guard against stale schema metadata in long-lived processes after migrations.
    Activity.reset_column_information
    @activity = @student.activities.build(activity_params)

    if @activity.save
      # Invalidate cache for teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
      render json: { 
        success: true, 
        message: "Aktivitas berhasil dibuat.",
        activity: @activity.as_json
      }, status: :created
    else
      render json: { 
        success: false, 
        message: @activity.errors.full_messages.join(", "),
        errors: @activity.errors
      }, status: :unprocessable_entity
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

  def activity_params
    params.require(:activity).permit(
      :activity_type, 
      :juz,
      :surah, 
      :ayat_from, 
      :ayat_to, 
      :notes, 
      :kelancaran, 
      :fashohah, 
      :tajwid, 
        :completion_status,
      :audio
    )
  end
end
