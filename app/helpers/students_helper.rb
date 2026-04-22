module StudentsHelper
  def calculate_activity_score(activity)
    k = activity.kelancaran || 0
    f = activity.fashohah || 0
    t = activity.tajwid || 0
    k + f + t
  end

  def calculate_monthly_progress(student, activities)
    current_month = Date.current.beginning_of_month
    start_date = current_month - 3.months
    end_date = current_month + 3.months
    
    monthly_data = []
    month_iterator = start_date

    while month_iterator <= end_date
      month_name = month_iterator.strftime("%b")
      total_juz_hafal = total_juz_completed_for_student_up_to(student, month_iterator.end_of_month)

      is_projected = month_iterator > current_month

      monthly_data << {
        month: month_name,
        completed: total_juz_hafal,
        is_projected: is_projected
      }

      month_iterator = month_iterator.next_month
    end

    monthly_data
  end
end
