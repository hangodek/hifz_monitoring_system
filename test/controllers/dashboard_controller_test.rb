require "test_helper"

class DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:one)
  end

  test "should get index" do
    post session_path, params: { username: @admin.username, password: "password" }
    get dashboard_index_url
    assert_response :success
  end
end
