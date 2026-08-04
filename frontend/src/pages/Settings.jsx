import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function Settings() {
  const [settings, setSettings] = useState({
    llm_api_key: '',
    llm_base_url: 'https://api.openai.com/v1',
    llm_model: 'gpt-3.5-turbo',
    pexels_api_key: '',
    voice_provider: 'edge_tts',
    openai_tts_voice: 'alloy',
    video_quality: '720p',
    default_duration: 60,
    add_text_overlays: true,
    add_transitions: true,
    add_background_music: false
  })
  
  const [availableModels, setAvailableModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingLLM, setTestingLLM] = useState(false)
  const [testingPexels, setTestingPexels] = useState(false)
  const [llmTestResult, setLlmTestResult] = useState(null)
  const [pexelsTestResult, setPexelsTestResult] = useState(null)
  const [configured, setConfigured] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPexelsKey, setShowPexelsKey] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`)
      const data = response.data
      
      if (data.settings) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          llm_base_url: data.settings.llm_base_url || prev.llm_base_url,
          llm_model: data.settings.llm_model || prev.llm_model,
          voice_provider: data.settings.voice_provider || prev.voice_provider,
          openai_tts_voice: data.settings.openai_tts_voice || prev.openai_tts_voice,
          video_quality: data.settings.video_quality || prev.video_quality,
          default_duration: data.settings.default_duration || prev.default_duration,
          add_text_overlays: data.settings.add_text_overlays ?? prev.add_text_overlays,
          add_transitions: data.settings.add_transitions ?? prev.add_transitions,
          add_background_music: data.settings.add_background_music ?? prev.add_background_music
        }))
      }
      
      setConfigured(data.configured || false)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const fetchAvailableModels = async () => {
    if (!settings.llm_api_key) {
      alert('Please enter your LLM API key first')
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/llm/models`)
      setAvailableModels(response.data.models || [])
    } catch (error) {
      console.error('Failed to fetch models:', error)
      alert(`Failed to fetch models: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/settings`, settings)
      alert('Settings saved successfully!')
      loadSettings()
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert(`Failed to save settings: ${error.response?.data?.detail || error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const testLLMConnection = async () => {
    setTestingLLM(true)
    setLlmTestResult(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/test-llm`)
      setLlmTestResult(response.data)
    } catch (error) {
      setLlmTestResult({
        success: false,
        message: error.response?.data?.detail || error.message
      })
    } finally {
      setTestingLLM(false)
    }
  }

  const testPexelsConnection = async () => {
    setTestingPexels(true)
    setPexelsTestResult(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/settings/test-pexels`)
      setPexelsTestResult(response.data)
    } catch (error) {
      setPexelsTestResult({
        success: false,
        message: error.response?.data?.detail || error.message
      })
    } finally {
      setTestingPexels(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleBooleanChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            ⚙️ Settings
          </h1>
          <p className="text-xl text-blue-200">
            Configure your API keys and preferences
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Configuration Status */}
          <div className={`mb-8 p-6 rounded-2xl backdrop-blur-lg shadow-2xl ${
            configured ? 'bg-green-500/20 border border-green-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">{configured ? '✅' : '⚠️'}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {configured ? 'All Configured!' : 'Configuration Required'}
                  </h2>
                  <p className="text-white/70">
                    {configured 
                      ? 'Your API keys are set up and ready to generate videos.' 
                      : 'Please configure your LLM and Pexels API keys to start generating videos.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🤖</span>
              LLM Configuration
            </h2>

            <div className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  LLM API Key *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.llm_api_key}
                    onChange={(e) => handleChange('llm_api_key', e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  LLM Base URL
                </label>
                <input
                  type="url"
                  value={settings.llm_base_url}
                  onChange={(e) => handleChange('llm_base_url', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                />
                <p className="text-xs text-white/60 mt-1">
                  For OpenAI-compatible APIs (LocalAI, Ollama, etc.)
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white">
                    LLM Model
                  </label>
                  <button
                    type="button"
                    onClick={fetchAvailableModels}
                    disabled={loading || !settings.llm_api_key}
                    className="text-xs px-3 py-1 bg-purple-500/30 hover:bg-purple-500/50 text-white rounded transition-all disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : '🔄 Auto-detect Models'}
                  </button>
                </div>
                
                {availableModels.length > 0 ? (
                  <select
                    value={settings.llm_model}
                    onChange={(e) => handleChange('llm_model', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id} className="bg-gray-800">
                        {model.name} ({model.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.llm_model}
                    onChange={(e) => handleChange('llm_model', e.target.value)}
                    placeholder="gpt-3.5-turbo"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                )}
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={testLLMConnection}
                  disabled={testingLLM || !settings.llm_api_key}
                  className="px-6 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {testingLLM ? 'Testing...' : '🧪 Test Connection'}
                </button>
                
                {llmTestResult && (
                  <span className={`text-sm ${llmTestResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {llmTestResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pexels Configuration */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🎥</span>
              Pexels API Configuration
            </h2>

            <div className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Pexels API Key *
                </label>
                <div className="relative">
                  <input
                    type={showPexelsKey ? 'text' : 'password'}
                    value={settings.pexels_api_key}
                    onChange={(e) => handleChange('pexels_api_key', e.target.value)}
                    placeholder="Your Pexels API key"
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPexelsKey(!showPexelsKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPexelsKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Get your free API key from{' '}
                  <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                    Pexels
                  </a>
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={testPexelsConnection}
                  disabled={testingPexels || !settings.pexels_api_key}
                  className="px-6 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {testingPexels ? 'Testing...' : '🧪 Test Connection'}
                </button>
                
                {pexelsTestResult && (
                  <span className={`text-sm ${pexelsTestResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {pexelsTestResult.message}
                    {pexelsTestResult.total_results !== undefined && ` (${pexelsTestResult.total_results} videos found)`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🎙️</span>
              Voice Settings
            </h2>

            <div className="space-y-6">
              {/* Voice Provider */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Voice Provider
                </label>
                <select
                  value={settings.voice_provider}
                  onChange={(e) => handleChange('voice_provider', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                >
                  <option value="edge_tts" className="bg-gray-800">Edge TTS (Free)</option>
                  <option value="openai_tts" className="bg-gray-800">OpenAI TTS</option>
                </select>
              </div>

              {/* OpenAI TTS Voice */}
              {settings.voice_provider === 'openai_tts' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    OpenAI TTS Voice
                  </label>
                  <select
                    value={settings.openai_tts_voice}
                    onChange={(e) => handleChange('openai_tts_voice', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  >
                    <option value="alloy" className="bg-gray-800">Alloy</option>
                    <option value="echo" className="bg-gray-800">Echo</option>
                    <option value="fable" className="bg-gray-800">Fable</option>
                    <option value="onyx" className="bg-gray-800">Onyx</option>
                    <option value="nova" className="bg-gray-800">Nova</option>
                    <option value="shimmer" className="bg-gray-800">Shimmer</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Video Preferences */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🎬</span>
              Video Preferences
            </h2>

            <div className="space-y-6">
              {/* Video Quality */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Default Video Quality
                </label>
                <select
                  value={settings.video_quality}
                  onChange={(e) => handleChange('video_quality', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                >
                  <option value="480p" className="bg-gray-800">480p (SD)</option>
                  <option value="720p" className="bg-gray-800">720p (HD)</option>
                  <option value="1080p" className="bg-gray-800">1080p (Full HD)</option>
                </select>
              </div>

              {/* Default Duration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Default Duration: {settings.default_duration} seconds
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="10"
                  value={settings.default_duration}
                  onChange={(e) => handleChange('default_duration', Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>30s</span>
                  <span>180s</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white">Add Text Overlays</label>
                  <button
                    type="button"
                    onClick={() => handleBooleanChange('add_text_overlays')}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.add_text_overlays ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.add_text_overlays ? 'transform translate-x-7' : ''
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Add Transitions</label>
                  <button
                    type="button"
                    onClick={() => handleBooleanChange('add_transitions')}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.add_transitions ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.add_transitions ? 'transform translate-x-7' : ''
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Add Background Music</label>
                  <button
                    type="button"
                    onClick={() => handleBooleanChange('add_background_music')}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.add_background_music ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.add_background_music ? 'transform translate-x-7' : ''
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                '💾 Save Settings'
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">ℹ️ Getting Your API Keys</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">🤖 LLM API Key</h3>
                <ul className="text-white/70 text-sm space-y-2">
                  <li>• OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">Get API Key</a></li>
                  <li>• LocalAI/Ollama: Use your local server URL</li>
                  <li>• Other providers: Any OpenAI-compatible endpoint</li>
                </ul>
              </div>
              
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">🎥 Pexels API Key</h3>
                <ul className="text-white/70 text-sm space-y-2">
                  <li>• Visit <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">Pexels API</a></li>
                  <li>• Sign up for a free account</li>
                  <li>• Generate your API key instantly</li>
                  <li>• Free tier: Unlimited API calls</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white/60 text-sm">
          <p>Your settings are stored locally and never sent to external servers</p>
        </footer>
      </div>
    </div>
  )
}

export default Settings
