# frozen_string_literal: true

# Active Storage configuration for image optimization

# Use Vips for image processing (faster and more efficient than MiniMagick)
Rails.application.config.active_storage.variant_processor = :vips

# Purge unattached uploads after 1 day to save space
Rails.application.config.active_storage.service_urls_expire_in = 1.day

# Configure content types allowed
Rails.application.config.active_storage.content_types_to_serve_as_binary = [
  "text/html",
  "text/javascript",
  "image/svg+xml",
  "application/postscript",
  "application/x-shockwave-flash",
  "text/xml",
  "application/xml",
  "application/xhtml+xml",
  "application/mathml+xml",
  "text/cache-manifest"
]

# Allow all image types
Rails.application.config.active_storage.content_types_allowed_inline = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp"
]

# Track variants for automatic cleanup
Rails.application.config.active_storage.track_variants = true
