class StudentsController < ApplicationController
  DEFAULT_STUDENTS_PER_PAGE = 20
  JUZ_FILTER_RANGES = {
    "Juz 1-5" => 1..5,
    "Juz 6-10" => 6..10,
    "Juz 11-15" => 11..15,
    "Juz 16-20" => 16..20,
    "Juz 21-25" => 21..25,
    "Juz 26-30" => 26..30
  }.freeze

  include ActionView::Helpers::DateHelper
  include AvatarHelper
  include RoleAuthorization
  include SurahJuzMapping
  include StudentsHelper

  skip_before_action :authorize_role
  before_action :require_admin!, except: [ :show, :activities_list ]
  before_action :require_admin_or_teacher!, only: [ :show, :activities_list ]
  
  def index
    page = current_page
    per_page = students_per_page

    students_query = filtered_students_query
    total_count = students_query.count

    all_students = students_query.to_a
    students = paginated_students(students_query, page, per_page)

    parent_credentials = flash[:parent_credentials]

    render inertia: "Student/Index", props: {
      students: students,
      parent_credentials: parent_credentials,
      statistics: build_students_statistics(all_students),
      pagination: build_pagination_meta(total_count, page, per_page)
    }
  end

  def load_more
    page = current_page
    per_page = students_per_page

    students_query = filtered_students_query
    total_count = students_query.count
    students = paginated_students(students_query, page, per_page)

    render json: {
      students: students,
      pagination: build_pagination_meta(total_count, page, per_page)
    }
  end

  def export_report
    students = apply_student_filters(students_query_with_memorization_summary).order(:class_level, :name).to_a
    report_stream = Students::ReportExporter.new(students).to_stream

    send_data report_stream,
              filename: "laporan_hafalan_siswa_#{Date.current}.xlsx",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              disposition: "attachment"
  end

  def apply_student_filters(students_query)
    query = apply_search_filter(students_query)
    query = apply_class_filter(query)
    query = apply_status_filter(query)
    apply_juz_filter(query)
  end

  def apply_search_filter(query)
    return query unless params[:search].present?

    search_term = params[:search].strip.downcase
    query.where(
      "LOWER(name) LIKE ? OR LOWER(nisn) LIKE ? OR LOWER(student_number) LIKE ?",
      "%#{search_term}%",
      "%#{search_term}%",
      "%#{search_term}%"
    )
  end

  def apply_class_filter(query)
    return query unless params[:class_filter].present? && params[:class_filter] != "all"

    query.where(class_level: params[:class_filter])
  end

  def apply_status_filter(query)
    return query unless params[:status_filter].present? && params[:status_filter] != "all"

    query.where(status: params[:status_filter])
  end

  def apply_juz_filter(query)
    return query unless params[:juz_filter].present? && params[:juz_filter] != "all"

    juz_range = JUZ_FILTER_RANGES[params[:juz_filter]]
    return query unless juz_range

    query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", juz_range.begin, juz_range.end)
  end

  def students_query_with_memorization_summary
    Student.includes(:student_surah_progressions)
  end

  def filtered_students_query
    apply_student_filters(students_query_with_memorization_summary).order(name: :asc)
  end

  def current_page
    params[:page]&.to_i || 1
  end

  def students_per_page
    DEFAULT_STUDENTS_PER_PAGE
  end

  def paginated_students(query, page, per_page)
    query.limit(per_page)
         .offset((page - 1) * per_page)
         .map { |student| serialize_student_for_index(student) }
  end

  def build_students_statistics(students)
    {
      total: students.count,
      active: students.count { |student| student.status == "active" },
      inactive: students.count { |student| student.status == "inactive" },
      graduated: students.count { |student| student.status == "graduated" },
      class_distribution: students.group_by(&:class_level).transform_values(&:count)
    }
  end

  def build_pagination_meta(total_count, page, per_page)
    total_pages = (total_count.to_f / per_page).ceil
    {
      current_page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages,
      has_more: page < total_pages
    }
  end

  def serialize_student_for_index(student)
    student.as_json.merge(
      "avatar" => avatar_url(student, size: :thumb),
      "total_juz_memorized" => student.total_juz_memorized || 0,
      "completed_surah_count" => student.completed_surah_count,
      "date_joined" => student.created_at&.iso8601
    )
  end

  def class_level_sort_key(class_name)
    match = class_name.to_s.match(/\A(\d+)([A-Za-z]*)\z/)
    return [ 999, class_name.to_s ] unless match

    [ match[1].to_i, match[2].to_s ]
  end

  def completed_surah_count_for(student)
    student.completed_surah_count
  end

  def show
    student = Student.find(params[:id])
    activities = student.activities.order(created_at: :desc)
    today_submissions = activities.where(created_at: Time.zone.now.all_day).count

    # Get recent activities (last 5 for display)
    recent_activities = activities.limit(5).map do |activity|
      {
        id: activity.id,
        activity: activity.description,
        time: time_ago_in_words(activity.created_at) + " yang lalu",
        type: activity.activity_type,
        date: activity.created_at.strftime("%Y-%m-%d"),
        created_at: activity.created_at,
        kelancaran: activity.kelancaran,
        fashohah: activity.fashohah,
        tajwid: activity.tajwid,
        completion_status: activity.completion_status,
        audio_url: activity.audio.attached? ? url_for(activity.audio) : nil
      }
    end

    # Get total count of all activities for the "View All" button
    total_activities_count = activities.count

    # Daily submission counts from all activities (not limited to recent items).
    # Build date keys in app timezone to keep charts and "today" count consistent.
    daily_submission_counts = activities
      .pluck(:created_at)
      .each_with_object(Hash.new(0)) do |created_at, counts|
        key = created_at.in_time_zone.to_date.to_s
        counts[key] += 1
      end

    # Calculate monthly progress (cumulative juz progress)
    monthly_progress = calculate_monthly_progress(student, activities)

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

    render inertia: "Student/Show", props: {
      student: student.as_json.merge(
        avatar: avatar_url(student, size: :medium),
        total_juz_memorized: total_juz_completed_for_student(student),
        completed_surah_count: student.completed_surah_count
      ),
      recent_activities: recent_activities,
      total_activities_count: total_activities_count,
      total_activities: activities.count,
      today_submissions: today_submissions,
      today_date: Time.zone.today.to_s,
      daily_submission_counts: daily_submission_counts,
      monthly_progress: monthly_progress,
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
                                    activity: activity.description,
                                    time: time_ago_in_words(activity.created_at) + " yang lalu",
                                    type: activity.activity_type,
                                    surah: activity.surah,
                                    ayat_from: activity.ayat_from,
                                    ayat_to: activity.ayat_to,
                                    juz: activity.juz,
                                    kelancaran: activity.kelancaran,
                                    fashohah: activity.fashohah,
                                    tajwid: activity.tajwid,
                                    completion_status: activity.completion_status,
                                    score: calculate_activity_score(activity),
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
    result = Students::Creator.new(student_params: student_params).create!
    @student = result[:student]

    if result[:success]
      # Invalidate cache untuk teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
      if result[:parent_user].persisted?
        # Store credentials in flash to display to admin
        flash[:parent_credentials] = result[:parent_credentials]
        redirect_to students_path, notice: "Student and parent account created successfully!"
      else
        redirect_to students_path, notice: "Student created but failed to create parent account: #{result[:parent_user].errors.full_messages.join(', ')}"
      end
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
      # Invalidate cache untuk teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
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

  def promote
    students = Student.all.order(name: :asc).map do |student|
      student.as_json.merge(
        avatar: avatar_url(student, size: :thumb)
      )
    end

    # Define all available class levels (7-12 with A-D sections)
    class_levels = []
    (7..12).each do |grade|
      ['A', 'B', 'C', 'D'].each do |section|
        class_levels << "#{grade}#{section}"
      end
    end

    render inertia: "Student/Promote", props: {
      students: students,
      class_levels: class_levels
    }
  end

  def bulk_promote
    result = Students::BulkPromoter.new(
      student_ids: params[:student_ids],
      target_class: params[:target_class],
      mark_as_graduated: params[:mark_as_graduated]
    ).promote!

    if result[:error]
      render json: { error: result[:error] }, status: result[:status] || :unprocessable_entity
    else
      render json: result
    end
  end

  # Bulk import methods
  def bulk_import
    render inertia: "Student/BulkImport"
  end

  def download_template
    respond_to do |format|
      format.xlsx do
        file_stream = Students::TemplateGenerator.new(juz_30_surahs: juz_30_surahs).generate
        
        send_data file_stream,
                  filename: "template_import_siswa_#{Date.current}.xlsx",
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  disposition: 'attachment'
      end
    end
  end

  def preview_import
    result = Students::BulkImporter.new(juz_30_surahs: juz_30_surahs).preview(params[:file])
    
    if result[:error]
      render json: { error: result[:error] }, status: result[:status] || :unprocessable_entity
    else
      render json: result
    end
  end

  def bulk_create
    result = Students::BulkImporter.new(juz_30_surahs: juz_30_surahs).bulk_create(params[:students])
    
    if result[:error]
      render json: { error: result[:error] }, status: result[:status] || :unprocessable_entity
    else
      render json: result
    end
  end

  private

  def juz_30_surahs
    Array(JUZ_TO_SURAHS[30])
  end

  def juz_30_column_name(surah)
    "Juz 30 - #{surah} (tuntas/belum_tuntas)"
  end

  def student_params
    params.expect(student: [ :nisn, :student_number, :name, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah, :avatar, :class_level, :phone, :email, :status, :gender, :birth_place, :birth_date, :address, :father_name, :parent_phone ])
  end





end
