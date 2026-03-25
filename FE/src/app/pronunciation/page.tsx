'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VocabularyWord {
  id: string;
  korean: string;
  english: string;
  romanization: string;
}

export default function PronunciationPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [transcribed, setTranscribed] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch vocabulary by level
  const fetchVocabulary = async (level: string) => {
    try {
      setMessage('⏳ Đang tải từ vựng...');
      const response = await fetch(`http://localhost:5000/api/pronunciation/vocabulary/${level}?limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary');
      }
      
      const data = await response.json();
      if (data.success && data.vocabulary) {
        setVocabulary(data.vocabulary);
        setMessage('');
        
        // Select random word
        const randomWord = data.vocabulary[Math.floor(Math.random() * data.vocabulary.length)];
        setCurrentWord(randomWord);
      } else {
        throw new Error('Invalid vocabulary data');
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setMessage('❌ Không thể tải từ vựng');
      // Fallback to sample vocabulary
      const sampleVocabulary: VocabularyWord[] = [
        { id: '1', korean: '안녕하세요', english: 'Hello (formal)', romanization: 'annyeonghaseyo' },
        { id: '2', korean: '감사합니다', english: 'Thank you', romanization: 'gamsahamnida' },
        { id: '3', korean: '미안합니다', english: 'I am sorry', romanization: 'mianhamnida' },
        { id: '4', korean: '물', english: 'Water', romanization: 'mul' },
        { id: '5', korean: '밥', english: 'Rice/Food', romanization: 'bap' },
      ];
      setVocabulary(sampleVocabulary);
      const randomWord = sampleVocabulary[Math.floor(Math.random() * sampleVocabulary.length)];
      setCurrentWord(randomWord);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch vocabulary for user's level
    const userLevel = user?.level || 'NEWBIE';
    fetchVocabulary(userLevel);
  }, [token, router, user?.level]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setMessage('🎤 Đang ghi âm... Nói đi!');
      };
      
      mediaRecorder.onstop = () => {
        setIsRecording(false);
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage('❌ Không thể truy cập microphone');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    setLoading(true);
    setMessage('⏳ Đang phân tích...');
    
    // Capture currentWord here to avoid closure issues
    const targetWord = currentWord;
    
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Create blob and convert to base64
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        
        reader.onload = async () => {
          const base64Audio = reader.result as string;
          
          if (!targetWord) {
            setMessage('❌ Không có từ vựng nào được chọn');
            setLoading(false);
            return;
          }
          
          try {
            // Send to backend for transcription
            console.log('📤 Gửi âm thanh tới transcribe API...');
            const response = await fetch('http://localhost:5000/api/pronunciation/transcribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                audio: base64Audio,
                target: targetWord.korean,
              }),
            });
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Kết quả:', data);
            
            setTranscribed(data.transcribed_text);
            
            if (data.score !== null) {
              setScore(data.score);
              
              if (data.score >= 80) {
                setMessage(`✅ Tuyệt vời! Bạn phát âm chính xác (${data.score}%)`);
              } else if (data.score >= 50) {
                setMessage(`👍 Khá tốt (${data.score}%). Hãy thử lại để cải thiện.`);
              } else {
                setMessage(`😅 Cần luyện tập thêm (${data.score}%). Hãy thử lại.`);
              }
            }
          } catch (error) {
            console.error('Error:', error);
            setMessage('❌ Lỗi phân tích âm thanh: ' + (error as Error).message);
          } finally {
            setLoading(false);
          }
        };
        
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        setMessage('❌ Lỗi xử lý âm thanh');
        setLoading(false);
      }
    };
    
    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  };

  const playPronunciation = async () => {
    if (!currentWord) return;
    
    setIsPlaying(true);
    setMessage('🔊 Đang tải âm thanh...');
    
    try {
      console.log('📤 Yêu cầu TTS cho:', currentWord.korean);
      const response = await fetch('http://localhost:5000/api/pronunciation/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentWord.korean,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ TTS generated');
      
      // Play audio
      if (audioRef.current) {
        audioRef.current.src = data.audio;
        audioRef.current.onplay = () => {
          setMessage('🔊 Đang phát âm thanh...');
        };
        audioRef.current.onended = () => {
          setMessage('');
          setIsPlaying(false);
        };
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Không thể tải âm thanh: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const nextWord = () => {
    // Clean up current recording if still active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    
    // Reset states
    if (vocabulary.length > 0) {
      const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
      setCurrentWord(randomWord);
    }
    setScore(null);
    setTranscribed('');
    setMessage('');
    setIsRecording(false);
    setLoading(false);
  };

  if (!currentWord) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">🎤 Luyện phát âm</h1>
          <p className="text-gray-600 mb-4">Nghe phát âm chuẩn và ghi lại tiếng của bạn</p>
          <Link href="/" className="text-green-600 hover:text-green-800 underline">← Quay lại trang chính</Link>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('❌') ? 'bg-red-100 text-red-700' :
            message.includes('✅') ? 'bg-green-100 text-green-700' :
            message.includes('⏳') ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {message}
          </div>
        )}

        {/* Main Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Vocabulary Word */}
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-5xl font-bold text-green-700 mb-2">{currentWord.korean}</h2>
                <p className="text-xl text-gray-600 italic">{currentWord.romanization}</p>
                <p className="text-lg text-gray-500 mt-2">{currentWord.english}</p>
              </div>
              
              {/* Play Pronunciation Button */}
              <button
                onClick={playPronunciation}
                disabled={isPlaying}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition text-lg"
              >
                {isPlaying ? '🔊 Đang phát...' : '🔊 Nghe phát âm'}
              </button>
              
              <audio ref={audioRef} hidden />
            </div>

            {/* Recording Section */}
            <div className="border-t border-b py-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Ghi âm tiếng của bạn</h3>
              
              <div className="flex gap-4 justify-center mb-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition text-lg"
                  >
                    🎤 Bắt đầu ghi âm
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition text-lg"
                  >
                    {loading ? '⏳ Đang phân tích...' : '⏹️ Dừng ghi âm'}
                  </button>
                )}
              </div>

              {/* Recording Status Indicator */}
              {isRecording && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <p className="text-gray-600">Đang ghi âm...</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            {(transcribed || score !== null) && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-gray-800">📊 Kết quả</h3>
                
                {transcribed && (
                  <div>
                    <p className="text-sm text-gray-600">Hệ thống nhận được:</p>
                    <p className="text-lg font-semibold text-gray-800">{transcribed}</p>
                  </div>
                )}
                
                {score !== null && (
                  <div>
                    <p className="text-sm text-gray-600">Độ chính xác:</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full transition-all ${
                              score >= 80 ? 'bg-green-600' :
                              score >= 50 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{score}%</p>
                    </div>
                  </div>
                )}
                
                {/* Next Word Button */}
                <button
                  onClick={nextWord}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-4"
                >
                  ➡️ Từ tiếp theo
                </button>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-gray-100 px-8 py-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Trạng thái hệ thống:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mic:</span>
                <span className={`ml-2 font-bold ${isRecording ? 'text-red-600' : 'text-green-600'}`}>
                  {isRecording ? '🔴 Ghi âm' : '✅ Sẵn sàng'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">TTS:</span>
                <span className={`ml-2 font-bold ${isPlaying ? 'text-blue-600' : 'text-green-600'}`}>
                  {isPlaying ? '🔊 Phát' : '✅ Sẵn sàng'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Kết quả:</span>
                <span className="ml-2 font-bold text-gray-700">{score !== null ? '✅ Có' : '⭕ Chưa'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 text-gray-100 rounded-lg p-4 font-mono text-xs">
          <p className="text-gray-400 mb-2"> Thông tin debug (F12 để xem chi tiết):</p>
          <ul className="space-y-1">
            <li>🌐 Frontend: http://localhost:3000/pronunciation</li>
            <li>🖥️ Backend TTS: http://localhost:5000/api/pronunciation/tts</li>
            <li>🖥️ Backend Transcribe: http://localhost:5000/api/pronunciation/transcribe</li>
            <li>🧠 Flask: http://localhost:5001</li>
            <li>📸 Nhấn F12 → Console để xem logs</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
