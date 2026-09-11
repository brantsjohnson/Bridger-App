// ============================================
// WHAT THIS FILE DOES (plain English):
// Lifts the subject out of a photo on Android using Google's on-device
// subject tool (the same family Galaxy and Pixel phones use). The photo
// never leaves the phone. If the model is missing, we throw and the
// editor falls back to a clean shape.
// ============================================
package social.bridger.cutout

import android.graphics.Bitmap
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class SubjectCutoutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SubjectCutout")

    AsyncFunction("liftSubject") { uri: String ->
      val context = appContext.reactContext
        ?: throw CodedException("NO_CONTEXT", "No Android context", null)
      val parsed = Uri.parse(uri)
      val image = try {
        InputImage.fromFilePath(context, parsed)
      } catch (e: Exception) {
        throw CodedException("BAD_IMAGE", "Could not read that photo", e)
      }
      val options = SubjectSegmenterOptions.Builder()
        .enableForegroundBitmap()
        .build()
      val segmenter = SubjectSegmentation.getClient(options)
      try {
        val result = Tasks.await(segmenter.process(image))
        val bitmap = result.foregroundBitmap
          ?: throw CodedException("NO_SUBJECT", "No subject in that photo", null)
        val out = File(context.cacheDir, "cutout-${UUID.randomUUID()}.png")
        FileOutputStream(out).use { stream ->
          if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
            throw CodedException("WRITE_FAILED", "Could not save the cutout", null)
          }
        }
        out.toURI().toString()
      } catch (e: CodedException) {
        throw e
      } catch (e: Exception) {
        throw CodedException("SUBJECT_CUTOUT_FAILED", "Could not lift that subject", e)
      } finally {
        segmenter.close()
      }
    }
  }
}
