// Japanese Pitch Accent Trainer
class JapanesePitchTrainer {
    constructor() {
        this.currentQuestion = 0;
        this.lessons = [
            {
                id: 'bridge-crossing',
                type: 'pitch-accent',
                phrase: '橋を渡る',
                pitchPattern: 'HLLL',
                meaning: '橋を渡る (cross the bridge)',
                exampleSentence: '橋を渡る。（はし[HL] を わたる）— "cross the bridge."',
                instruction: 'Practice the phrase 橋を渡る with correct pitch pattern',
                fullInstruction: 'Listen to the correct pronunciation, then record yourself saying the phrase with the correct pitch pattern.'
            },
            {
                id: 'rain-beautiful',
                type: 'pitch-accent',
                phrase: '雨の音が美しい',
                pitchPattern: 'LLLLHHH',
                meaning: '雨の音が美しい (the rain sounds beautiful)',
                exampleSentence: '雨の音が美しい。（あめ[LH] の おと が うつくしい）— "the rain sounds beautiful."',
                instruction: 'Practice the phrase 雨の音が美しい with correct pitch pattern',
                fullInstruction: 'Focus on the pitch pattern for this beautiful phrase about rain.'
            },
            {
                id: 'hospital-visit',
                type: 'vowel-contrast',
                phrase: 'びょういんに行く',
                pitchPattern: 'LHHHLLL',
                meaning: 'びょういんに行く (go to the hospital)',
                exampleSentence: 'びょういんに行く。（病院 / byōin に いく）— "go to the hospital."',
                instruction: 'Practice the phrase びょういんに行く with correct vowel length',
                fullInstruction: 'Focus on the long vowel sound in びょういん (hospital).'
            },
            {
                id: 'user-custom',
                type: 'user-input',
                phrase: '[User Input]',
                pitchPattern: 'TBD',
                meaning: 'User provided phrase',
                exampleSentence: 'Please provide your phrase for practice.',
                instruction: 'Practice your chosen phrase',
                fullInstruction: 'Record yourself saying your chosen phrase with the correct pitch pattern.'
            }
        ];
        this.recordings = [];
        this.scores = [];
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recognition = null;
        this.transcription = '';
        this.microphonePermission = null; // null = not checked, true = granted, false = denied
        this.microphoneStream = null;
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.attachEventListeners();
        this.setupCleanup();
        this.updateDisplay();
    }

