require 'json'

Pod::Spec.new do |s|
  s.name           = 'SubjectCutout'
  s.version        = '1.0.0'
  s.summary        = 'On-device subject lift for collage cutouts'
  s.description    = 'Uses Apple Vision to lift a person or object from a photo. The photo never leaves the phone.'
  s.author         = 'Bridger'
  s.homepage       = 'https://bridger.app'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
  s.frameworks = 'Vision', 'CoreImage', 'UIKit'
end
