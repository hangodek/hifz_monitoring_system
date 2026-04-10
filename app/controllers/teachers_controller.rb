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
      recent_activities: [] # Activities loaded per-student via API
    }
  end

  # Get activities for a specific student
  def student_activities
    student_id = params[:student_id]
    
    if student_id.blank?
      render json: { activities: [] }
      return
    end

    # Cache activities per student (2 minutes)
    payload = Rails.cache.fetch("student_activities_#{student_id}", expires_in: 2.minutes) do
      activities = Activity.joins(:student)
                          .where(student_id: student_id, students: { status: "active" })
                          .order(created_at: :desc)
                          .map do |activity|
        {
          id: activity.id.to_s,
          activity_type: activity.activity_type,
          activity_grade: nil,
          surah_from: activity.surah,
          surah_to: activity.surah,
          page_from: activity.ayat_from,
          page_to: activity.ayat_to,
          juz: activity.juz,
          juz_from: nil,
          juz_to: nil,
          completion_status: activity.completion_status,
          kelancaran: activity.kelancaran,
          fashohah: activity.fashohah,
          tajwid: activity.tajwid,
          notes: activity.notes,
          created_at: activity.created_at.iso8601,
          audio_url: activity.audio.attached? ? url_for(activity.audio) : nil,
          student: {
            id: activity.student.id.to_s,
            name: activity.student.name
          }
        }
      end

      surah_progressions = StudentSurahProgression
        .where(student_id: student_id)
        .select(:juz, :surah, :completion_status, :last_activity_at)
        .map do |progression|
          {
            juz: progression.juz,
            surah: progression.surah,
            completion_status: progression.completion_status,
            last_activity_at: progression.last_activity_at&.iso8601
          }
        end

      {
        activities: activities,
        surah_progressions: surah_progressions
      }
    end

    render json: payload
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
        activity_grade: nil,
        surah_from: activity.surah,
        surah_to: activity.surah,
        page_from: activity.ayat_from,
        page_to: activity.ayat_to,
        juz: activity.juz,
        juz_from: nil,
        juz_to: nil,
        completion_status: activity.completion_status,
        kelancaran: activity.kelancaran,
        fashohah: activity.fashohah,
        tajwid: activity.tajwid,
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
