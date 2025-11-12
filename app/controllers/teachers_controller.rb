class TeachersController < ApplicationController
  def index
    students = Student.active.includes(:activities).order(name: :asc)

    render inertia: "Teacher/Index", props: {
      students: students.as_json(only: [ :id, :name, :class_level, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah ]),
      recent_activities: Activity.joins(:student)
                                .where(students: { status: "active" })
                                .includes(:student)
                                .order(created_at: :desc)
                                .limit(50)
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
end
