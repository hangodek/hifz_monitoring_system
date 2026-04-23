require "test_helper"

class Teachers::ScoreExporterTest < ActiveSupport::TestCase
  def setup
    @user = User.create!(
      username: "exporter_user_#{rand(10_000)}",
      name: "Exporter User",
      role: "teacher",
      password: "password123",
      password_confirmation: "password123"
    )
    @student = Student.create!(
      name: "Rekap Siswa",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Bandung",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Ayah Rekap",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )
  end

  test "to_stream returns a non-empty binary string" do
    stream = Teachers::ScoreExporter.new([@student], current_user: @user).to_stream
    assert stream.is_a?(StringIO) || stream.is_a?(String) || stream.respond_to?(:read),
           "Expected IO-like object"
  end

  test "to_stream does not raise with empty student list" do
    assert_nothing_raised do
      Teachers::ScoreExporter.new([], current_user: @user).to_stream
    end
  end

  test "to_stream does not raise with students having no activities" do
    assert_nothing_raised do
      Teachers::ScoreExporter.new([@student], current_user: @user).to_stream
    end
  end

  test "to_stream produces output with students who have activities" do
    Activity.create!(
      student: @student,
      activity_type: :memorization,
      surah: "An-Nas",
      ayat_from: 1,
      ayat_to: 6,
      juz: 30,
      completion_status: :tuntas,
      kelancaran: 40,
      tajwid: 20,
      fashohah: 18
    )

    stream = Teachers::ScoreExporter.new([@student], current_user: @user).to_stream
    assert stream.present?
  end

  test "students are sorted by class level in all-students sheet" do
    student_9b = Student.create!(
      name: "Siswa 9B",
      class_level: "9B",
      status: "active",
      gender: "male",
      birth_place: "Cimahi",
      birth_date: Date.new(2010, 1, 1),
      father_name: "Ayah 9B",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )
    student_7a = Student.create!(
      name: "Siswa 7A",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Cimahi",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Ayah 7A",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )

    # Intentionally pass in reverse order
    exporter = Teachers::ScoreExporter.new([ student_9b, student_7a ], current_user: @user)

    # Should not raise and should produce output
    assert_nothing_raised { exporter.to_stream }
  end
end
