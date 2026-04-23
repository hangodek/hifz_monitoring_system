require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      username: "session_user_#{rand(10_000)}",
      name: "Session Test",
      role: "admin",
      password: "password123",
      password_confirmation: "password123"
    )
  end

  # ─── Login ────────────────────────────────────────────────────────────────

  test "login page is accessible" do
    get new_session_path
    assert_response :success
  end

  test "successful login redirects to dashboard" do
    post session_path, params: { username: @user.username, password: "password123" }
    assert_response :redirect
    follow_redirect!
    assert_response :success
  end

  test "failed login with wrong password stays on login page" do
    post session_path, params: { username: @user.username, password: "wrongpass" }
    # Should not redirect to a success page
    assert_response :unprocessable_entity
  end

  test "failed login with nonexistent username" do
    post session_path, params: { username: "nobody", password: "password123" }
    assert_response :unprocessable_entity
  end

  # ─── Logout ───────────────────────────────────────────────────────────────

  test "logout clears session and redirects to login" do
    post session_path, params: { username: @user.username, password: "password123" }
    follow_redirect! if response.redirect?

    delete session_path
    assert_response :redirect
    follow_redirect!
    assert_equal new_session_path, request.path
  end
end
