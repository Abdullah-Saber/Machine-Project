// Chatbot-UI/script.js
const { useState, useEffect, useRef } = React;

// Scientific symbols for background
const scientificSymbols = [
    'N', 'β', 'Ω', 'O₂', 'W', '°C', 'tan(θ)', 'H₂', 'e^x', 'J', 'x²⁰',
    '∑', '∫', '∂', '∆', '∇', '∞', 'π', 'α', 'γ', 'θ', 'λ', 'μ', 'σ',
    '√', '∛', '≤', '≥', '≠', '≈', '≡', '∝', '∴', '∵', '∠', '⊥', '∥',
    'CO₂', 'H₂O', 'NaCl', 'CH₄', 'NH₃', 'Fe²⁺', 'Ca²⁺', 'SO₄²⁻'
];

// Floating background symbols component
const FloatingSymbols = () => {
    const [symbols, setSymbols] = useState([]);

    useEffect(() => {
        const createSymbol = () => ({
            id: Math.random(),
            symbol: scientificSymbols[Math.floor(Math.random() * scientificSymbols.length)],
            left: Math.random() * 100,
            animationDelay: Math.random() * 20,
            fontSize: Math.random() * 1.5 + 1.5,
            duration: Math.random() * 10 + 15
        });

        const initialSymbols = Array.from({ length: 50 }, createSymbol);
        setSymbols(initialSymbols);

        const interval = setInterval(() => {
            setSymbols(prev => {
                const newSymbol = createSymbol();
                const updatedSymbols = [...prev, newSymbol];
                return updatedSymbols.slice(-60);
            });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-symbols">
            {symbols.map(symbol => (
                <div
                    key={symbol.id}
                    className="floating-symbol"
                    style={{
                        left: `${symbol.left}%`,
                        animationDelay: `${symbol.animationDelay}s`,
                        fontSize: `${symbol.fontSize}rem`,
                        animationDuration: `${symbol.duration}s`
                    }}
                >
                    {symbol.symbol}
                </div>
            ))}
        </div>
    );
};

// Interactive SVG Character
const InteractiveSVGCharacter = ({ className }) => {
    return (
        <svg viewBox="0 0 100 100" className={className || "ai-avatar-svg"}>
            <circle cx="50" cy="50" r="40" fill="#4285f4" />
            <circle cx="40" cy="40" r="5" fill="white" />
            <circle cx="60" cy="40" r="5" fill="white" />
            <path d="M40 60 Q50 70 60 60" stroke="white" strokeWidth="3" fill="transparent" />
        </svg>
    );
};

// Message component
const Message = ({ message, isUser }) => (
    <div className={`message ${isUser ? 'user' : 'ai'}`}>
        <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
            {isUser ? 'You' : <InteractiveSVGCharacter />}
        </div>
        <div className="message-content">
            {message}
        </div>
    </div>
);

// Typing indicator component
const TypingIndicator = () => (
    <div className="typing-indicator">
        <div className="message-avatar ai">
            <InteractiveSVGCharacter />
        </div>
        <div className="typing-content">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
        </div>
    </div>
);

// Main App Component
const STEMTutorApp = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            content: "Hey! How can I help you today? 😊",
            isUser: false
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [detectedEmotion, setDetectedEmotion] = useState(null);
    const [emotionContext, setEmotionContext] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');
    const [cameraError, setCameraError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [backgroundBlur, setBackgroundBlur] = useState(false);
    const [virtualBackground, setVirtualBackground] = useState('none');
    const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
    
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const predictionIntervalRef = useRef(null);
    const recognitionRef = useRef(null);
    const isRecordingRef = useRef(isRecording);

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    // Debug function to check video element
    const debugVideoRef = () => {
        console.log("Video ref debug:", {
            videoRef: videoRef.current,
            isCameraOn: isCameraOn,
            videoElement: document.querySelector('video'),
            videoInDOM: !!document.querySelector('.video-feed')
        });
    };

    // Force re-render when camera state changes to ensure video element is available
    useEffect(() => {
        if (isCameraOn) {
            console.log("Camera turned on, checking video element in next tick...");
            setTimeout(() => {
                debugVideoRef();
            }, 50);
        }
    }, [isCameraOn]);

    // Check server status on component mount
    useEffect(() => {
        checkServerStatus();
    }, []);

    const checkServerStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/health', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setServerStatus('online');
                console.log('Server status:', data);
            } else {
                setServerStatus('offline');
            }
        } catch (error) {
            console.error('Server status check failed:', error);
            setServerStatus('offline');
        }
    };

    const fetchEmotionContext = async () => {
        if (serverStatus !== 'online') return;
        
        try {
            const response = await fetch('http://localhost:8000/emotion_context', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setEmotionContext(data);
                console.log('Emotion context:', data);
            }
        } catch (error) {
            console.error('Failed to fetch emotion context:', error);
        }
    };

    const toggleBackgroundBlur = () => {
        setBackgroundBlur(!backgroundBlur);
    };

    const backgroundOptions = [
        { id: 'none', name: 'None', icon: '📷' },
        { id: 'blur', name: 'Blur', icon: '🌫️' },
        { id: 'green', name: 'Green Fabric', icon: '🟢' },
        { id: 'blue', name: 'Blue', icon: '🔵' },
        { id: 'white', name: 'White', icon: '⚪' },
        { id: 'black', name: 'Black', icon: '⚫' },
        { id: 'gradient', name: 'Gradient', icon: '🌈' },
        { id: 'office', name: 'Office', icon: '🏢' },
        { id: 'nature', name: 'Nature', icon: '🌿' }
    ];

    const changeVirtualBackground = (backgroundId) => {
        setVirtualBackground(backgroundId);
        setShowBackgroundOptions(false);
        
        // If blur is selected, enable blur instead of virtual background
        if (backgroundId === 'blur') {
            setBackgroundBlur(true);
            setVirtualBackground('none');
        } else {
            setBackgroundBlur(false);
        }
    };

    const toggleBackgroundOptions = () => {
        setShowBackgroundOptions(!showBackgroundOptions);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInputValue(prev => prev + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                if (isRecordingRef.current) {
                    recognitionRef.current.start();
                }
            };
        }
    }, []);

    const generateAIResponse = async (userMessage) => {
        // Get emotion context if available
        let emotionAwareResponse = "";
        if (emotionContext && emotionContext.has_emotion) {
            const emotion = emotionContext.emotion;
            const suggestions = emotionContext.suggestions;
            
            // Add emotion-aware prefix
            switch (emotion.toLowerCase()) {
                case 'happy':
                    emotionAwareResponse = "I can see you're feeling positive! 😊 ";
                    break;
                case 'sad':
                    emotionAwareResponse = "I notice you might be feeling a bit down. Don't worry, I'm here to help! 💙 ";
                    break;
                case 'angry':
                    emotionAwareResponse = "I can see you might be frustrated. Let's work through this together step by step. 🤝 ";
                    break;
                case 'surprised':
                    emotionAwareResponse = "Wow! I can see that surprised you! 🤯 ";
                    break;
                case 'fearful':
                    emotionAwareResponse = "I understand this might seem challenging, but we'll take it one step at a time. You've got this! 💪 ";
                    break;
                case 'disgusted':
                    emotionAwareResponse = "I can see this topic might not be your favorite. Let's try a different approach! 🔄 ";
                    break;
                default:
                    emotionAwareResponse = "";
            }
        }

        const responses = [
            "That's an interesting question! Could you provide more details about what you're studying in STEM, so I can give you the best help?",
            "Great question! Let me break this down for you step by step.",
            "I'd be happy to help you with that! Can you tell me more about the specific concept you're working on?",
            "Excellent! This is a fundamental concept in STEM. Let me explain it in a way that's easy to understand.",
            "Perfect question for learning! Let's explore this topic together."
        ];
        
        let baseResponse = "";
        
        if (userMessage.toLowerCase().includes('math') || userMessage.toLowerCase().includes('equation')) {
            baseResponse = "Math is fascinating! What specific mathematical concept would you like to explore? I can help with algebra, calculus, geometry, statistics, and more.";
        } else if (userMessage.toLowerCase().includes('science') || userMessage.toLowerCase().includes('chemistry') || userMessage.toLowerCase().includes('physics')) {
            baseResponse = "Science is amazing! Whether it's physics, chemistry, biology, or earth science, I'm here to help you understand the concepts. What are you curious about?";
        } else if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming')) {
            baseResponse = "Programming is a powerful skill! I can help you with various programming languages, algorithms, data structures, and computer science concepts. What would you like to learn?";
        } else {
            baseResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        
        return emotionAwareResponse + baseResponse;
    };

    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            const userMessage = {
                id: Date.now(),
                content: inputValue,
                isUser: true
            };

            setMessages(prev => [...prev, userMessage]);
            const currentInput = inputValue;
            setInputValue('');
            setIsTyping(true);

            // Get emotion context before generating response
            await fetchEmotionContext();

            setTimeout(async () => {
                const aiResponse = {
                    id: Date.now() + 1,
                    content: await generateAIResponse(currentInput),
                    isUser: false
                };
                setMessages(prev => [...prev, aiResponse]);
                setIsTyping(false);
            }, 1500 + Math.random() * 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        } else {
            setIsRecording(true);
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
        }
    };

    const captureAndPredictEmotion = async () => {
        if (isProcessing) {
            console.log("Already processing, skipping...");
            return;
        }

        if (!videoRef.current || serverStatus !== 'online') {
            console.log("Video ref or server not available");
            return;
        }

        // Wait for video to be ready
        if (videoRef.current.readyState < 3) { // HAVE_FUTURE_DATA
            console.log("Video not ready yet, state:", videoRef.current.readyState);
            return;
        }

        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.log('Video dimensions not set yet');
            return;
        }

        setIsProcessing(true);

        try {
            console.log("Starting emotion capture...");
            
            // Create canvas with proper dimensions
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            
            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            
            // Draw the current video frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            console.log(`Canvas created: ${canvas.width}x${canvas.height}`);

            // Convert canvas to blob
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });

            if (!blob) {
                throw new Error('Failed to create image blob');
            }
            
            console.log(`Sending ${blob.size} byte image to server...`);
            
            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('http://localhost:8000/recognize_emotion', {
                method: 'POST',
                mode: 'cors',
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("Emotion detection response:", data);
            
            if (data.status === 'success') {
                if (data.detections > 0) {
                    const confidence = Math.round(data.confidence * 100);
                    setDetectedEmotion(`${data.emotion} (${confidence}%)`);
                    setCameraError(null);
                    
                    // Fetch emotion context after successful detection
                    setTimeout(() => {
                        fetchEmotionContext();
                    }, 500);
                } else {
                    setDetectedEmotion('No face detected');
                }
            } else {
                setDetectedEmotion('Detection failed');
            }
            
        } catch (error) {
            console.error('Emotion detection error:', error);
            if (error.name === 'AbortError') {
                setCameraError('Request timeout');
                setDetectedEmotion('Timeout');
            } else {
                setCameraError(error.message);
                setDetectedEmotion('Error');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCameraToggle = async () => {
        if (isCameraOn) {
            // Stop camera
            console.log("Stopping camera...");
            
            if (predictionIntervalRef.current) {
                clearInterval(predictionIntervalRef.current);
                predictionIntervalRef.current = null;
            }
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped track: ${track.kind}`);
                });
                streamRef.current = null;
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
            setIsCameraOn(false);
            setDetectedEmotion(null);
            setCameraError(null);
            setIsProcessing(false);
            
        } else {
            // Start camera
            if (serverStatus !== 'online') {
                alert('Emotion recognition server is offline. Please start the backend server first.');
                return;
            }

            console.log("Starting camera...");
            setCameraError(null);

            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('Camera API not supported in this browser');
                }

                // Wait a bit for the video element to be available
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!videoRef.current) {
                    throw new Error('Video element not available - please try again');
                }

                const constraints = {
                    video: {
                        width: { ideal: 640, max: 1280 },
                        height: { ideal: 480, max: 720 },
                        facingMode: 'user',
                        frameRate: { ideal: 15, max: 30 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                
                // Set up video event handlers
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    videoRef.current.play().catch(error => {
                        console.error('Error playing video:', error);
                        setCameraError('Failed to play video stream');
                    });
                };
                
                videoRef.current.oncanplay = () => {
                    console.log('Video can start playing');
                    setIsCameraOn(true);
                    
                    // Start emotion detection after a short delay
                    setTimeout(() => {
                        if (videoRef.current && streamRef.current) {
                            console.log("Starting emotion detection interval...");
                            predictionIntervalRef.current = setInterval(captureAndPredictEmotion, 3000);
                            // Also run immediately
                            setTimeout(captureAndPredictEmotion, 1000);
                        }
                    }, 1000);
                };

                videoRef.current.onerror = (error) => {
                    console.error('Video error:', error);
                    setCameraError('Video playback error');
                };

            } catch (error) {
                console.error("Camera startup error:", error);
                setCameraError(error.message);
                
                // Cleanup on error
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                setIsCameraOn(false);
            }
        }
    };

    return (
        <>
            <FloatingSymbols />
            {/* Always render video element, but hide when camera is off */}
            <div className={`video-overlay ${isCameraOn ? 'active' : 'hidden'}`}>
                <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    className={`video-feed ${backgroundBlur ? 'blur-background' : ''} ${virtualBackground !== 'none' ? `virtual-bg-${virtualBackground}` : ''}`}
                    autoPlay
                />
                <div className="camera-status">
                    {!isCameraOn && (
                        <div className="camera-placeholder">
                            📹 Camera Off
                        </div>
                    )}
                    {isCameraOn && (
                        <div className="camera-controls">
                            <button 
                                className={`background-toggle ${virtualBackground !== 'none' || backgroundBlur ? 'active' : ''}`}
                                onClick={toggleBackgroundOptions}
                                title="Change background"
                            >
                                {virtualBackground === 'blur' || backgroundBlur ? '🌫️' : 
                                 virtualBackground === 'green' ? '🟢' :
                                 virtualBackground === 'blue' ? '🔵' :
                                 virtualBackground === 'white' ? '⚪' :
                                 virtualBackground === 'black' ? '⚫' :
                                 virtualBackground === 'gradient' ? '🌈' :
                                 virtualBackground === 'office' ? '🏢' :
                                 virtualBackground === 'nature' ? '🌿' : '📷'}
                            </button>
                            {(virtualBackground !== 'none' || backgroundBlur) && (
                                <div className="privacy-indicator">
                                    🔒 {backgroundBlur ? 'Privacy Mode' : 'Virtual Background'}
                                </div>
                            )}
                        </div>
                    )}
                    {isProcessing && (
                        <div className="processing-indicator">Processing...</div>
                    )}
                    {detectedEmotion && !isProcessing && (
                        <div className="emotion-display">
                            Emotion: <span className="emotion-text">{detectedEmotion}</span>
                            {emotionContext && emotionContext.has_emotion && (
                                <div className="emotion-context">
                                    <small>{emotionContext.context}</small>
                                </div>
                            )}
                        </div>
                    )}
                    {cameraError && (
                        <div className="error-display">
                            Error: {cameraError}
                        </div>
                    )}
                </div>
            </div>

            {/* Background Options Dropdown */}
            {showBackgroundOptions && isCameraOn && (
                <div className="background-options">
                    <div className="background-options-header">
                        <span>Choose Background</span>
                        <button 
                            className="close-options" 
                            onClick={() => setShowBackgroundOptions(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="background-grid">
                        {backgroundOptions.map(option => (
                            <button
                                key={option.id}
                                className={`background-option ${virtualBackground === option.id || (option.id === 'blur' && backgroundBlur) ? 'selected' : ''}`}
                                onClick={() => changeVirtualBackground(option.id)}
                                title={option.name}
                            >
                                <span className="background-icon">{option.icon}</span>
                                <span className="background-name">{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="app-container">
                <header className="header">
                    <div className="header-icon">S</div>
                    <div className="header-title">STEM Tutor</div>
                    <div className={`server-status ${serverStatus}`}>
                        {serverStatus === 'online' ? '✅ Server Online' : '⌛ Server Offline'}
                    </div>
                </header>

                <div className="chat-container">
                    <div className="messages-area">
                        {messages.map(message => (
                            <Message
                                key={message.id}
                                message={message.content}
                                isUser={message.isUser}
                            />
                        ))}
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="input-area">
                        <div className="input-container">
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={isRecording ? "Listening..." : "Ask anything about STEM..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isTyping}
                                />
                                <div className="input-buttons">
                                    <button
                                        className={`input-button camera-button ${isCameraOn ? 'cam-active' : ''}`}
                                        onClick={handleCameraToggle}
                                        aria-label="Toggle camera"
                                        disabled={isTyping || isRecording}
                                        title={serverStatus === 'offline' ? 'Server offline - Emotion detection unavailable' : 'Toggle camera for emotion detection'}
                                    >
                                        <svg className="icon" viewBox="0 0 24 24">
                                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8zm-6-1h2v-2h-2v2z"/>
                                        </svg>
                                    </button>
                                    <button
                                        className={`input-button ${isRecording ? 'mic-active' : ''}`}
                                        onClick={toggleRecording}
                                        aria-label="Voice input"
                                        disabled={isTyping || isCameraOn}
                                    >
                                        <svg className="icon" viewBox="0 0 24 24">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                                        </svg>
                                    </button>
                                    <button
                                        className="input-button send"
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        aria-label="Send message"
                                    >
                                        <svg className="icon" viewBox="0 0 24 24">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<STEMTutorApp />);