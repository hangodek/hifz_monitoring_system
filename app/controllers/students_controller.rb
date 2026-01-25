class StudentsController < ApplicationController
  include ActionView::Helpers::DateHelper
  include AvatarHelper
  include RoleAuthorization

  skip_before_action :authorize_role
  before_action :require_admin!
  
  def index
    students = Student.all.order(name: :asc).map do |student|
      student.as_json.merge(
        avatar: avatar_url(student, size: :thumb)
      )
    end

    # Get parent credentials from flash if available
    parent_credentials = flash[:parent_credentials]

    render inertia: "Student/Index", props: {
      students: students,
      parent_credentials: parent_credentials
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
      # Auto-generate parent account
      parent_username = generate_parent_username(@student.name)
      parent_password = parent_username # Same as username for simplicity
      
      parent_user = User.create(
        username: parent_username,
        name: "Orang Tua #{@student.name}",
        password: parent_password,
        password_confirmation: parent_password,
        role: "parent",
        student_id: @student.id
      )

      if parent_user.persisted?
        # Store credentials in flash to display to admin
        flash[:parent_credentials] = {
          student_name: @student.name,
          username: parent_username,
          password: parent_password
        }
        redirect_to students_path, notice: "Student and parent account created successfully!"
      else
        redirect_to students_path, notice: "Student created but failed to create parent account: #{parent_user.errors.full_messages.join(', ')}"
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
    student_ids = params[:student_ids]
    target_class = params[:target_class]
    mark_as_graduated = params[:mark_as_graduated]

    if student_ids.blank?
      render json: { error: "Student IDs harus diisi" }, status: :unprocessable_entity
      return
    end

    if target_class.blank? && !mark_as_graduated
      render json: { error: "Kelas tujuan atau status kelulusan harus dipilih" }, status: :unprocessable_entity
      return
    end

    begin
      updates = {}
      
      # If graduating students, set status to graduated
      if mark_as_graduated
        updates[:status] = "graduated"
      end
      
      # If moving to new class, update class_level
      if target_class.present?
        updates[:class_level] = target_class
      end
      
      updated_count = Student.where(id: student_ids).update_all(updates)
      
      # Generate appropriate message
      if mark_as_graduated && target_class.present?
        message = "Berhasil memindahkan #{updated_count} pelajar ke #{target_class} dan mengubah status menjadi Lulus"
      elsif mark_as_graduated
        message = "Berhasil meluluskan #{updated_count} pelajar"
      else
        message = "Berhasil memindahkan #{updated_count} pelajar ke #{target_class}"
      end
      
      render json: { 
        success: true, 
        message: message,
        updated_count: updated_count
      }
    rescue => e
      render json: { error: "Terjadi kesalahan: #{e.message}" }, status: :internal_server_error
    end
  end

  # Bulk import methods
  def bulk_import
    render inertia: "Student/BulkImport"
  end

  def download_template
    respond_to do |format|
      format.xlsx do
        package = Axlsx::Package.new
        workbook = package.workbook
        
        # Define styles
        header_style = workbook.styles.add_style(
          bg_color: "4472C4",
          fg_color: "FFFFFF",
          b: true,
          alignment: { horizontal: :center, vertical: :center, wrap_text: true }
        )
        
        example_style = workbook.styles.add_style(
          bg_color: "E7E6E6",
          alignment: { horizontal: :left, vertical: :center }
        )
        
        workbook.add_worksheet(name: "Import Pelajar") do |sheet|
          # Header row
          sheet.add_row [
            "Nama Lengkap*",
            "Gender* (Laki-laki/Perempuan)",
            "Tempat Lahir*",
            "Tanggal Lahir* (YYYY-MM-DD)",
            "Nama Ayah*",
            "Nama Ibu*",
            "No HP Ayah",
            "No HP Ibu",
            "Alamat",
            "Kelas*",
            "Status* (active/inactive)",
            "Tanggal Bergabung* (YYYY-MM-DD)",
            "Juz Hafalan Saat Ini* (1-30)",
            "Halaman Hafalan Saat Ini* (1-604)",
            "Surah Hafalan Saat Ini*"
          ], style: header_style
          
          # Example row
          sheet.add_row [
            "Ahmad Rasyid",
            "Laki-laki",
            "Jakarta",
            "2012-01-15",
            "Bapak Ahmad",
            "Ibu Siti",
            "081234567890",
            "082345678901",
            "Jl. Merdeka No. 123",
            "1A",
            "active",
            Date.current.to_s,
            "1",
            "1",
            "Al-Fatihah"
          ], style: example_style
          
          # Set column widths for better readability
          sheet.column_widths 20, 25, 15, 22, 20, 20, 15, 15, 30, 10, 20, 22, 25, 28, 25
        end
        
        send_data package.to_stream.read,
                  filename: "template_import_pelajar_#{Date.current}.xlsx",
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  disposition: 'attachment'
      end
    end
  end

  def preview_import
    require 'csv'
    require 'roo'
    
    if params[:file].blank?
      render json: { error: "File tidak ditemukan" }, status: :unprocessable_entity
      return
    end

    file = params[:file]
    preview_data = []
    errors = []
    
    begin
      # Determine file type and read accordingly
      spreadsheet = if file.original_filename.end_with?('.xlsx')
        Roo::Spreadsheet.open(file.path, extension: :xlsx)
      elsif file.original_filename.end_with?('.xls')
        Roo::Spreadsheet.open(file.path, extension: :xls)
      elsif file.original_filename.end_with?('.csv')
        Roo::CSV.new(file.path)
      else
        render json: { error: "Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv" }, status: :unprocessable_entity
        return
      end

      headers = spreadsheet.row(1)
      
      (2..spreadsheet.last_row).each do |i|
        row = spreadsheet.row(i)
        
        # Skip empty rows
        next if row.all?(&:blank?)
        
        # Map row to hash using headers
        row_hash = Hash[headers.zip(row)]
        
        student_data = {
          line_number: i,
          name: row_hash["Nama Lengkap*"]&.to_s&.strip,
          gender: row_hash["Gender* (Laki-laki/Perempuan)"]&.to_s&.strip&.downcase,
          birth_place: row_hash["Tempat Lahir*"]&.to_s&.strip,
          birth_date: parse_date_from_excel(row_hash["Tanggal Lahir* (YYYY-MM-DD)"]),
          father_name: row_hash["Nama Ayah*"]&.to_s&.strip,
          mother_name: row_hash["Nama Ibu*"]&.to_s&.strip,
          father_phone: row_hash["No HP Ayah"]&.to_s&.strip,
          mother_phone: row_hash["No HP Ibu"]&.to_s&.strip,
          address: row_hash["Alamat"]&.to_s&.strip,
          class_level: row_hash["Kelas*"]&.to_s&.strip,
          status: row_hash["Status* (active/inactive)"]&.to_s&.strip&.downcase,
          date_joined: parse_date_from_excel(row_hash["Tanggal Bergabung* (YYYY-MM-DD)"]),
          current_hifz_in_juz: row_hash["Juz Hafalan Saat Ini* (1-30)"]&.to_s&.strip,
          current_hifz_in_pages: row_hash["Halaman Hafalan Saat Ini* (1-604)"]&.to_s&.strip,
          current_hifz_in_surah: row_hash["Surah Hafalan Saat Ini*"]&.to_s&.strip
        }

        # Validate required fields
        row_errors = []
        row_errors << "Nama lengkap wajib diisi" if student_data[:name].blank?
        row_errors << "Gender wajib diisi (Laki-laki/Perempuan)" if student_data[:gender].blank?
        row_errors << "Gender harus 'laki-laki' atau 'perempuan'" unless ["laki-laki", "perempuan"].include?(student_data[:gender])
        row_errors << "Tempat lahir wajib diisi" if student_data[:birth_place].blank?
        row_errors << "Tanggal lahir wajib diisi" if student_data[:birth_date].blank?
        row_errors << "Nama ayah wajib diisi" if student_data[:father_name].blank?
        row_errors << "Nama ibu wajib diisi" if student_data[:mother_name].blank?
        row_errors << "Kelas wajib diisi" if student_data[:class_level].blank?
        row_errors << "Status wajib diisi (active/inactive)" if student_data[:status].blank?
        row_errors << "Status harus 'active' atau 'inactive'" unless ["active", "inactive"].include?(student_data[:status])
        row_errors << "Tanggal bergabung wajib diisi" if student_data[:date_joined].blank?
        row_errors << "Juz hafalan wajib diisi" if student_data[:current_hifz_in_juz].blank?
        row_errors << "Halaman hafalan wajib diisi" if student_data[:current_hifz_in_pages].blank?
        row_errors << "Surah hafalan wajib diisi" if student_data[:current_hifz_in_surah].blank?

        # Validate date formats
        begin
          Date.parse(student_data[:birth_date]) if student_data[:birth_date].present?
        rescue ArgumentError
          row_errors << "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"
        end

        begin
          Date.parse(student_data[:date_joined]) if student_data[:date_joined].present?
        rescue ArgumentError
          row_errors << "Format tanggal bergabung tidak valid (gunakan YYYY-MM-DD)"
        end

        student_data[:errors] = row_errors
        student_data[:valid] = row_errors.empty?
        
        preview_data << student_data
      end

      render json: {
        success: true,
        data: preview_data,
        total: preview_data.length,
        valid: preview_data.count { |d| d[:valid] },
        invalid: preview_data.count { |d| !d[:valid] }
      }
    rescue => e
      render json: { error: "Gagal memproses file: #{e.message}" }, status: :internal_server_error
    end
  end

  def bulk_create
    if params[:students].blank?
      render json: { error: "Data pelajar tidak ditemukan" }, status: :unprocessable_entity
      return
    end

    created_students = []
    failed_students = []

    params[:students].each do |student_params|
      begin
        student = Student.new(
          name: student_params[:name],
          gender: student_params[:gender],
          birth_place: student_params[:birth_place],
          birth_date: Date.parse(student_params[:birth_date]),
          father_name: student_params[:father_name],
          mother_name: student_params[:mother_name],
          father_phone: student_params[:father_phone],
          mother_phone: student_params[:mother_phone],
          address: student_params[:address],
          class_level: student_params[:class_level],
          status: student_params[:status],
          date_joined: Date.parse(student_params[:date_joined]),
          current_hifz_in_juz: student_params[:current_hifz_in_juz],
          current_hifz_in_pages: student_params[:current_hifz_in_pages],
          current_hifz_in_surah: student_params[:current_hifz_in_surah]
        )

        if student.save
          created_students << {
            line_number: student_params[:line_number],
            name: student.name,
            id: student.id
          }
        else
          failed_students << {
            line_number: student_params[:line_number],
            name: student_params[:name],
            errors: student.errors.full_messages
          }
        end
      rescue => e
        failed_students << {
          line_number: student_params[:line_number],
          name: student_params[:name],
          errors: [e.message]
        }
      end
    end

    render json: {
      success: true,
      created: created_students.length,
      failed: failed_students.length,
      created_students: created_students,
      failed_students: failed_students,
      message: "Berhasil membuat #{created_students.length} pelajar dari #{params[:students].length} data"
    }
  end

  private

  def parse_date_from_excel(value)
    return nil if value.blank?
    
    # If it's already a Date object (from Excel)
    return value.to_s if value.is_a?(Date)
    
    # If it's a Time or DateTime object
    return value.to_date.to_s if value.respond_to?(:to_date)
    
    # If it's a string, return as is
    value.to_s.strip
  end

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

  def generate_parent_username(student_name)
    # Convert to lowercase, remove special characters, replace spaces with nothing
    clean_name = student_name.downcase
                            .gsub(/[^a-z0-9\s]/, '') # Remove special chars
                            .gsub(/\s+/, '')          # Remove all spaces
    
    base_username = "orangtua_#{clean_name}"
    
    # Check if username already exists, add number suffix if needed
    username = base_username
    counter = 1
    while User.exists?(username: username)
      username = "#{base_username}#{counter}"
      counter += 1
    end
    
    username
  end

end