    initializeElements() {
        this.elements = {
            progressFill: document.getElementById('progressFill'),
            currentQuestion: document.getElementById('currentQuestion'),
            totalQuestions: document.getElementById('totalQuestions'),
            questionType: document.getElementById('questionType'),
            japanesePhrase: document.getElementById('japanesePhrase'),
            pitchPattern: document.getElementById('pitchPattern'),
            meaning: document.getElementById('meaning'),
            exampleSentence: document.getElementById('exampleSentence'),
            instructions: document.getElementById('instructions'),
            playMan1Btn: document.getElementById('playMan1Btn'),
            playLady1Btn: document.getElementById('playLady1Btn'),
            playLady2Btn: document.getElementById('playLady2Btn'),
            recordBtn: document.getElementById('recordBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            transcriptionArea: document.getElementById('transcriptionArea'),
            transcriptionText: document.getElementById('transcriptionText'),
            transcriptionConfidence: document.getElementById('transcriptionConfidence'),
            audioPlayback: document.getElementById('audioPlayback'),
            audioPlayer: document.getElementById('audioPlayer'),
            playBtn: document.getElementById('playBtn'),
            feedbackArea: document.getElementById('feedbackArea'),
            pitchScore: document.getElementById('pitchScore'),
            pronunciationScore: document.getElementById('pronunciationScore'),
            feedbackText: document.getElementById('feedbackText'),
            pitchComparison: document.getElementById('pitchComparison'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            submitBtn: document.getElementById('submitBtn'),
            resultsModal: document.getElementById('resultsModal'),
            overallScore: document.getElementById('overallScore'),
            levelScore: document.getElementById('levelScore'),
            recommendations: document.getElementById('recommendations'),
            restartBtn: document.getElementById('restartBtn')
        };
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'ja-JP'; // Japanese language
            this.recognition.maxAlternatives = 1;
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    attachEventListeners() {
        this.elements.playMan1Btn.addEventListener('click', () => this.playVoice('man1'));
        this.elements.playLady1Btn.addEventListener('click', () => this.playVoice('lady1'));
        this.elements.playLady2Btn.addEventListener('click', () => this.playVoice('lady2'));
        this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.elements.playBtn.addEventListener('click', () => this.playRecording());
        this.elements.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.submitBtn.addEventListener('click', () => this.submitQuiz());
        this.elements.restartBtn.addEventListener('click', () => this.restartQuiz());
    }

    setupCleanup() {
        // Clean up microphone stream when page is unloaded
        window.addEventListener('beforeunload', () => {
            this.cleanupMicrophone();
        });
        
        // Clean up when navigating away from the page
        window.addEventListener('pagehide', () => {
            this.cleanupMicrophone();
        });
    }

    cleanupMicrophone() {
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }
    }

    updateDisplay() {
        const lesson = this.lessons[this.currentQuestion];
        const progress = ((this.currentQuestion + 1) / this.lessons.length) * 100;
        
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.currentQuestion.textContent = this.currentQuestion + 1;
        this.elements.totalQuestions.textContent = this.lessons.length;
        
        this.elements.questionType.textContent = this.getLessonTypeLabel(lesson.type);
        this.elements.japanesePhrase.textContent = lesson.phrase;
        this.elements.meaning.textContent = lesson.meaning;
        this.elements.exampleSentence.textContent = lesson.exampleSentence;
        this.elements.instructions.textContent = lesson.fullInstruction;
        
        // Update pitch visualization
        this.updatePitchVisualization(lesson.pitchPattern);
        
        // Update navigation buttons
        this.elements.prevBtn.disabled = this.currentQuestion === 0;
        
        if (this.currentQuestion === this.lessons.length - 1) {
            this.elements.nextBtn.style.display = 'none';
            this.elements.submitBtn.style.display = 'inline-block';
        } else {
            this.elements.nextBtn.style.display = 'inline-block';
            this.elements.submitBtn.style.display = 'none';
        }
        
        // Hide feedback area initially
        this.elements.feedbackArea.style.display = 'none';
        this.elements.audioPlayback.style.display = 'none';
        this.elements.transcriptionArea.style.display = 'none';
        
        // Reset recording button
        this.elements.recordBtn.innerHTML = `
            <span class="record-icon">🎤</span>
            <span class="record-text">Start Recording</span>
        `;
        this.elements.recordBtn.classList.remove('recording');
        this.elements.recordingStatus.textContent = '';
    }

    getLessonTypeLabel(type) {
        const labels = {
            'pitch-accent': 'Pitch Accent Training',
            'pitch-homophone': 'Pitch Homophone Practice',
            'vowel-contrast': 'Vowel Contrast Training',
            'user-input': 'Custom Phrase Practice'
        };
        return labels[type] || 'Lesson';
    }

    updatePitchVisualization(pattern) {
        const pitchVisualization = this.elements.pitchPattern.querySelector('.pitch-visualization');
        const patternArray = pattern.split('');
        
        // Clear existing pitch bars
        pitchVisualization.innerHTML = '';
        
        // Create new pitch bars based on pattern length
        patternArray.forEach((pitch, index) => {
            const pitchBar = document.createElement('div');
            pitchBar.className = `pitch-bar ${pitch.toLowerCase()}`;
            pitchBar.textContent = pitch;
            pitchBar.id = `pitch${index + 1}`;
            pitchVisualization.appendChild(pitchBar);
        });
    }

    playVoice(voiceType) {
        const lesson = this.lessons[this.currentQuestion];
        const audioPath = `voices/${lesson.id}-${this.getVoiceName(voiceType)}.wav`;
        
        // Create audio element and play
        const audio = new Audio(audioPath);
        
        // Update button to show playing state
        const button = this.elements[`play${this.capitalizeFirst(voiceType)}Btn`];
        const originalContent = button.innerHTML;
        
        button.innerHTML = `
            <span class="voice-icon">${this.getVoiceIcon(voiceType)}</span>
            <span class="voice-text">Playing...</span>
        `;
        button.disabled = true;
        
        audio.onended = () => {
            button.innerHTML = originalContent;
            button.disabled = false;
        };
        
        audio.onerror = () => {
            console.error(`Audio file not found: ${audioPath}`);
            button.innerHTML = originalContent;
            button.disabled = false;
            alert(`Audio file not found: ${audioPath}`);
        };
        
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            button.innerHTML = originalContent;
            button.disabled = false;
        });
    }
    
