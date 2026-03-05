import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Mic, Square, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    setTranscription('');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Call backend transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await response.json();
      setTranscription(data.text);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.text);
      }
    } catch (err) {
      setError('Transcription failed. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob, onTranscriptionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setRecordingTime(0);
    setError(null);
  };

  return (
    <Card className="border-slate-200/80 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary-500" />
          Voice Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary-500 hover:bg-primary-600'
              } text-white shadow-lg`}
            >
              {isRecording ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-slate-900">
              {isRecording ? 'Recording...' : audioBlob ? 'Recording complete' : 'Click to record'}
            </p>
            {isRecording && (
              <p className="text-2xl font-mono font-bold text-red-500 mt-1">
                {formatTime(recordingTime)}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Audio Preview */}
        {audioUrl && !isRecording && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <audio src={audioUrl} controls className="w-full" />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="flex-1"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Transcribe with AI
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={resetRecording}
                disabled={isTranscribing}
              >
                Record Again
              </Button>
            </div>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Transcription Complete</span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{transcription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
