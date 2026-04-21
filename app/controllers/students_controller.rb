class StudentsController < ApplicationController
  include ActionView::Helpers::DateHelper
  include AvatarHelper
  include RoleAuthorization
  include SurahJuzMapping

  skip_before_action :authorize_role
  before_action :require_admin!
  
  def index
    # Pagination parameters
    page = params[:page]&.to_i || 1
    per_page = 20
    
    # Base query
    students_query = students_query_with_memorization_summary.order(name: :asc)
    
    # Apply search filter if present
    if params[:search].present?
      search_term = params[:search].strip.downcase
      students_query = students_query.where(
        "LOWER(name) LIKE ? OR LOWER(nisn) LIKE ? OR LOWER(student_number) LIKE ?",
        "%#{search_term}%",
        "%#{search_term}%",
        "%#{search_term}%"
      )
    end
    
    # Apply class filter
    if params[:class_filter].present? && params[:class_filter] != "all"
      students_query = students_query.where(class_level: params[:class_filter])
    end
    
    # Apply status filter
    if params[:status_filter].present? && params[:status_filter] != "all"
      students_query = students_query.where(status: params[:status_filter])
    end
    
    # Apply juz filter
    if params[:juz_filter].present? && params[:juz_filter] != "all"
      case params[:juz_filter]
      when "Juz 1-5"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 1, 5)
      when "Juz 6-10"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 6, 10)
      when "Juz 11-15"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 11, 15)
      when "Juz 16-20"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 16, 20)
      when "Juz 21-25"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 21, 25)
      when "Juz 26-30"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 26, 30)
      end
    end
    
    # Total count for pagination (after filters applied)
    total_count = students_query.count
    
    # Calculate statistics from all students (not just paginated)
    all_students = students_query.to_a
    total_students = all_students.count
    active_students = all_students.count { |s| s.status == "active" }
    inactive_students = all_students.count { |s| s.status == "inactive" }
    graduated_students = all_students.count { |s| s.status == "graduated" }
    
    # Class distribution
    class_distribution = all_students.group_by(&:class_level).transform_values(&:count)
    
    # Paginated students
    students = students_query
                .limit(per_page)
                .offset((page - 1) * per_page)
                .map do |student|
                  serialize_student_for_index(student)
                end

    # Get parent credentials from flash if available
    parent_credentials = flash[:parent_credentials]

    render inertia: "Student/Index", props: {
      students: students,
      parent_credentials: parent_credentials,
      statistics: {
        total: total_students,
        active: active_students,
        inactive: inactive_students,
        graduated: graduated_students,
        class_distribution: class_distribution
      },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil,
        has_more: page < (total_count.to_f / per_page).ceil
      }
    }
  end

  def load_more
    # Pagination parameters
    page = params[:page]&.to_i || 1
    per_page = 20
    
    # Base query
    students_query = students_query_with_memorization_summary.order(name: :asc)
    
    # Apply search filter if present
    if params[:search].present?
      search_term = params[:search].strip.downcase
      students_query = students_query.where(
        "LOWER(name) LIKE ? OR LOWER(nisn) LIKE ? OR LOWER(student_number) LIKE ?",
        "%#{search_term}%",
        "%#{search_term}%",
        "%#{search_term}%"
      )
    end
    
    # Apply class filter
    if params[:class_filter].present? && params[:class_filter] != "all"
      students_query = students_query.where(class_level: params[:class_filter])
    end
    
    # Apply status filter
    if params[:status_filter].present? && params[:status_filter] != "all"
      students_query = students_query.where(status: params[:status_filter])
    end
    
    # Apply juz filter
    if params[:juz_filter].present? && params[:juz_filter] != "all"
      case params[:juz_filter]
      when "Juz 1-5"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 1, 5)
      when "Juz 6-10"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 6, 10)
      when "Juz 11-15"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 11, 15)
      when "Juz 16-20"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 16, 20)
      when "Juz 21-25"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 21, 25)
      when "Juz 26-30"
        students_query = students_query.where("CAST(current_hifz_in_juz AS INTEGER) BETWEEN ? AND ?", 26, 30)
      end
    end
    
    total_count = students_query.count
    
    students = students_query
                .limit(per_page)
                .offset((page - 1) * per_page)
                .map do |student|
                  serialize_student_for_index(student)
                end

    render json: {
      students: students,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil,
        has_more: page < (total_count.to_f / per_page).ceil
      }
    }
  end

  def students_query_with_memorization_summary
    Student.includes(:student_surah_progressions)
  end

  def serialize_student_for_index(student)
    student.as_json.merge(
      avatar: avatar_url(student, size: :thumb),
      total_juz_memorized: student.total_juz_memorized || 0,
      completed_surah_count: student.student_surah_progressions.count { |progression| progression.completion_status == "tuntas" },
      date_joined: student.created_at&.iso8601
    )
  end

  def show
    student = Student.find(params[:id])
    activities = student.activities.order(created_at: :desc)

    # Get recent activities (last 5 for display)
    recent_activities = activities.limit(5).map do |activity|
      {
        id: activity.id,
        activity: format_activity_description(activity),
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
    daily_submission_counts = activities
                  .group("DATE(created_at)")
                  .count
                  .transform_keys(&:to_s)

    # Calculate monthly progress (cumulative juz progress)
    monthly_progress = calculate_monthly_progress(student, activities)

    # Calculate activity type distribution
    type_distribution = activities.group(:activity_type).count.map do |type, count|
      {
        name: type == "memorization" ? "Hafalan" : "Murajaah",
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
        avatar: avatar_url(student, size: :medium),
        total_juz_memorized: total_juz_completed_for_student(student)
      ),
      recent_activities: recent_activities,
      total_activities_count: total_activities_count,
      total_activities: activities.count,
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
                                    activity: format_activity_description(activity),
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
    @student = Student.new(student_params)

    if @student.save
      # Invalidate cache untuk teacher mode
      Rails.cache.delete("teacher_active_students")
      Rails.cache.delete("student_activities_#{@student.id}")
      
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
        
        workbook.add_worksheet(name: "Import Siswa") do |sheet|
          # Header row - Urutan: NISN, No Induk, Nama, Gender, dst
          base_headers = [
            "NISN",
            "No Induk*",
            "Nama Lengkap*",
            "Gender* (Laki-laki/Perempuan)",
            "Tempat Lahir*",
            "Tanggal Lahir* (YYYY-MM-DD)",
            "Nama Ayah*",
            "Nama Ibu*",
            "No HP Orang Tua",
            "Alamat",
            "Kelas* (7A-12D)",
            "Status* (Aktif/Tidak Aktif)",
            "Juz Hafalan Saat Ini* (1-30)",
            "Surah Hafalan Saat Ini*"
          ]

          juz_30_headers = juz_30_surahs.map { |surah| juz_30_column_name(surah) }
          sheet.add_row(base_headers + juz_30_headers, style: header_style)
          
          # Example rows (5 siswa) with different Juz 30 patterns.
          base_examples = [
            ["320120010001", "S-2026-001", "Ahmad Fauzan", "Laki-laki", "Bandung", "2012-02-10", "Budi Fauzan", "Siti Aminah", "081210000001", "Jl. Cendana 1", "7A", "Aktif", "30", "An-Naba"],
            ["320120010002", "S-2026-002", "Naila Putri", "Perempuan", "Bekasi", "2011-09-21", "Rizal Putra", "Nur Aisyah", "081210000002", "Jl. Melati 5", "7B", "Aktif", "30", "An-Nazi'at"],
            ["320120010003", "S-2026-003", "Rafi Maulana", "Laki-laki", "Depok", "2012-05-14", "Deni Maulana", "Fitri Handayani", "081210000003", "Jl. Kenanga 3", "8A", "Aktif", "30", "Abasa"],
            ["320120010004", "S-2026-004", "Alya Rahma", "Perempuan", "Bogor", "2011-12-01", "Irfan Rahma", "Dewi Lestari", "081210000004", "Jl. Anggrek 7", "8B", "Aktif", "30", "At-Takwir"],
            ["320120010005", "S-2026-005", "Farhan Akbar", "Laki-laki", "Jakarta", "2012-07-30", "Hendra Akbar", "Lina Marlina", "081210000005", "Jl. Mawar 9", "9A", "Aktif", "30", "Al-Infitar"]
          ]

          status_patterns = [
            ->(index) { index < 37 ? "tuntas" : "belum_tuntas" },
            ->(index) { index < 25 ? "tuntas" : "belum_tuntas" },
            ->(index) { index < 15 ? "tuntas" : "belum_tuntas" },
            ->(index) { index.even? ? "tuntas" : "belum_tuntas" },
            ->(_index) { "belum_tuntas" }
          ]

          base_examples.each_with_index do |base_example, row_index|
            juz_30_example = juz_30_surahs.map.with_index do |_surah, index|
              status_patterns[row_index].call(index)
            end

            sheet.add_row(base_example + juz_30_example, style: example_style)
          end
          
          # Set column widths for better readability
          base_widths = [15, 12, 20, 22, 15, 18, 20, 20, 17, 30, 10, 16, 25, 25]
          juz_30_widths = Array.new(juz_30_surahs.size, 22)
          sheet.column_widths(*(base_widths + juz_30_widths))
        end
        
        send_data package.to_stream.read,
                  filename: "template_import_siswa_#{Date.current}.xlsx",
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
          nisn: row_hash["NISN"]&.to_s&.strip,
          student_number: row_hash["No Induk*"]&.to_s&.strip,
          name: row_hash["Nama Lengkap*"]&.to_s&.strip,
          gender: normalize_import_gender(row_hash["Gender* (Laki-laki/Perempuan)"] || row_hash["Gender* (male/female atau laki-laki/perempuan)"]),
          birth_place: row_hash["Tempat Lahir*"]&.to_s&.strip,
          birth_date: parse_date_from_excel(row_hash["Tanggal Lahir* (YYYY-MM-DD)"]),
          father_name: row_hash["Nama Ayah*"]&.to_s&.strip,
          mother_name: row_hash["Nama Ibu*"]&.to_s&.strip,
          parent_phone: row_hash["No HP Orang Tua"]&.to_s&.strip,
          address: row_hash["Alamat"]&.to_s&.strip,
          class_level: (row_hash["Kelas* (7A-12D)"] || row_hash["Kelas*"])&.to_s&.strip,
          status: normalize_import_status(row_hash["Status* (Aktif/Tidak Aktif)"] || row_hash["Status* (active/inactive)"]),
          current_hifz_in_juz: row_hash["Juz Hafalan Saat Ini* (1-30)"]&.to_s&.strip,
          current_hifz_in_pages: default_import_hifz_page,
          current_hifz_in_surah: row_hash["Surah Hafalan Saat Ini*"]&.to_s&.strip,
          juz_30_statuses: {}
        }

        # Validate required fields
        row_errors = []
        row_errors << "No Induk wajib diisi" if student_data[:student_number].blank?
        row_errors << "Nama lengkap wajib diisi" if student_data[:name].blank?
        row_errors << "Gender wajib diisi (Laki-laki/Perempuan)" if student_data[:gender].blank?
        row_errors << "Gender harus Laki-laki atau Perempuan" unless ["male", "female"].include?(student_data[:gender])
        row_errors << "Tempat lahir wajib diisi" if student_data[:birth_place].blank?
        row_errors << "Tanggal lahir wajib diisi" if student_data[:birth_date].blank?
        row_errors << "Nama ayah wajib diisi" if student_data[:father_name].blank?
        row_errors << "Nama ibu wajib diisi" if student_data[:mother_name].blank?
        row_errors << "Kelas wajib diisi" if student_data[:class_level].blank?
        
        # Validate class level format (7A-12D only)
        if student_data[:class_level].present?
          unless valid_class_level?(student_data[:class_level])
            row_errors << "Kelas harus antara 7A-12D (contoh: 7A, 8B, 10C, 12D)"
          end
        end
        
        row_errors << "Status wajib diisi (Aktif/Tidak Aktif)" if student_data[:status].blank?
        row_errors << "Status harus Aktif atau Tidak Aktif" unless ["active", "inactive"].include?(student_data[:status])
        row_errors << "Juz hafalan wajib diisi" if student_data[:current_hifz_in_juz].blank?
        row_errors << "Surah hafalan wajib diisi" if student_data[:current_hifz_in_surah].blank?

        if student_data[:current_hifz_in_juz].present?
          juz_value = student_data[:current_hifz_in_juz].to_i
          row_errors << "Juz hafalan harus di antara 1 sampai 30" unless juz_value.between?(1, 30)
        end

        # Validate and collect Juz 30 per-surah statuses.
        juz_30_surahs.each do |surah|
          header = juz_30_column_name(surah)
          raw_status = row_hash[header]
          normalized_status = normalize_import_completion_status(raw_status)

          if raw_status.blank?
            row_errors << "Status #{surah} (Juz 30) wajib diisi: tuntas atau belum_tuntas"
            next
          end

          if normalized_status.blank?
            row_errors << "Status #{surah} (Juz 30) harus 'tuntas' atau 'belum_tuntas'"
            next
          end

          student_data[:juz_30_statuses][surah] = normalized_status
        end

        # Validate date formats
        begin
          Date.parse(student_data[:birth_date]) if student_data[:birth_date].present?
        rescue ArgumentError
          row_errors << "Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)"
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
      render json: { error: "Data siswa tidak ditemukan" }, status: :unprocessable_entity
      return
    end

    created_students = []
    failed_students = []

    params[:students].each do |student_params|
      student_params = student_params.respond_to?(:to_unsafe_h) ? student_params.to_unsafe_h : student_params.to_h
      begin
        student = Student.new(
          nisn: student_params[:nisn],
          student_number: student_params[:student_number],
          name: student_params[:name],
          gender: normalize_import_gender(student_params[:gender]),
          birth_place: student_params[:birth_place],
          birth_date: Date.parse(student_params[:birth_date]),
          father_name: student_params[:father_name],
          mother_name: student_params[:mother_name],
          parent_phone: student_params[:parent_phone],
          address: student_params[:address],
          class_level: student_params[:class_level]&.upcase,
          status: normalize_import_status(student_params[:status]),
          current_hifz_in_juz: student_params[:current_hifz_in_juz],
          current_hifz_in_pages: default_import_hifz_page,
          current_hifz_in_surah: student_params[:current_hifz_in_surah]
        )

        if student.save
          import_juz_30_progressions!(student, student_params[:juz_30_statuses])
          student.recalculate_total_juz_memorized!

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
      message: "Berhasil membuat #{created_students.length} siswa dari #{params[:students].length} data"
    }
  end

  private

  def valid_class_level?(class_level)
    # Match format: grade (7-12) + section (A-D)
    # Example: 7A, 8B, 10C, 12D
    return false if class_level.blank?
    
    match = class_level.match(/^(\d+)([A-D])$/i)
    return false unless match
    
    grade = match[1].to_i
    section = match[2].upcase
    
    # Grade must be between 7-12, section must be A-D
    grade >= 7 && grade <= 12 && ['A', 'B', 'C', 'D'].include?(section)
  end

  def parse_date_from_excel(value)
    return nil if value.blank?
    
    # If it's already a Date object (from Excel)
    return value.to_s if value.is_a?(Date)
    
    # If it's a Time or DateTime object
    return value.to_date.to_s if value.respond_to?(:to_date)
    
    # If it's a string, return as is
    value.to_s.strip
  end

  def juz_30_surahs
    Array(JUZ_TO_SURAHS[30])
  end

  def juz_30_column_name(surah)
    "Juz 30 - #{surah} (tuntas/belum_tuntas)"
  end

  def normalize_import_gender(value)
    normalized = value.to_s.strip.downcase
    case normalized
    when "male", "laki-laki", "lakilaki", "l"
      "male"
    when "female", "perempuan", "p"
      "female"
    else
      nil
    end
  end

  def normalize_import_status(value)
    normalized = value.to_s.strip.downcase
    case normalized
    when "active", "aktif"
      "active"
    when "inactive", "tidak aktif", "nonaktif", "non-active"
      "inactive"
    else
      nil
    end
  end

  def default_import_hifz_page
    "1"
  end

  def normalize_import_completion_status(value)
    normalized = value.to_s.strip.downcase
    case normalized
    when "tuntas", "selesai"
      "tuntas"
    when "belum_tuntas", "belum tuntas", "belum"
      "belum_tuntas"
    else
      nil
    end
  end

  def import_juz_30_progressions!(student, raw_statuses)
    return if student.blank?

    statuses = if raw_statuses.respond_to?(:to_unsafe_h)
      raw_statuses.to_unsafe_h
    else
      (raw_statuses || {}).to_h
    end
    now = Time.current
    juz_30_surahs.each do |surah|
      raw_status = statuses[surah] || statuses[surah.to_sym] || statuses[surah.to_s]
      normalized_status = normalize_import_completion_status(raw_status)
      next if normalized_status.blank?

      progression = StudentSurahProgression.find_or_initialize_by(
        student_id: student.id,
        juz: 30,
        surah: surah
      )

      progression.completion_status = normalized_status
      progression.last_activity_at = now
      progression.save!
    end
  end

  def student_params
    params.expect(student: [ :nisn, :student_number, :name, :current_hifz_in_juz, :current_hifz_in_pages, :current_hifz_in_surah, :avatar, :class_level, :phone, :email, :status, :gender, :birth_place, :birth_date, :address, :father_name, :mother_name, :parent_phone ])
  end

  def calculate_activity_score(activity)
    k = activity.kelancaran || 0
    f = activity.fashohah || 0
    t = activity.tajwid || 0
    k + f + t
  end

  def format_activity_description(activity)
    ayat_display = if activity.ayat_from.present? && activity.ayat_to.present? && activity.ayat_from == activity.ayat_to
      activity.ayat_from
    else
      "#{activity.ayat_from}-#{activity.ayat_to}"
    end

    case activity.activity_type
    when "memorization"
      "Menghafal Surah #{activity.surah} ayat #{ayat_display}"
    when "revision"
      "Murajaah Surah #{activity.surah} ayat #{ayat_display}"
    else
      "#{activity.activity_type.humanize} Surah #{activity.surah} ayat #{ayat_display}"
    end
  end

  def calculate_monthly_progress(student, activities)
    # Always show 3 months back and 3 months forward
    current_month = Date.current.beginning_of_month
    start_date = current_month - 3.months
    end_date = current_month + 3.months
    
    monthly_data = []
    month_iterator = start_date

    # Calculate cumulative total juz memorized (non-linear memorization friendly).
    while month_iterator <= end_date
      month_name = month_iterator.strftime("%b")
      total_juz_hafal = total_juz_completed_for_student_up_to(student, month_iterator.end_of_month)

      is_projected = month_iterator > current_month

      monthly_data << {
        month: month_name,
        completed: total_juz_hafal,
        is_projected: is_projected
      }

      month_iterator = month_iterator.next_month
    end

    monthly_data
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
