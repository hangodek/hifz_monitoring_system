require "test_helper"

class Teachers::BulkActivitySaverTest < ActiveSupport::TestCase
  def student
    @student ||= Student.create!(
      name: "Siswa Bulk",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Bandung",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Ayah Bulk",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )
  end

  def save_rows(rows, juz: "1")
    Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: juz,
      activities_params: rows
    ).save!
  end

  # ─── Guard Clauses ────────────────────────────────────────────────────────

  test "returns failure when student not found" do
    result = Teachers::BulkActivitySaver.new(
      student_id: 0,
      juz: "1",
      activities_params: []
    ).save!

    assert_not result[:success]
    assert_match(/tidak ditemukan/, result[:message])
  end

  test "returns failure when juz is blank" do
    result = Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: "",
      activities_params: []
    ).save!

    assert_not result[:success]
    assert_match(/Juz/, result[:message])
  end

  test "returns failure when no rows sent" do
    result = save_rows([])
    assert_not result[:success]
  end

  # ─── Successful Save ──────────────────────────────────────────────────────

  test "creates new activity from valid row" do
    rows = [
      {
        juz: "30", surah: "An-Nas", ayat: "1", completion_status: "belum_tuntas",
        kelancaran: "30", fashohah: "15", tajwid: "15",
        original_juz: nil, original_surah: nil, original_ayat: nil,
        original_completion_status: nil, original_kelancaran: nil,
        original_fashohah: nil, original_tajwid: nil, original_notes: nil
      }
    ]

    result = Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: "30",
      activities_params: rows
    ).save!

    assert result[:success], result[:message]
    assert_equal 1, result[:saved_rows].count
    assert_equal "created", result[:saved_rows].first[:action]
  end

  test "creates progression record for tuntas row without ayat" do
    rows = [
      {
        juz: "30", surah: "An-Nas", ayat: nil, completion_status: "tuntas",
        kelancaran: nil, fashohah: nil, tajwid: nil,
        original_juz: nil, original_surah: nil, original_ayat: nil,
        original_completion_status: nil, original_kelancaran: nil,
        original_fashohah: nil, original_tajwid: nil, original_notes: nil
      }
    ]

    result = Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: "30",
      activities_params: rows
    ).save!

    assert result[:success], result[:message]
    assert_match(/progression/, result[:saved_rows].first[:action])
  end

  # ─── Validation Errors ────────────────────────────────────────────────────

  test "returns error for invalid juz value" do
    rows = [
      {
        juz: "0", surah: "An-Nas", ayat: "1", completion_status: "belum_tuntas",
        kelancaran: "30", fashohah: "15", tajwid: "15",
        original_juz: nil, original_surah: nil, original_ayat: nil,
        original_completion_status: nil, original_kelancaran: nil,
        original_fashohah: nil, original_tajwid: nil, original_notes: nil
      }
    ]

    result = Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: "0",
      activities_params: rows
    ).save!

    assert_not result[:success]
  end

  test "skips row when nothing has changed (dirty check)" do
    # Both current and original values are the same => no change
    rows = [
      {
        juz: "30", surah: "An-Nas", ayat: "1", completion_status: "belum_tuntas",
        kelancaran: "30", fashohah: "15", tajwid: "15", notes: nil,
        original_juz: "30", original_surah: "An-Nas", original_ayat: "1",
        original_completion_status: "belum_tuntas", original_kelancaran: "30",
        original_fashohah: "15", original_tajwid: "15", original_notes: nil
      }
    ]

    result = Teachers::BulkActivitySaver.new(
      student_id: student.id,
      juz: "30",
      activities_params: rows
    ).save!

    # All rows skipped => no saved_rows => returns unprocessable
    assert_not result[:success]
  end
end
