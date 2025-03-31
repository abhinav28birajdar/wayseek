package com.example.wayseek

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.util.Log
import android.view.LayoutInflater
import android.view.Surface // Import needed for rotation constants
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.AspectRatio
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.wayseek.Constants.LABELS_PATH
import com.example.wayseek.Constants.MODEL_PATH
import com.example.wayseek.databinding.ActivityMainBinding
import java.util.* // Added for Locale
import java.util.concurrent.ConcurrentHashMap // Use ConcurrentHashMap for thread-safe map
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

// Implement TextToSpeech.OnInitListener
class MainActivity : AppCompatActivity(), Detector.DetectorListener, TextToSpeech.OnInitListener {

    private lateinit var binding: ActivityMainBinding
    private val isFrontCamera = false

    // Camera Components
    private var preview: Preview? = null
    private var imageAnalyzer: ImageAnalysis? = null
    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null

    // Detection & Logging
    private var detector: Detector? = null
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var logAdapter: LogAdapter

    // Delayed Logging & TTS Components
    private val logUpdateHandler = Handler(Looper.getMainLooper())
    private lateinit var logUpdateRunnable: Runnable
    private val maxSimultaneousCountsInInterval: ConcurrentHashMap<String, Int> = ConcurrentHashMap()
    private val LOG_UPDATE_INTERVAL_MS = 5000L // Visual Log update interval: 5 seconds
    // --- Flag for 10-second TTS interval - RE-ADDED ---
    private var triggerTtsNextTime = false // Start false, so speech is at 10s, 20s, etc.

    // Text-to-Speech Components
    private var tts: TextToSpeech? = null
    private var isTtsInitialized = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tts = TextToSpeech(this, this)
        Log.d(TAG, "TTS engine initialization requested.")

