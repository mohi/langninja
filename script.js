// Japanese Pitch Accent Trainer
class JapanesePitchTrainer {
    constructor() {
        this.currentQuestion = 0;
        this.lessons = [
            {
                type: 'pitch-accent',
                phrase: 'はし',
                pitchPattern: 'HL',
                meaning: '橋 (bridge)',
                exampleSentence: '橋を渡る。（はし[HL] を わたる）— "cross the bridge."',
                instruction: 'Practice the HL pitch pattern for 橋 (bridge)',
                fullInstruction: 'Listen to the correct pronunciation, then record yourself saying the phrase with the correct pitch pattern.'
            },
            {
                type: 'pitch-accent',
                phrase: 'はし',
                pitchPattern: 'LH',
                meaning: '箸 (chopsticks)',
                exampleSentence: '箸を渡す。（はし[LH] を わたす）— "hand over the chopsticks."',
                instruction: 'Practice the LH pitch pattern for 箸 (chopsticks)',
                fullInstruction: 'Notice the different pitch pattern from the previous lesson. Record yourself with the LH pattern.'
            },
            {
                type: 'pitch-homophone',
                phrase: 'あめ',
                pitchPattern: 'LH',
                meaning: '雨 (rain)',
                exampleSentence: '雨の音が美しい。（あめ[LH] の おと が うつくしい）— "the rain sounds beautiful."',
                instruction: 'Practice distinguishing 雨 (rain) from 飴 (candy) by pitch',
                fullInstruction: 'This is the LH pattern for rain. The same kana あめ with HL pattern means candy.'
            },
            {
                type: 'pitch-homophone',
                phrase: 'あめ',
                pitchPattern: 'HL',
                meaning: '飴 (candy)',
                exampleSentence: '飴の味が美味しい。（あめ[HL] の あじ が おいしい）— "the candy tastes good."',
                instruction: 'Practice the HL pattern for 飴 (candy)',
                fullInstruction: 'This is the HL pattern for candy. Same kana, different pitch from rain.'
            },
            {
                type: 'vowel-contrast',
                phrase: 'びょういん',
                pitchPattern: 'LHHH',
                meaning: '病院 (hospital)',
                exampleSentence: 'びょういんに行く。（病院 / byōin）— "go to the hospital."',
                instruction: 'Practice the long vowel in びょういん (hospital)',
                fullInstruction: 'Focus on the long vowel sound. This is different from びよういん (beauty salon).'
            },
            {
                type: 'vowel-contrast',
                phrase: 'びよういん',
                pitchPattern: 'LHHH',
                meaning: '美容院 (beauty salon)',
                exampleSentence: 'びよういんに行く。（美容院 / biyōin）— "go to the hair salon."',
                instruction: 'Practice distinguishing from びょういん (hospital)',
                fullInstruction: 'Notice the different vowel length. This is びよういん (beauty salon), not びょういん (hospital).'
            }
        ];
        this.recordings = [];
        this.scores = [];
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        this.initializeElements();
        this.attachEventListeners();
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
            playCorrectBtn: document.getElementById('playCorrectBtn'),
            recordBtn: document.getElementById('recordBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
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

    attachEventListeners() {
        this.elements.playCorrectBtn.addEventListener('click', () => this.playCorrectPronunciation());
        this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.elements.playBtn.addEventListener('click', () => this.playRecording());
        this.elements.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.submitBtn.addEventListener('click', () => this.submitQuiz());
        this.elements.restartBtn.addEventListener('click', () => this.restartQuiz());
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
            'vowel-contrast': 'Vowel Contrast Training'
        };
        return labels[type] || 'Lesson';
    }

    updatePitchVisualization(pattern) {
        const pitchBars = this.elements.pitchPattern.querySelectorAll('.pitch-bar');
        const patternArray = pattern.split('');
        
        // Clear existing classes
        pitchBars.forEach(bar => {
            bar.className = 'pitch-bar';
        });
        
        // Apply pattern classes
        patternArray.forEach((pitch, index) => {
            if (pitchBars[index]) {
                pitchBars[index].classList.add(pitch.toLowerCase());
                pitchBars[index].textContent = pitch;
            }
        });
    }

    playCorrectPronunciation() {
        // In a real app, this would play actual audio
        // For now, we'll simulate with a visual indicator
        this.elements.playCorrectBtn.innerHTML = `
            <span class="audio-icon">🔊</span>
            <span class="audio-text">Playing...</span>
        `;
        
        setTimeout(() => {
            this.elements.playCorrectBtn.innerHTML = `
                <span class="audio-icon">🔊</span>
                <span class="audio-text">Play Correct Pronunciation</span>
            `;
        }, 2000);
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
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
            console.error('Error accessing microphone:', error);
            alert('Please allow microphone access to use this feature.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            this.elements.recordBtn.innerHTML = `
                <span class="record-icon">🎤</span>
                <span class="record-text">Start Recording</span>
            `;
            this.elements.recordBtn.classList.remove('recording');
            this.elements.recordingStatus.textContent = 'Recording saved!';
            this.elements.recordingStatus.classList.remove('recording');
            
            // Stop all tracks to release microphone
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
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
