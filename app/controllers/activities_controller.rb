class ActivitiesController < ApplicationController
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_guru_or_pengurus!
  before_action :set_student
  before_action :set_activity, only: [ :destroy ]

  def create
    @activity = @student.activities.build(create_activity_params)

    if @activity.save
      # Update student's hifz progress if it's a memorization activity and new progress is provided
      if @activity.memorization? && params.dig(:activity, :new_hifz_juz).present? && params.dig(:activity, :new_hifz_pages).present?
        new_juz = params.dig(:activity, :new_hifz_juz).to_i
        new_pages = params.dig(:activity, :new_hifz_pages).to_i
        new_surah = params.dig(:activity, :new_hifz_surah)
        current_juz = @student.current_hifz_in_juz.to_i
        current_pages = @student.current_hifz_in_pages.to_i

        # Only update if new progress is greater than current
        if new_juz > current_juz || (new_juz == current_juz && new_pages > current_pages)
          update_data = {
            current_hifz_in_juz: new_juz.to_s,
            current_hifz_in_pages: new_pages.to_s
          }

          # Update current surah if provided
          update_data[:current_hifz_in_surah] = new_surah if new_surah.present?

          @student.update!(update_data)
        end
      end

      redirect_to teachers_path, notice: "Activity was successfully created."
    else
      redirect_to teachers_path, alert: @activity.errors.full_messages.join(", ")
    end
  end

  def destroy
    @activity.destroy
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
end
