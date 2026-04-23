require "test_helper"

class ActivityTest < ActiveSupport::TestCase
  def student
    @student ||= Student.create!(
      name: "Test Student",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Jakarta",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Test Ayah",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )
  end

  def valid_activity_attrs(overrides = {})
    {
      student: student,
      activity_type: :memorization,
      surah: "Al-Fatihah",
      ayat_from: 1,
      ayat_to: 7,
      juz: 1,
      completion_status: :belum_tuntas
    }.merge(overrides)
  end

  # ─── Validations ──────────────────────────────────────────────────────────

  test "valid activity saves successfully" do
    activity = Activity.new(valid_activity_attrs)
    assert activity.valid?, activity.errors.full_messages.to_sentence
  end

  test "activity is invalid without surah" do
    activity = Activity.new(valid_activity_attrs(surah: nil))
    assert_not activity.valid?
    assert_includes activity.errors[:surah], "can't be blank"
  end

  test "activity is invalid without juz" do
    activity = Activity.new(valid_activity_attrs(juz: nil))
    assert_not activity.valid?
    assert_includes activity.errors[:juz], "can't be blank"
  end

  test "activity is invalid without ayat_from" do
    activity = Activity.new(valid_activity_attrs(ayat_from: nil))
    assert_not activity.valid?
  end

  # ─── Score Validations ────────────────────────────────────────────────────

  test "kelancaran must be in range 1-50" do
    activity = Activity.new(valid_activity_attrs(kelancaran: 0))
    assert_not activity.valid?
    assert activity.errors[:kelancaran].any?

    activity.kelancaran = 51
    assert_not activity.valid?

    activity.kelancaran = 25
    assert activity.valid?
  end

  test "tajwid must be in range 1-25" do
    activity = Activity.new(valid_activity_attrs(tajwid: 0))
    assert_not activity.valid?

    activity.tajwid = 26
    assert_not activity.valid?

    activity.tajwid = 13
    assert activity.valid?
  end

  test "fashohah must be in range 1-25" do
    activity = Activity.new(valid_activity_attrs(fashohah: 0))
    assert_not activity.valid?

    activity.fashohah = 26
    assert_not activity.valid?

    activity.fashohah = 13
    assert activity.valid?
  end

  test "nil scores are allowed (defaults applied on save)" do
    activity = Activity.new(valid_activity_attrs(kelancaran: nil, tajwid: nil, fashohah: nil))
    assert activity.valid?
  end

  # ─── Default Scores ───────────────────────────────────────────────────────

  test "default scores are set on save if nil" do
    activity = Activity.create!(valid_activity_attrs(kelancaran: nil, tajwid: nil, fashohah: nil))
    assert_equal 25, activity.kelancaran
    assert_equal 13, activity.tajwid
    assert_equal 13, activity.fashohah
  end

  test "provided scores are not overridden by defaults" do
    activity = Activity.create!(valid_activity_attrs(kelancaran: 40, tajwid: 20, fashohah: 18))
    assert_equal 40, activity.kelancaran
    assert_equal 20, activity.tajwid
    assert_equal 18, activity.fashohah
  end

  # ─── Description ──────────────────────────────────────────────────────────

  test "description for memorization with range" do
    activity = Activity.new(valid_activity_attrs(activity_type: :memorization, surah: "Al-Baqarah", ayat_from: 1, ayat_to: 5))
    assert_equal "Menghafal Surah Al-Baqarah ayat 1-5", activity.description
  end

  test "description for memorization with single ayat" do
    activity = Activity.new(valid_activity_attrs(activity_type: :memorization, surah: "Al-Fatihah", ayat_from: 1, ayat_to: 1))
    assert_equal "Menghafal Surah Al-Fatihah ayat 1", activity.description
  end

  test "description for revision" do
    activity = Activity.new(valid_activity_attrs(activity_type: :revision, surah: "Al-Fatihah", ayat_from: 1, ayat_to: 7))
    assert_equal "Murajaah Surah Al-Fatihah ayat 1-7", activity.description
  end

  # ─── Color ────────────────────────────────────────────────────────────────

  test "color_for_type returns blue for memorization" do
    assert_equal "#3b82f6", Activity.color_for_type("memorization")
  end

  test "color_for_type returns green for revision" do
    assert_equal "#10b981", Activity.color_for_type("revision")
  end

  # ─── Surah Progression Sync ───────────────────────────────────────────────

  test "creating memorization activity syncs surah progression" do
    Activity.create!(valid_activity_attrs(completion_status: :tuntas))

    progression = StudentSurahProgression.find_by(
      student_id: student.id,
      juz: 1,
      surah: "Al-Fatihah"
    )

    assert_not_nil progression
    assert progression.tuntas?
  end

  test "destroying memorization activity removes surah progression" do
    activity = Activity.create!(valid_activity_attrs(completion_status: :tuntas))

    assert StudentSurahProgression.exists?(student_id: student.id, juz: 1, surah: "Al-Fatihah")

    activity.destroy!

    assert_not StudentSurahProgression.exists?(student_id: student.id, juz: 1, surah: "Al-Fatihah")
  end

  test "revision activity does not sync surah progression" do
    Activity.create!(valid_activity_attrs(activity_type: :revision))

    assert_not StudentSurahProgression.exists?(student_id: student.id, juz: 1, surah: "Al-Fatihah")
  end
end
