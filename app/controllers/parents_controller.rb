class ParentsController < ApplicationController
  include ActionView::Helpers::DateHelper
  include AvatarHelper
  include RoleAuthorization
  include SurahJuzMapping
  include StudentsHelper

  skip_before_action :authorize_role
  before_action :require_parent!
  before_action :ensure_student_assigned

  def show
    student = Current.user.student
    activities = student.activities.includes(audio_attachment: :blob).order(created_at: :desc)

    # Get recent activities (last 5 for display)
    recent_activities = activities.limit(5).map do |activity|
      {
        id: activity.id,
        activity: activity.description,
        time: time_ago_in_words(activity.created_at) + " yang lalu",
        type: activity.activity_type,
        date: activity.created_at.strftime("%Y-%m-%d"),
        created_at: activity.created_at,
        audio_url: activity.audio.attached? ? url_for(activity.audio) : nil
      }
    end

    # Get total count of all activities for the "View All" button
    total_activities_count = activities.count

    # Calculate monthly progress (cumulative juz progress)
    monthly_progress = calculate_monthly_progress(student, activities)

    # Calculate activity score distribution (based on K score)
    score_ranges = activities.pluck(:kelancaran).compact.map(&:to_i)
    grade_distribution = [
      { name: "Sangat Baik (40-50)", value: score_ranges.count { |s| s >= 40 }, color: "#10b981" },
      { name: "Baik (30-39)", value: score_ranges.count { |s| s >= 30 && s < 40 }, color: "#3b82f6" },
      { name: "Cukup (20-29)", value: score_ranges.count { |s| s >= 20 && s < 30 }, color: "#f59e0b" },
      { name: "Perlu Diperbaiki (<20)", value: score_ranges.count { |s| s < 20 }, color: "#ef4444" }
    ]

    # Calculate activity type distribution
    type_distribution = activities.group(:activity_type).count.map do |type, count|
      {
        name: type == "memorization" ? "Hafalan" : "Murajaah",
        value: count,
        color: Activity.color_for_type(type)
      }
    end

    # Calculate monthly activity distribution (last 6 months)
    monthly_activities = (5.months.ago.beginning_of_month.to_date..Date.current.end_of_month).
                        group_by(&:beginning_of_month).map do |month_start, dates|
      month_range = month_start..month_start.end_of_month
      revision_count = activities.where(created_at: month_range, activity_type: "revision").count
      memorization_count = activities.where(created_at: month_range, activity_type: "memorization").count

      {
        month: month_start.strftime("%b"),
        revision: revision_count,
        memorization: memorization_count
      }
    end

    render inertia: "Parent/Show", props: {
      student: student.as_json.merge(
        avatar: avatar_url(student, size: :medium)
      ),
      total_juz: total_juz_completed_for_student(student),
      recent_activities: recent_activities,
      total_activities_count: total_activities_count,
      total_activities: activities.count,
      monthly_progress: monthly_progress,
      grade_distribution: grade_distribution,
      type_distribution: type_distribution,
      monthly_activities: monthly_activities
    }
  end

  def activities_list
    student = Current.user.student
    
    # Pagination parameters
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50
    offset = (page - 1) * per_page

    # Fetch activities with pagination
    activities_query = student.activities.includes(audio_attachment: :blob)
                              .order(created_at: :desc)
    
    total_count = activities_query.count
    activities = activities_query.limit(per_page)
                                .offset(offset)
                                .map do |activity|
                                  {
                                    id: activity.id,
                                    activity: activity.description,
                                    time: time_ago_in_words(activity.created_at) + " yang lalu",
                                    type: activity.activity_type,
                                    grade: nil,
                                    surah_from: activity.surah,
                                    surah_to: activity.surah,
                                    page_from: activity.ayat_from,
                                    page_to: activity.ayat_to,
                                    juz: activity.juz,
                                    juz_from: nil,
                                    juz_to: nil,
                                    kelancaran: activity.kelancaran,
                                    fashohah: activity.fashohah,
                                    tajwid: activity.tajwid,
                                    notes: activity.notes,
                                    audio_url: activity.audio.attached? ? url_for(activity.audio) : nil
                                  }
                                end

    render json: {
      activities: activities,
      total_count: total_count,
      current_page: page,
      per_page: per_page,
      total_pages: (total_count.to_f / per_page).ceil
    }
  end

  private

  def ensure_student_assigned
    unless Current.user.student_id.present?
      redirect_to root_path, alert: "Akun Anda belum terhubung dengan pelajar. Silakan hubungi administrator."
    end
  end


end
