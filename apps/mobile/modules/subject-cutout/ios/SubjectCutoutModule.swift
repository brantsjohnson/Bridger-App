// ============================================
// WHAT THIS FILE DOES (plain English):
// Uses Apple's on-device Vision tools (iOS 17+) to lift the subject out of
// a photo. Returns a PNG with a clear background. No photo is sent off the
// phone.
// ============================================
import ExpoModulesCore
import Vision
import UIKit
import CoreImage

enum SubjectCutoutError: Error {
  case badUri
  case badImage
  case noSubject
  case unsupported
  case writeFailed
}

public class SubjectCutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectCutout")

    AsyncFunction("liftSubject") { (uri: String) -> String in
      let path = uri.replacingOccurrences(of: "file://", with: "")
      let url = URL(fileURLWithPath: path)
      let data = try Data(contentsOf: url)
      guard let image = UIImage(data: data), let cg = image.cgImage else {
        throw SubjectCutoutError.badImage
      }

      if #available(iOS 17.0, *) {
        let request = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(cgImage: cg, options: [:])
        try handler.perform([request])
        guard let result = request.results?.first else {
          throw SubjectCutoutError.noSubject
        }
        let maskBuffer = try result.generateScaledMaskForImage(
          forInstances: result.allInstances,
          from: handler
        )
        let cut = try apply(mask: maskBuffer, to: image)
        let out = FileManager.default.temporaryDirectory
          .appendingPathComponent("cutout-\(UUID().uuidString).png")
        guard let png = cut.pngData() else { throw SubjectCutoutError.writeFailed }
        try png.write(to: out)
        return out.absoluteString
      }
      throw SubjectCutoutError.unsupported
    }
  }
}

@available(iOS 17.0, *)
private func apply(mask: CVPixelBuffer, to image: UIImage) throws -> UIImage {
  // Match the mask to the photo size so the cut is not a skinny strip.
  let ciImage = CIImage(image: image) ?? CIImage()
  var maskImage = CIImage(cvPixelBuffer: mask)
  let sx = ciImage.extent.width / max(maskImage.extent.width, 1)
  let sy = ciImage.extent.height / max(maskImage.extent.height, 1)
  maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
  let filter = CIFilter(name: "CIBlendWithMask")
  filter?.setValue(ciImage, forKey: kCIInputImageKey)
  filter?.setValue(CIImage.empty(), forKey: kCIInputBackgroundImageKey)
  filter?.setValue(maskImage, forKey: kCIInputMaskImageKey)
  guard let output = filter?.outputImage else { throw SubjectCutoutError.noSubject }
  let context = CIContext(options: nil)
  guard let cg = context.createCGImage(output, from: ciImage.extent) else {
    throw SubjectCutoutError.writeFailed
  }
  return UIImage(cgImage: cg, scale: image.scale, orientation: image.imageOrientation)
}
