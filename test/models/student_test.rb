require "test_helper"

class StudentTest < ActiveSupport::TestCase
  def valid_student_attrs(overrides = {})
    {
      name: "Ahmad Fauzi",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Bandung",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Budi Santoso",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    }.merge(overrides)
  end

  # ─── Validations ──────────────────────────────────────────────────────────

  test "valid student saves successfully" do
    student = Student.new(valid_student_attrs)
    assert student.valid?, student.errors.full_messages.to_sentence
  end

  test "student name is required at database level" do
    # Student model doesn't have model-level name validation,
    # but the DB enforces not null via the schema.
    assert_raises(ActiveRecord::NotNullViolation, ActiveRecord::StatementInvalid) do
      Student.create!(valid_student_attrs(name: nil))
    end
  end

  test "father_name is required at database level" do
    # father_name has a NOT NULL constraint in DB — model allows blank but DB will raise
    assert_raises(ActiveRecord::NotNullViolation, ActiveRecord::StatementInvalid) do
      Student.create!(valid_student_attrs(father_name: nil))
    end
  end

  # ─── Parent Account Creation ───────────────────────────────────────────────

  test "create_parent_account! creates a parent user linked to student" do
    student = Student.create!(valid_student_attrs)
    parent = student.create_parent_account!

    assert_equal "parent", parent.role
    assert_equal student.id, parent.student_id
    assert parent.username.present?
    assert parent.authenticate(parent.username), "Password should match username"
  end

  test "parent username uses first name of student and first name of father" do
    student = Student.create!(valid_student_attrs(name: "Ahmad Fauzi", father_name: "Budi Santoso"))
    parent = student.create_parent_account!

    assert_match(/\Aahmad_budi/, parent.username)
  end

  test "parent username is unique when duplicates exist" do
    student1 = Student.create!(valid_student_attrs(name: "Ahmad Fauzi", father_name: "Budi Santoso"))
    student1.create_parent_account!

    student2 = Student.create!(valid_student_attrs(name: "Ahmad Rizki", father_name: "Budi Rahmat"))
    parent2 = student2.create_parent_account!

    # base would also be ahmad_budi — should get a suffix
    assert_match(/\Aahmad_budi\d+/, parent2.username)
  end

  # ─── Juz Completion (recalculate_total_juz_memorized!) ────────────────────

  test "total_juz_memorized is 0 by default" do
    student = Student.create!(valid_student_attrs)
    assert_equal 0, student.total_juz_memorized
  end

  test "recalculate_total_juz_memorized! counts completed juz" do
    student = Student.create!(valid_student_attrs)

    # Juz 30 surahs — add all as tuntas
    juz30_surahs = SurahJuzMapping::JUZ_TO_SURAHS[30]
    juz30_surahs.each do |surah|
      StudentSurahProgression.create!(
        student: student,
        juz: 30,
        surah: surah,
        completion_status: :tuntas,
        last_activity_at: Time.current
      )
    end

    student.recalculate_total_juz_memorized!
    assert_equal 1, student.reload.total_juz_memorized
  end

  test "recalculate_total_juz_memorized! does not count partial juz" do
    student = Student.create!(valid_student_attrs)

    # Only add one surah of juz 30 as tuntas
    StudentSurahProgression.create!(
      student: student,
      juz: 30,
      surah: SurahJuzMapping::JUZ_TO_SURAHS[30].first,
      completion_status: :tuntas,
      last_activity_at: Time.current
    )

    student.recalculate_total_juz_memorized!
    assert_equal 0, student.reload.total_juz_memorized
  end
end
