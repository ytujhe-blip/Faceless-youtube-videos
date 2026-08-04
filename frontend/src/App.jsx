import { useState } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function App() {
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(60)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError(null)
    setStatus(null)
    setJobId(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        topic: topic,
        duration_seconds: duration,
        video_quality: '720p'
      })

      setJobId(response.data.job_id)
      
      // Start polling for status
      pollStatus(response.data.job_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start video generation')
      setLoading(false)
    }
  }

  const pollStatus = async (id) => {
    const maxAttempts = 120 // 2 minutes max
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${id}`)
        const jobStatus = response.data
        
        setStatus(jobStatus)

        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          clearInterval(interval)
          setLoading(false)
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setLoading(false)
          setError('Video generation is taking longer than expected')
        }
      } catch (err) {
        console.error('Error polling status:', err)
        clearInterval(interval)
        setLoading(false)
        setError('Failed to get status updates')
      }
    }, 2000) // Poll every 2 seconds
  }

  const downloadVideo = async () => {
    if (!jobId || !status?.video_url) return

    try {
      const response = await axios.get(`${API_BASE_URL}/video/${jobId}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `video_${jobId}.mp4`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download video')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎬 Faceless Video Generator
          </h1>
          <p className="text-xl text-blue-200">
            Create amazing videos automatically using AI and stock footage
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {/* Input Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-white mb-2">
                  Video Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The Benefits of Meditation"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">
                  Video Duration: {duration} seconds
                </label>
                <input
                  type="range"
                  id="duration"
                  min="30"
                  max="180"
                  step="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>30s</span>
                  <span>180s</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Video...
                  </span>
                ) : (
                  '🚀 Generate Video'
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-lg border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Generation Status</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    status.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {status.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Progress</span>
                    <span>{status.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-white/80">{status.message}</p>

                {status.status === 'completed' && status.video_url && (
                  <div className="mt-6">
                    <button
                      onClick={downloadVideo}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105"
                    >
                      📥 Download Video
                    </button>
                    
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <p className="text-white/80 text-sm">
                        Your video is ready! Click the button above to download it.
                      </p>
                    </div>
                  </div>
                )}

                {status.status === 'failed' && status.error && (
                  <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                    <p className="text-red-200 text-sm">
                      <strong>Error:</strong> {status.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* How It Works */}
          {!status && !loading && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mt-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI Script</h3>
                  <p className="text-white/70 text-sm">
                    LLM generates an engaging script based on your topic
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🎥</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Stock Footage</h3>
                  <p className="text-white/70 text-sm">
                    Automatically finds matching videos from Pexels
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-pink-500/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">✂️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Auto Edit</h3>
                  <p className="text-white/70 text-sm">
                    Voiceover and footage combined into final video
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white/60 text-sm">
          <p>Powered by AI • Free Stock Footage from Pexels • Edge TTS Voiceover</p>
        </footer>
      </div>
    </div>
  )
}

export default App