    getVoiceName(voiceType) {
        const voiceNames = {
            'man1': 'fenrir-man1',
            'lady1': 'zephyr-lady1', 
            'lady2': 'despina-lady2'
        };
        return voiceNames[voiceType] || voiceType;
    }
    
    getVoiceIcon(voiceType) {
        const icons = {
            'man1': '👨',
            'lady1': '👩',
            'lady2': '👩'
        };
        return icons[voiceType] || '🔊';
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async toggleRecording() {
        if (!this.isRecording) {
            // Check microphone permission first
            if (this.microphonePermission === null) {
                await this.checkMicrophonePermission();
            }
            
            if (this.microphonePermission === true) {
                await this.startRecording();
            } else if (this.microphonePermission === false) {
                alert('Microphone access is required to record your pronunciation. Please allow microphone access in your browser settings and refresh the page.');
            }
        } else {
            this.stopRecording();
        }
    }

    async checkMicrophonePermission() {
        try {
            // Request microphone access once
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphonePermission = true;
            console.log('Microphone permission granted');
        } catch (error) {
            console.error('Microphone permission denied:', error);
            this.microphonePermission = false;
        }
    }

    async startRecording() {
        try {
            // Use the already granted stream
            this.mediaRecorder = new MediaRecorder(this.microphoneStream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                this.recordings[this.currentQuestion] = audioUrl;
                
                this.elements.audioPlayer.src = audioUrl;
                this.elements.audioPlayback.style.display = 'block';
                this.showFeedback();
            };
            
            // Start speech recognition if available
            if (this.recognition) {
                this.startSpeechRecognition();
            }
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            this.elements.recordBtn.innerHTML = `
                <span class="record-icon">⏹️</span>
                <span class="record-text">Stop Recording</span>
            `;
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordingStatus.textContent = 'Recording...';
            this.elements.recordingStatus.classList.add('recording');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error starting recording. Please try again.');
        }
    }

    startSpeechRecognition() {
        if (!this.recognition) return;
        
        this.elements.transcriptionArea.style.display = 'block';
        this.elements.transcriptionText.textContent = 'Listening...';
        this.elements.transcriptionConfidence.textContent = '';
        
        this.recognition.onresult = (event) => {
            const result = event.results[0];
            this.transcription = result[0].transcript;
            const confidence = result[0].confidence;
            
            this.elements.transcriptionText.textContent = this.transcription;
            this.elements.transcriptionConfidence.textContent = `Confidence: ${Math.round(confidence * 100)}%`;
            
            // Add visual feedback based on confidence
            if (confidence > 0.8) {
                this.elements.transcriptionText.style.color = '#38a169';
            } else if (confidence > 0.6) {
                this.elements.transcriptionText.style.color = '#d69e2e';
            } else {
                this.elements.transcriptionText.style.color = '#e53e3e';
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.elements.transcriptionText.textContent = 'Speech recognition failed. Please try again.';
            this.elements.transcriptionText.style.color = '#e53e3e';
        };
        
        this.recognition.onend = () => {
            console.log('Speech recognition ended');
        };
        
        this.recognition.start();
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop speech recognition
            if (this.recognition) {
                this.recognition.stop();
            }
            
            this.elements.recordBtn.innerHTML = `
                <span class="record-icon">🎤</span>
                <span class="record-text">Start Recording</span>
            `;
            this.elements.recordBtn.classList.remove('recording');
            this.elements.recordingStatus.textContent = 'Recording saved!';
            this.elements.recordingStatus.classList.remove('recording');
            
            // Don't stop the microphone stream here - keep it for future recordings
            // Only stop individual recording tracks, not the main stream
        }
    }

    playRecording() {
        if (this.elements.audioPlayer.src) {
            this.elements.audioPlayer.play();
        }
    }

    showFeedback() {
        // Simulate pitch accent scoring
        const pitchScore = Math.floor(Math.random() * 30) + 70; // 70-100
        const pronunciationScore = Math.floor(Math.random() * 30) + 70; // 70-100
        
        this.scores[this.currentQuestion] = { pitch: pitchScore, pronunciation: pronunciationScore };
        
        this.elements.pitchScore.textContent = `${pitchScore}%`;
        this.elements.pronunciationScore.textContent = `${pronunciationScore}%`;
        
        let feedbackText = '';
        if (pitchScore >= 90) {
            feedbackText = '素晴らしい！Perfect pitch pattern! Your accent is very natural.';
        } else if (pitchScore >= 80) {
            feedbackText = 'Good job! Your pitch pattern was mostly correct. Try to emphasize the contrast more.';
        } else if (pitchScore >= 70) {
            feedbackText = 'Fair attempt. Focus on the high-low pattern contrast.';
        } else {
            feedbackText = 'Keep practicing! Listen to the correct pronunciation and try again.';
        }
        
        this.elements.feedbackText.textContent = feedbackText;
        this.elements.feedbackArea.style.display = 'block';
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.updateDisplay();
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.lessons.length - 1) {
            this.currentQuestion++;
            this.updateDisplay();
        }
    }

