class ActivitiesController < ApplicationController
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_teacher_or_admin!
  before_action :set_student
  before_action :set_activity, only: [ :destroy ]

  def create
    @activity = @student.activities.build(activity_params)

    if @activity.save
      # Invalidate cache for teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
      redirect_to teachers_path, notice: "Aktivitas berhasil dibuat."
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

  def activity_params
    params.require(:activity).permit(
      :activity_type, 
      :surah, 
      :ayat_from, 
      :ayat_to, 
      :notes, 
      :kelancaran, 
      :fashohah, 
      :tajwid, 
      :audio
    )
  end
end