        logAdapter = LogAdapter()
        binding.logsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = logAdapter
        }

        cameraExecutor = Executors.newSingleThreadExecutor()

        cameraExecutor.execute {
            detector = Detector(baseContext, MODEL_PATH, LABELS_PATH, this)
            Log.d(TAG, "Detector initialized on background thread.")
        }

        setupDelayedLogUpdate()

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestPermissionLauncher.launch(REQUIRED_PERMISSIONS)
        }

        bindListeners()
    }

    override fun onInit(status: Int) {
        // (onInit logic remains the same)
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale.US)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e(TAG, "TTS: US English not supported, trying default.")
                val defaultResult = tts?.setLanguage(Locale.getDefault())
                if (defaultResult == TextToSpeech.LANG_MISSING_DATA || defaultResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e(TAG, "TTS: Default language not supported either!")
                    isTtsInitialized = false
                } else {
                    isTtsInitialized = true
                    Log.i(TAG, "TTS Initialization Successful (using default locale).")
                }
            } else {
                isTtsInitialized = true
                Log.i(TAG, "TTS Initialization Successful (using US English).")
            }
        } else {
            isTtsInitialized = false
            Log.e(TAG, "TTS Initialization Failed! Status: $status")
        }
    }

    // --- MODIFIED Setup Repeating Task (TTS Flag Re-added) ---
    private fun setupDelayedLogUpdate() {
        logUpdateRunnable = Runnable {
            // This runs on the Main (UI) thread every 5 seconds

            // --- Decide if TTS should happen THIS time (every 10s) - RE-ADDED ---
            val speakThisTime = triggerTtsNextTime
            triggerTtsNextTime = !triggerTtsNextTime // Flip the flag for the next 5s run
            //-------------------------------------------------------------

            // --- Atomically get final max counts and clear for next interval ---
            val countsToReport: Map<String, Int>
            synchronized(maxSimultaneousCountsInInterval) {
                if (maxSimultaneousCountsInInterval.isEmpty()){
                    countsToReport = emptyMap()
                } else {
                    countsToReport = HashMap(maxSimultaneousCountsInInterval)
                    maxSimultaneousCountsInInterval.clear()
                }
            }
            val sortedCountsToReport = countsToReport.toSortedMap()


            if (sortedCountsToReport.isNotEmpty()) {
                // --- 1. Format max counts for log display (Happens every 5s) ---
                val logEntries = sortedCountsToReport.map { (name, count) ->
                    try {
                        getString(R.string.log_entry_count_format, count, name)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to find R.string.log_entry_count_format", e)
                        "$count x $name (fmt err)"
                    }
                }

                // --- 2. Update RecyclerView (Happens every 5s) ---
                Log.d(TAG, "Updating logs with max simultaneous counts: $logEntries")
                logAdapter.clearLogs()
                logAdapter.addLogs(logEntries)
                binding.logsRecyclerView.scrollToPosition(0)

                // --- 3. Announce max counts via TTS (Happens every 10s) - RE-ADDED Condition ---
                if (speakThisTime) {
                    Log.i(TAG,"TTS interval reached, attempting to speak max counts.")
                    speakDetectedObjectCounts(sortedCountsToReport)
                } else {
                    Log.v(TAG, "TTS interval not reached, skipping speech.")
                }
                // ------------------------------------------------------------------------

            } else {
                // No objects detected at all during the 5s interval
                Log.v(TAG, "No objects detected in the last ${LOG_UPDATE_INTERVAL_MS}ms.")
                logAdapter.clearLogs()
                binding.logsRecyclerView.scrollToPosition(0)
                // Optional: Decide if TTS flag should reset on empty interval (Current: No reset)
            }

            // --- 4. Reschedule this runnable (Always for 5 seconds) ---
            logUpdateHandler.postDelayed(logUpdateRunnable, LOG_UPDATE_INTERVAL_MS)
        }
    }
    // --- END MODIFIED Setup Repeating Task ---

    // (speakDetectedObjectCounts function remains the same)
    private fun speakDetectedObjectCounts(objectCounts: Map<String, Int>) {
        if (!isTtsInitialized || tts == null || objectCounts.isEmpty()) {
            if (!isTtsInitialized) Log.w(TAG, "TTS not ready, cannot speak counts.")
            return
        }
        val textToSpeak = buildString {
            append("Detected ")
            val entries = objectCounts.entries.toList()
            entries.forEachIndexed { index, (name, count) ->
                append(count)
                append(" ")
                append(name)
                if (count > 1) {
                    if (!name.endsWith("s", ignoreCase = true)) {
                        append("s")
                    }
                }
                if (index < entries.size - 2) {
                    append(", ")
                } else if (index == entries.size - 2) {
                    if (entries.size > 1) append(" and ")
                }
            }
            append(".")
        }
        Log.d(TAG, "Speaking counts: \"$textToSpeak\"")
        tts?.speak(textToSpeak, TextToSpeech.QUEUE_FLUSH, null, "detection_count_announcement")
    }

    // (speak function remains the same)
    private fun speak(text: String, utteranceId: String = "general_message") {
        if (!isTtsInitialized || tts == null) return
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    // (bindListeners function remains the same - clearing map is sufficient)
    private fun bindListeners() {
        binding.apply {
            isGpu.setOnCheckedChangeListener { buttonView, isChecked ->
                Log.d(TAG, "GPU Toggle changed: $isChecked")
                cameraExecutor.submit {
                    detector?.restart(isGpu = isChecked)
                }
                val colorRes = if (isChecked) R.color.orange else R.color.gray
                buttonView.backgroundTintList = ContextCompat.getColorStateList(this@MainActivity, colorRes)
                maxSimultaneousCountsInInterval.clear()
                logAdapter.clearLogs()
                binding.logsRecyclerView.scrollToPosition(0)
                tts?.stop()
                // Optional: Reset TTS flag on GPU toggle?
                // triggerTtsNextTime = false
            }
        }
    }

    // (startCamera function remains the same)
    private fun startCamera() {
        Log.d(TAG, "startCamera called")
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                bindCameraUseCases()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get CameraProvider", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // (bindCameraUseCases function remains the same)
    private fun bindCameraUseCases() {
        Log.d(TAG, "bindCameraUseCases called")
        val cameraProvider = cameraProvider ?: run {
            Log.e(TAG, "Camera initialization failed - cameraProvider is null.")
            return
        }
        val rotation = binding.viewFinder.display?.rotation ?: Surface.ROTATION_0
        Log.d(TAG, "ViewFinder rotation: $rotation")
        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(CameraSelector.LENS_FACING_BACK)
            .build()
        preview = Preview.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .setTargetRotation(rotation)
            .build()
        imageAnalyzer = ImageAnalysis.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .setTargetRotation(rotation)
            .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
            .build()
        imageAnalyzer?.setAnalyzer(cameraExecutor) { imageProxy ->
            val bitmapBuffer = Bitmap.createBitmap(
                imageProxy.width,
                imageProxy.height,
                Bitmap.Config.ARGB_8888
            )
            try {
                val currentDetector = detector ?: run {
                    imageProxy.close()
                    return@setAnalyzer
                }
                imageProxy.planes[0].buffer.rewind()
                bitmapBuffer.copyPixelsFromBuffer(imageProxy.planes[0].buffer)
                val matrix = Matrix().apply {
                    postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
                }
                val rotatedBitmap = Bitmap.createBitmap(
                    bitmapBuffer, 0, 0, imageProxy.width, imageProxy.height,
                    matrix, true
                )
                currentDetector.detect(rotatedBitmap) // Calls onDetect
            } catch (e: Exception) {
                Log.e(TAG, "Error during image analysis/detection", e)
            } finally {
                imageProxy.close()
            }
        }
        cameraProvider.unbindAll()
        Log.d(TAG, "CameraProvider unbound all use cases.")
        try {
            Log.d(TAG, "Binding lifecycle to camera provider...")
            camera = cameraProvider.bindToLifecycle(
                this,
                cameraSelector,
                preview,
                imageAnalyzer
            )
            preview?.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            Log.d(TAG, "Camera use cases bound successfully.")
        } catch (exc: Exception) {
            Log.e(TAG, "Use case binding failed", exc)
        }
    }


    // (Permission handling functions remain the same)
    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.CAMERA] == true) {
            Log.i(TAG, "Camera permission granted by user.")
            startCamera()
        } else {
            Log.w(TAG, "Camera permission was denied by user.")
        }
    }


    // (onResume function remains the same, clearing map is good)
    override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume called")
        if (!allPermissionsGranted()) {
            Log.d(TAG, "Permissions not granted onResume.")
        } else {
            if (cameraProvider != null && camera == null) {
                Log.d(TAG, "Permissions OK, re-binding camera use cases...")
                bindCameraUseCases()
            } else if (cameraProvider == null) {
                Log.d(TAG, "Permissions OK, starting camera...")
                startCamera()
            }
            Log.d(TAG, "Starting delayed log/speech updater.")
            maxSimultaneousCountsInInterval.clear() // Clear counts on resume
            // Optional: Reset TTS rhythm on resume?
            // triggerTtsNextTime = false
            logUpdateHandler.removeCallbacks(logUpdateRunnable)
            logUpdateHandler.postDelayed(logUpdateRunnable, LOG_UPDATE_INTERVAL_MS)
        }
    }


    // (onPause function remains the same)
    override fun onPause() {
        super.onPause()
        Log.d(TAG, "onPause called")
        Log.d(TAG, "Stopping delayed log/speech updater.")
        logUpdateHandler.removeCallbacks(logUpdateRunnable)
        tts?.stop()
        Log.d(TAG, "TTS speech stopped on pause.")
    }


    // (onDestroy function remains the same)
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "onDestroy called")
        if (tts != null) {
            Log.d(TAG,"Stopping and shutting down TTS engine.")
            tts?.stop()
            tts?.shutdown()
            Log.d(TAG,"TTS engine shut down.")
            tts = null
        }
        isTtsInitialized = false
        logUpdateHandler.removeCallbacks(logUpdateRunnable)
        detector?.close()
        cameraExecutor.shutdown()
        try {
            if (!cameraExecutor.awaitTermination(500, TimeUnit.MILLISECONDS)) {
                cameraExecutor.shutdownNow()
            }
        } catch (e: InterruptedException) {
            cameraExecutor.shutdownNow()
            Thread.currentThread().interrupt()
        }
        Log.d(TAG,"CameraExecutor shut down.")
    }


    // (companion object remains the same)
    companion object {
        private const val TAG = "WaySeekApp_MainActivity"
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }


    // (onEmptyDetect function remains the same)
    override fun onEmptyDetect() {
        runOnUiThread {
            binding.overlay.clear()
            binding.inferenceTime.text = ""
        }
    }


    // (onDetect function remains the same - updates max counts per frame)
    override fun onDetect(boundingBoxes: List<BoundingBox>, inferenceTime: Long) {
        // Update UI
        runOnUiThread {
            binding.inferenceTime.text = "${inferenceTime}ms"
            binding.overlay.apply {
                setResults(boundingBoxes)
                invalidate()
            }
        }

        // Update max counts based on this frame
        if (boundingBoxes.isNotEmpty()) {
            val currentFrameCounts = boundingBoxes
                .mapNotNull { if (it.clsName.isNotEmpty()) it.clsName else null }
                .groupingBy { it }
                .eachCount()

            currentFrameCounts.forEach { (name, currentFrameCount) ->
                maxSimultaneousCountsInInterval.compute(name) { _, existingMax ->
                    maxOf(existingMax ?: 0, currentFrameCount)
                }
            }
        }
    }
}

// --- LogAdapter class remains the same ---
// (Ensure R.layout.log_item is used in onCreateViewHolder)
class LogAdapter(private var logs: MutableList<String> = mutableListOf()) :
    RecyclerView.Adapter<LogAdapter.LogViewHolder>() {

    companion object {
        private const val TAG = "LogAdapter"
    }

    class LogViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val textView: TextView = itemView.findViewById(R.id.log_item_text) // Check ID
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LogViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.log_activity, parent, false) // Use your item layout
        return LogViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: LogViewHolder, position: Int) {
        holder.textView.text = logs[position]
    }

    override fun getItemCount(): Int {
        return logs.size
    }

    fun addLogs(newLogEntries: List<String>) {
        if (newLogEntries.isEmpty()) return
        logs.addAll(newLogEntries)
        notifyItemRangeInserted(0, newLogEntries.size)
    }

    fun clearLogs() {
        val size = logs.size
        if (size > 0) {
            logs.clear()
            notifyItemRangeRemoved(0, size)
        }
    }
}