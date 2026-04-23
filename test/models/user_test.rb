require "test_helper"

class UserTest < ActiveSupport::TestCase
  def valid_user_attrs(overrides = {})
    {
      username: "testuser_#{rand(10_000)}",
      name: "Test User",
      role: "teacher",
      password: "password123",
      password_confirmation: "password123"
    }.merge(overrides)
  end

  def student
    @student ||= Student.create!(
      name: "Anak Test",
      class_level: "7A",
      status: "active",
      gender: "male",
      birth_place: "Jakarta",
      birth_date: Date.new(2012, 1, 1),
      father_name: "Ayah Test",
      current_hifz_in_juz: "1",
      current_hifz_in_pages: "1",
      current_hifz_in_surah: "Al-Fatihah"
    )
  end

  # ─── Role Helpers ─────────────────────────────────────────────────────────

  test "admin? returns true for admin role" do
    user = User.new(valid_user_attrs(role: "admin"))
    assert user.admin?
    assert_not user.teacher?
    assert_not user.parent?
  end

  test "teacher? returns true for teacher role" do
    user = User.new(valid_user_attrs(role: "teacher"))
    assert user.teacher?
    assert_not user.admin?
    assert_not user.parent?
  end

  test "parent? returns true for parent role" do
    user = User.new(valid_user_attrs(role: "parent", student_id: student.id))
    assert user.parent?
    assert_not user.admin?
    assert_not user.teacher?
  end

  # ─── Parent Validation ────────────────────────────────────────────────────

  test "parent user requires student_id" do
    user = User.new(valid_user_attrs(role: "parent", student_id: nil))
    assert_not user.valid?
    assert_includes user.errors[:student_id], "can't be blank"
  end

  test "non-parent user does not require student_id" do
    user = User.new(valid_user_attrs(role: "teacher", student_id: nil))
    assert user.valid?, user.errors.full_messages.to_sentence
  end

  # ─── Password Authentication ──────────────────────────────────────────────

  test "user authenticates with correct password" do
    user = User.create!(valid_user_attrs(password: "secret123", password_confirmation: "secret123"))
    assert user.authenticate("secret123")
  end

  test "user does not authenticate with wrong password" do
    user = User.create!(valid_user_attrs(password: "secret123", password_confirmation: "secret123"))
    assert_not user.authenticate("wrongpassword")
  end
end
