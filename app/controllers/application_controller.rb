class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  # allow_browser versions: :modern

  inertia_share do
    {
      flash: {
        alert: flash[:alert],
        notice: flash[:notice]
      }
    }
  end
end
