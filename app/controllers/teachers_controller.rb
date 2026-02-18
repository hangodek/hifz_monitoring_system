class TeachersController < ApplicationController
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_teacher_or_admin!

  def index
    # Use caching for student list (5 minutes)
    students = Rails.cache.fetch("teacher_active_students", expires_in: 5.minutes) do
      Student.active.order(name: :asc).as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ])
    end

    render inertia: "Teacher/Index", props: {
      students: students,
      recent_activities: Activity.joins(:student)
                                .where(students: { status: "active" })
                                .includes(:student)
                                .order(created_at: :desc)
                                .limit(10)
                                .map do |activity|
        {
          id: activity.id.to_s,
          activity_type: activity.activity_type,
          activity_grade: activity.activity_grade,
          surah_from: activity.surah_from,
          surah_to: activity.surah_to,
          page_from: activity.page_from,
          page_to: activity.page_to,
          juz: activity.juz,
          juz_from: activity.juz_from,
          juz_to: activity.juz_to,
          notes: activity.notes,
          created_at: activity.created_at.iso8601,
          audio_url: activity.audio.attached? ? url_for(activity.audio) : nil,
          student: {
            id: activity.student.id.to_s,
            name: activity.student.name
          }
        }
      end
    }
  end

  # Search students endpoint for autocomplete
  def search_students
    query = params[:q].to_s.strip
    
    if query.blank?
      render json: []
      return
    end

    # Search with caching per query (2 minutes)
    results = Rails.cache.fetch("student_search_#{query.parameterize}", expires_in: 2.minutes) do
      Student.active
             .where("name LIKE ? OR class_level LIKE ?", "%#{query}%", "%#{query}%")
             .order(name: :asc)
             .limit(20)
             .as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ])
    end

    render json: results
  end

  # Load more activities endpoint
  def load_more_activities
    offset = params[:offset].to_i || 10
    
    activities = Activity.joins(:student)
                         .where(students: { status: "active" })
                         .includes(:student)
                         .order(created_at: :desc)
                         .offset(offset)
                         .limit(10)
                         .map do |activity|
      {
        id: activity.id.to_s,
        activity_type: activity.activity_type,
        activity_grade: activity.activity_grade,
        surah_from: activity.surah_from,
        surah_to: activity.surah_to,
        page_from: activity.page_from,
        page_to: activity.page_to,
        juz: activity.juz,
        juz_from: activity.juz_from,
        juz_to: activity.juz_to,
        notes: activity.notes,
        created_at: activity.created_at.iso8601,
        audio_url: activity.audio.attached? ? url_for(activity.audio) : nil,
        student: {
          id: activity.student.id.to_s,
          name: activity.student.name
        }
      }
    end

    render json: { activities: activities }
  end
end
