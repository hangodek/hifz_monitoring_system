require "test_helper"

class Students::CreatorTest < ActiveSupport::TestCase
  def valid_student_params
    ActionController::Parameters.new(
      name: "Naufal Hakim",
      class_level: "8A",
      status: "active",
      gender: "male",
      birth_place: "Surabaya",
      birth_date: Date.new(2011, 5, 15),
      father_name: "Hakim Santoso",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    ).permit!
  end

  # ─── Success Path ─────────────────────────────────────────────────────────

  test "creates student and parent account on success" do
    result = Students::Creator.new(student_params: valid_student_params).create!

    assert result[:success]
    assert_not_nil result[:student].id
    assert_not_nil result[:parent_user].id
    assert_equal "parent", result[:parent_user].role
    assert_equal result[:student].id, result[:parent_user].student_id
  end

  test "returns parent credentials on success" do
    result = Students::Creator.new(student_params: valid_student_params).create!

    creds = result[:parent_credentials]
    assert_equal "Naufal Hakim", creds[:student_name]
    assert creds[:username].present?
    assert creds[:password].present?
    assert_equal creds[:username], creds[:password], "Default password should match username"
  end

  test "parent username follows name_fathername format" do
    result = Students::Creator.new(student_params: valid_student_params).create!
    # name: "Naufal Hakim", father_name: "Hakim Santoso" => naufal_hakim
    assert_match(/\Anaufal_hakim/, result[:parent_credentials][:username])
  end

  # ─── Failure Path ─────────────────────────────────────────────────────────

  test "returns failure or raises when required DB fields are missing" do
    # Student model has no model-level validations - failures are DB constraint violations
    bad_params = ActionController::Parameters.new(
      # omit class_level which is NOT NULL in DB
      name: "Valid Name",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah",
      father_name: "Ayah",
      status: "active",
      gender: "male",
      birth_place: "Kota",
      birth_date: Date.new(2012, 1, 1)
    ).permit!

    # May raise or return failure - either is acceptable
    assert_raises(ActiveRecord::NotNullViolation, ActiveRecord::StatementInvalid) do
      Students::Creator.new(student_params: bad_params).create!
    end
  end

  test "does not create parent account when student DB constraint fails" do
    bad_params = ActionController::Parameters.new(
      name: "Valid Name",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah",
      father_name: "Ayah",
      status: "active",
      gender: "male",
      birth_place: "Kota",
      birth_date: Date.new(2012, 1, 1)
    ).permit!

    initial_parent_count = User.where(role: "parent").count

    begin
      Students::Creator.new(student_params: bad_params).create!
    rescue ActiveRecord::NotNullViolation, ActiveRecord::StatementInvalid
      # Expected - DB constraint fired
    end

    assert_equal initial_parent_count, User.where(role: "parent").count
  end
end
