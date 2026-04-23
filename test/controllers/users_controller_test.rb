require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = User.create!(
      username: "admin_users_test_#{rand(10_000)}",
      name: "Admin Users Test",
      role: "admin",
      password: "password123",
      password_confirmation: "password123"
    )
    @teacher = User.create!(
      username: "teacher_users_test_#{rand(10_000)}",
      name: "Teacher Users Test",
      role: "teacher",
      password: "password123",
      password_confirmation: "password123"
    )
  end

  # ─── Index ────────────────────────────────────────────────────────────────

  test "admin can access users index" do
    sign_in_as(@admin)
    get users_path
    assert_response :success
  end

  test "teacher cannot access users index" do
    sign_in_as(@teacher)
    begin
      get users_path
      assert_response :redirect
    rescue ActionController::ActionControllerError
      assert true
    end
  end

  # ─── Create User ──────────────────────────────────────────────────────────

  test "admin can create a new teacher user" do
    sign_in_as(@admin)
    assert_difference "User.count", 1 do
      post users_path, params: {
        user: {
          name: "Guru Baru",
          username: "guru_baru_#{rand(10_000)}",
          role: "teacher",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert body["success"]
    assert_equal "teacher", body["user"]["role"]
  end

  test "admin can create a new admin user" do
    sign_in_as(@admin)
    assert_difference "User.count", 1 do
      post users_path, params: {
        user: {
          name: "Admin Baru",
          username: "admin_baru_#{rand(10_000)}",
          role: "admin",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert body["success"]
    assert_equal "admin", body["user"]["role"]
  end

  test "create returns error when username is missing" do
    sign_in_as(@admin)
    assert_no_difference "User.count" do
      post users_path, params: {
        user: {
          name: "Tanpa Username",
          username: "",
          role: "teacher",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_not body["success"]
    assert body["errors"].any?
  end

  test "teacher cannot create users" do
    sign_in_as(@teacher)
    assert_no_difference "User.count" do
      begin
        post users_path, params: {
          user: {
            name: "Unauthorized",
            username: "unauthorized_#{rand(10_000)}",
            role: "teacher",
            password: "password123",
            password_confirmation: "password123"
          }
        }, as: :json
        # If it doesn't raise, it should redirect
        assert_response :redirect
      rescue ActionController::ActionControllerError
        assert true
      end
    end
  end

  # ─── Update Role ──────────────────────────────────────────────────────────

  test "admin can update user role" do
    sign_in_as(@admin)
    patch update_role_user_path(@teacher), params: { role: "admin" }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["success"]
    assert_equal "admin", @teacher.reload.role
  end

  private

  def sign_in_as(user)
    post session_path, params: { username: user.username, password: "password123" }
    follow_redirect! if response.redirect?
  end
end
