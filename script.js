// Quiz Application
class SpeechQuiz {
    constructor() {
        this.currentQuestion = 0;
        this.questions = [
            {
                type: 'pronunciation',
                content: 'Hello',
                instruction: 'Please read the following word aloud:',
                fullInstruction: 'Click the record button and speak clearly into your microphone.'
            },
            {
                type: 'pronunciation',
                content: 'Beautiful',
                instruction: 'Please read the following word aloud:',
                fullInstruction: 'Click the record button and speak clearly into your microphone.'
            },
            {
                type: 'sentence',
                content: 'The quick brown fox jumps over the lazy dog.',
                instruction: 'Please read the following sentence aloud:',
                fullInstruction: 'Click the record button and speak clearly into your microphone.'
            },
            {
                type: 'fluency',
                content: 'Tell me about your favorite hobby.',
                instruction: 'Please speak for 30 seconds about:',
                fullInstruction: 'Click the record button and speak for about 30 seconds. Don\'t worry about being perfect, just speak naturally.'
            },
            {
                type: 'task',
                content: 'Describe what you see in this picture.',
                instruction: 'Please describe what you see:',
                fullInstruction: 'Click the record button and describe what you see in detail. Speak for at least 20 seconds.'
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
            questionContent: document.getElementById('questionContent'),
            wordToPronounce: document.getElementById('wordToPronounce'),
            instructions: document.getElementById('instructions'),
            recordBtn: document.getElementById('recordBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            audioPlayback: document.getElementById('audioPlayback'),
            audioPlayer: document.getElementById('audioPlayer'),
            playBtn: document.getElementById('playBtn'),
            feedbackArea: document.getElementById('feedbackArea'),
            pronunciationScore: document.getElementById('pronunciationScore'),
            fluencyScore: document.getElementById('fluencyScore'),
            feedbackText: document.getElementById('feedbackText'),
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
        this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.elements.playBtn.addEventListener('click', () => this.playRecording());
        this.elements.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.submitBtn.addEventListener('click', () => this.submitQuiz());
        this.elements.restartBtn.addEventListener('click', () => this.restartQuiz());
    }

    updateDisplay() {
        const question = this.questions[this.currentQuestion];
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.currentQuestion.textContent = this.currentQuestion + 1;
        this.elements.totalQuestions.textContent = this.questions.length;
        
        this.elements.questionType.textContent = this.getQuestionTypeLabel(question.type);
        this.elements.questionContent.innerHTML = `
            <h2>${question.instruction}</h2>
            <div class="word-to-pronounce" id="wordToPronounce">${question.content}</div>
        `;
        this.elements.instructions.textContent = question.fullInstruction;
        
        // Update navigation buttons
        this.elements.prevBtn.disabled = this.currentQuestion === 0;
        
        if (this.currentQuestion === this.questions.length - 1) {
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

    getQuestionTypeLabel(type) {
        const labels = {
            'pronunciation': 'Pronunciation',
            'sentence': 'Sentence Reading',
            'fluency': 'Fluency',
            'task': 'Task Achievement'
        };
        return labels[type] || 'Question';
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
        // Simulate scoring (in a real app, this would be done by a speech recognition API)
        const pronunciationScore = Math.floor(Math.random() * 30) + 70; // 70-100
        const fluencyScore = Math.floor(Math.random() * 30) + 70; // 70-100
        
        this.scores[this.currentQuestion] = { pronunciation: pronunciationScore, fluency: fluencyScore };
        
        this.elements.pronunciationScore.textContent = `${pronunciationScore}%`;
        this.elements.fluencyScore.textContent = `${fluencyScore}%`;
        
        let feedbackText = '';
        if (pronunciationScore >= 90) {
            feedbackText = 'Excellent pronunciation! Very clear and accurate.';
        } else if (pronunciationScore >= 80) {
            feedbackText = 'Good pronunciation! Just a few minor areas to improve.';
        } else if (pronunciationScore >= 70) {
            feedbackText = 'Fair pronunciation. Practice the difficult sounds more.';
        } else {
            feedbackText = 'Keep practicing! Focus on clear pronunciation.';
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
        if (this.currentQuestion < this.questions.length - 1) {
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
        
        const avgPronunciation = this.scores.reduce((sum, score) => sum + score.pronunciation, 0) / this.scores.length;
        const avgFluency = this.scores.reduce((sum, score) => sum + score.fluency, 0) / this.scores.length;
        const overallScore = Math.round((avgPronunciation + avgFluency) / 2);
        
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
        const recommendations = this.generateRecommendations(overallScore, avgPronunciation, avgFluency);
        this.elements.recommendations.innerHTML = `
            <h3>Recommendations</h3>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }

    generateRecommendations(overall, pronunciation, fluency) {
        const recommendations = [];
        
        if (pronunciation < 80) {
            recommendations.push('Practice pronunciation of difficult sounds');
            recommendations.push('Record yourself and compare with native speakers');
        }
        
        if (fluency < 80) {
            recommendations.push('Work on speaking fluency and pace');
            recommendations.push('Practice speaking for longer periods without pauses');
        }
        
        if (overall < 70) {
            recommendations.push('Consider taking structured speaking lessons');
            recommendations.push('Practice daily with speaking exercises');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Continue practicing to maintain your excellent level');
            recommendations.push('Try more challenging speaking tasks');
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

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeechQuiz();
});