    submitQuiz() {
        this.calculateFinalScore();
        this.showResults();
    }

    calculateFinalScore() {
        if (this.scores.length === 0) return;
        
        const avgPitch = this.scores.reduce((sum, score) => sum + score.pitch, 0) / this.scores.length;
        const avgPronunciation = this.scores.reduce((sum, score) => sum + score.pronunciation, 0) / this.scores.length;
        const overallScore = Math.round((avgPitch + avgPronunciation) / 2);
        
        this.elements.overallScore.textContent = `${overallScore}%`;
        
        let level = '';
        if (overallScore >= 90) {
            level = 'Advanced';
        } else if (overallScore >= 80) {
            level = 'Upper Intermediate';
        } else if (overallScore >= 70) {
            level = 'Intermediate';
        } else if (overallScore >= 60) {
            level = 'Lower Intermediate';
        } else {
            level = 'Beginner';
        }
        
        this.elements.levelScore.textContent = level;
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(overallScore, avgPitch, avgPronunciation);
        this.elements.recommendations.innerHTML = `
            <h3>継続のためのアドバイス (Continued Learning Tips)</h3>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }

    generateRecommendations(overall, pitch, pronunciation) {
        const recommendations = [];
        
        if (pitch < 80) {
            recommendations.push('Practice pitch patterns daily with native speaker recordings');
            recommendations.push('Focus on the high-low contrast in はし (bridge vs chopsticks)');
            recommendations.push('Work on distinguishing あめ (rain vs candy) by pitch alone');
        }
        
        if (pronunciation < 80) {
            recommendations.push('Practice the long vowel difference in びょういん vs びよういん');
            recommendations.push('Record yourself and compare with native speakers');
        }
        
        if (overall < 70) {
            recommendations.push('Consider taking structured Japanese pronunciation lessons');
            recommendations.push('Practice daily with pitch accent exercises');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Continue practicing to maintain your excellent level');
            recommendations.push('Try more challenging pitch accent patterns');
        }
        
        return recommendations;
    }

    showResults() {
        this.elements.resultsModal.style.display = 'flex';
    }

    restartQuiz() {
        this.currentQuestion = 0;
        this.recordings = [];
        this.scores = [];
        this.elements.resultsModal.style.display = 'none';
        this.updateDisplay();
    }
}

// Initialize the Japanese Pitch Trainer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JapanesePitchTrainer();
});
