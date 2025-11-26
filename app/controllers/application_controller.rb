class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  # allow_browser versions: :modern

  inertia_share do
    if Current.user
      {
        flash: {
          alert: flash[:alert],
          notice: flash[:notice]
        },
        auth: {
          user: {
            id: Current.user.id,
            name: Current.user.name,
            username: Current.user.username,
            role: Current.user.role
          }
        }
      }
    else
      {
        flash: {
          alert: flash[:alert],
          notice: flash[:notice]
        }
      }
    end
  end
end
