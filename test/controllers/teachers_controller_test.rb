require "test_helper"

class TeachersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @teacher = users(:two) # teacher role
  end

  test "should export scores as teacher" do
    # Login
    post session_path, params: { username: @teacher.username, password: "password" }
    
    # Request export
    get export_scores_teachers_path(format: :xlsx)
    
    assert_response :success
    assert_equal "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", response.media_type
  end

  test "should bulk save activities" do
    post session_path, params: { username: @teacher.username, password: "password" }

    student = students(:one)
    
    post bulk_save_activities_teachers_path, params: {
      student_id: student.id,
      juz: "30",
      activities: [
        {
          juz: "30",
          surah: "An-Naba'",
          completion_status: "tuntas"
        }
      ]
    }

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "1 baris berhasil disimpan.", json_response["message"]
  end
end
