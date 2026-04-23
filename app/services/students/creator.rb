module Students
  class Creator
    def initialize(student_params:)
      @student_params = student_params
      @student = Student.new(@student_params)
    end

    def create!
      if @student.save
        parent_user = @student.create_parent_account!

        {
          success: true,
          student: @student,
          parent_user: parent_user,
          parent_credentials: {
            student_name: @student.name,
            username: parent_user.username,
            password: parent_user.username
          }
        }
      else
        { success: false, student: @student }
      end
    end
  end
end
