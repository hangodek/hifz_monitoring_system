module Students
  class Creator
    def initialize(student_params:)
      @student_params = student_params
      @student = Student.new(@student_params)
    end

    def create!
      if @student.save
        parent_username = generate_parent_username(@student.name)
        parent_password = parent_username
        
        parent_user = User.create(
          username: parent_username,
          name: "Orang Tua #{@student.name}",
          password: parent_password,
          password_confirmation: parent_password,
          role: "parent",
          student_id: @student.id
        )

        {
          success: true,
          student: @student,
          parent_user: parent_user,
          parent_credentials: {
            student_name: @student.name,
            username: parent_username,
            password: parent_password
          }
        }
      else
        { success: false, student: @student }
      end
    end

    private

    def generate_parent_username(student_name)
      clean_name = student_name.downcase
                              .gsub(/[^a-z0-9\s]/, '')
                              .gsub(/\s+/, '')
      
      base_username = "orangtua_#{clean_name}"
      
      username = base_username
      counter = 1
      while User.exists?(username: username)
        username = "#{base_username}#{counter}"
        counter += 1
      end
      
      username
    end
  end
end
