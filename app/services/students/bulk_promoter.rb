module Students
  class BulkPromoter
    def initialize(student_ids:, target_class:, mark_as_graduated:)
      @student_ids = student_ids
      @target_class = target_class
      @mark_as_graduated = mark_as_graduated
    end

    def promote!
      return { error: "Student IDs harus diisi", status: :unprocessable_entity } if @student_ids.blank?
      return { error: "Kelas tujuan atau status kelulusan harus dipilih", status: :unprocessable_entity } if @target_class.blank? && !@mark_as_graduated

      begin
        updates = {}
        
        if @mark_as_graduated
          updates[:status] = "graduated"
        end
        
        if @target_class.present?
          updates[:class_level] = @target_class
        end
        
        updated_count = Student.where(id: @student_ids).update_all(updates)
        
        if @mark_as_graduated && @target_class.present?
          message = "Berhasil memindahkan #{updated_count} pelajar ke #{@target_class} dan mengubah status menjadi Lulus"
        elsif @mark_as_graduated
          message = "Berhasil meluluskan #{updated_count} pelajar"
        else
          message = "Berhasil memindahkan #{updated_count} pelajar ke #{@target_class}"
        end
        
        { 
          success: true, 
          message: message,
          updated_count: updated_count
        }
      rescue => e
        { error: "Terjadi kesalahan: #{e.message}", status: :internal_server_error }
      end
    end
  end
end
