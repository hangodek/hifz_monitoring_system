class StudentsController < ApplicationController
  include ActionView::Helpers::DateHelper
  include AvatarHelper
  
  def index
    students = Student.all.order(name: :asc).map do |student|
      student.as_json.merge(
        avatar: avatar_url(student, size: :thumb)
      )
    end

    render inertia: "Student/Index", props: {
      students: students
    }
  end

  def show
    student = Student.find(params[:id])
    activities = student.activities.order(created_at: :desc)

    # Get recent activities (last 5 for display)
    recent_activities = activities.limit(5).map do |activity|
      {
        id: activity.id,
        activity: format_activity_description(activity),
        time: time_ago_in_words(activity.created_at) + " ago",
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

    # Calculate activity grade distribution
    grade_distribution = activities.group(:activity_grade).count.map do |grade, count|
      {
        name: grade.humanize,
        value: count,
        color: grade_color(grade)
      }
    end

    # Calculate activity type distribution
    type_distribution = activities.group(:activity_type).count.map do |type, count|
      {
        name: type.humanize,
        value: count,
        color: type_color(type)
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

    render inertia: "Student/Show", props: {
      student: student.as_json.merge(
        avatar: avatar_url(student, size: :medium)
      ),
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
    student = Student.find(params[:id])
    
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
                                    activity: format_activity_description(activity),
                                    time: time_ago_in_words(activity.created_at) + " ago",
                                    type: activity.activity_type,
                                    grade: translate_grade(activity.activity_grade),
                                    surah_from: activity.surah_from,
                                    surah_to: activity.surah_to,
                                    page_from: activity.page_from,
                                    page_to: activity.page_to,
                                    juz: activity.juz,
                                    juz_from: activity.juz_from,
                                    juz_to: activity.juz_to,
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

  def new
    render inertia: "Student/New"
  end

  def create
    @student = Student.new(student_params)

    if @student.save
      redirect_to students_path, notice: "Student created successfully!"
    else
      render inertia: "Student/New", props: {
        errors: @student.errors
      }
    end
  end

  def edit
    @student = Student.find(params[:id])

    render inertia: "Student/Edit", props: {
      student: @student.as_json.merge(
        avatar: avatar_url(@student, size: :medium)
      )
    }
  end

  def update
    @student = Student.find(params[:id])

    if @student.update(student_params)
      redirect_to student_path(@student), notice: "Student updated successfully!"
    else
      render inertia: "Student/Edit", props: {
        student: @student.as_json.merge(
          avatar: @student.avatar.attached? ? url_for(@student.avatar) : nil
        ),
        errors: @student.errors
      }
    end
  end

  private

  def student_params
    params.expect(student: [ :name, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah, :avatar, :class_level, :phone, :email, :status, :gender, :birth_place, :birth_date, :address, :father_name, :mother_name, :father_phone, :mother_phone, :date_joined ])
  end

  def translate_grade(grade)
    translations = {
      'excellent' => 'Cemerlang',
      'good' => 'Baik',
      'fair' => 'Sederhana',
      'needs_improvement' => 'Perlu Diperbaiki'
    }
    translations[grade] || grade.humanize
  end

  def format_activity_description(activity)
    surah_display = activity.surah_from == activity.surah_to ? activity.surah_from : "#{activity.surah_from} - #{activity.surah_to}"

    case activity.activity_type
    when "memorization"
      "Menghafal #{surah_display} muka surat #{activity.page_from}-#{activity.page_to}"
    when "revision"
      "Murajaah #{surah_display} muka surat #{activity.page_from}-#{activity.page_to}"
    else
      "#{activity.activity_type.humanize} #{surah_display} muka surat #{activity.page_from}-#{activity.page_to}"
    end
  end

  def calculate_monthly_progress(student, activities)
    current_juz = student.current_hifz_in_juz.to_i
    join_date = Date.parse(student.date_joined) rescue Date.current

    # Get memorization activities ordered by date
    memorization_activities = activities.where(activity_type: "memorization").order(:created_at)

    # Always show 3 months back and 3 months forward
    current_month = Date.current.beginning_of_month
    start_date = current_month - 3.months
    end_date = current_month + 3.months
    
    # If no activities, show flat line at current juz for all months
    if memorization_activities.empty?
      monthly_data = []
      month_iterator = start_date
      
      while month_iterator <= end_date
        monthly_data << {
          month: month_iterator.strftime("%b"),
          completed: current_juz,
          is_projected: month_iterator > current_month
        }
        month_iterator = month_iterator.next_month
      end
      
      return monthly_data
    end

    # Get the date of first activity
    first_activity_date = memorization_activities.first.created_at.to_date.beginning_of_month

    monthly_data = []
    month_iterator = start_date

    # Calculate progress for each month based on actual activities
    while month_iterator <= end_date
      month_name = month_iterator.strftime("%b")
      month_range = month_iterator.beginning_of_month..month_iterator.end_of_month

      if month_iterator == current_month
        # Current month: use actual current progress
        completed = current_juz
        is_projected = false
      elsif month_iterator < current_month
        # Historical months
        if month_iterator < first_activity_date
          # Before first activity: student was at juz 1 (or their initial state)
          completed = 1
        else
          # After first activity: calculate based on activities up to that month
          activities_up_to_month = memorization_activities.where(
            "created_at <= ?", month_iterator.end_of_month
          )
          
          if activities_up_to_month.empty?
            # No activities yet in this month - use initial juz (1)
            completed = 1
          else
            # Get the maximum juz reached up to this point
            max_juz_reached = activities_up_to_month.maximum(:juz) || 1
            completed = max_juz_reached
          end
        end
        
        is_projected = false
      else
        # Future months: project based on recent activity rate
        recent_activities = memorization_activities.where(
          created_at: (current_month - 3.months)..current_month
        )
        
        if recent_activities.count > 0
          # Calculate average growth rate from recent activities
          months_with_recent_activities = ((current_month.year - (current_month - 3.months).year) * 12 + 
                                           current_month.month - (current_month - 3.months).month)
          months_with_recent_activities = [ months_with_recent_activities, 1 ].max
          
          # Calculate juz growth in recent period
          earliest_recent_juz = recent_activities.minimum(:juz) || current_juz
          juz_growth = current_juz - earliest_recent_juz
          monthly_growth_rate = juz_growth.to_f / months_with_recent_activities
          monthly_growth_rate = [ monthly_growth_rate, 0.5 ].max # Minimum 0.5 juz per month
          monthly_growth_rate = [ monthly_growth_rate, 2.0 ].min # Maximum 2 juz per month
          
          months_forward = ((month_iterator.year - current_month.year) * 12 + 
                           month_iterator.month - current_month.month)
          projected_progress = current_juz + (months_forward * monthly_growth_rate)
          completed = [ projected_progress.round, 30 ].min
        else
          # No recent activity - stay at current level
          completed = current_juz
        end
        
        is_projected = true
      end

      # Ensure we never go above 30 or below 1
      completed = completed.clamp(1, 30)

      monthly_data << {
        month: month_name,
        completed: completed,
        is_projected: is_projected
      }

      month_iterator = month_iterator.next_month
    end

    monthly_data
  end

  def grade_color(grade)
    case grade
    when "excellent"
      "#10b981" # green
    when "good"
      "#3b82f6" # blue
    when "fair"
      "#f59e0b" # yellow/orange
    when "needs_improvement"
      "#ef4444" # red
    else
      "#6b7280" # gray
    end
  end

  def type_color(type)
    case type
    when "memorization"
      "#3b82f6" # blue
    when "revision"
      "#10b981" # green
    else
      "#6b7280" # gray
    end
  end
end
