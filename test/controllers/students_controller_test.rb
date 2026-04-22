require "test_helper"

class StudentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = User.create!(
      username: "admin_test",
      name: "Admin Test",
      role: "admin",
      password: "password123",
      password_confirmation: "password123"
    )

    sign_in_as(@admin)
  end

  test "index responds successfully for admin" do
    create_student!(name: "Ahmad", class_level: "7A", status: "active", current_hifz_in_juz: "2")

    get students_path

    assert_response :success
  end

  test "load_more returns filtered students" do
    included = create_student!(name: "Included", class_level: "7A", status: "active", current_hifz_in_juz: "3")
    create_student!(name: "OtherClass", class_level: "8A", status: "active", current_hifz_in_juz: "3")
    create_student!(name: "OtherStatus", class_level: "7A", status: "inactive", current_hifz_in_juz: "3")
    create_student!(name: "OtherJuz", class_level: "7A", status: "active", current_hifz_in_juz: "9")

    get load_more_students_path, params: {
      class_filter: "7A",
      status_filter: "active",
      juz_filter: "Juz 1-5"
    }, as: :json

    assert_response :success

    body = JSON.parse(response.body)
    returned_ids = body.fetch("students").map { |student| student.fetch("id") }

    assert_includes returned_ids, included.id
    refute_includes returned_ids, Student.find_by(name: "OtherClass")&.id
    refute_includes returned_ids, Student.find_by(name: "OtherStatus")&.id
    refute_includes returned_ids, Student.find_by(name: "OtherJuz")&.id
  end

  test "export_report returns xlsx file" do
    create_student!(name: "Exporter", class_level: "7A", status: "active", current_hifz_in_juz: "5")

    get export_report_students_path(format: :xlsx)

    assert_response :success
    assert_includes response.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert_includes response.headers["Content-Disposition"], "laporan_hafalan_siswa_"
  end

  private

  def sign_in_as(user)
    post session_path, params: { username: user.username, password: "password123" }
    follow_redirect! if response.redirect?
  end

  def create_student!(name:, class_level:, status:, current_hifz_in_juz:)
    Student.create!(
      name: name,
      current_hifz_in_juz: current_hifz_in_juz,
      current_hifz_in_pages: "1",
      class_level: class_level,
      status: status,
      gender: "male",
      birth_place: "Bandung",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Ayah",
      mother_name: "Ibu",
      current_hifz_in_surah: "Al-Fatihah"
    )
  end
end
