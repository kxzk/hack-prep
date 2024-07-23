document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start_button");
  const endButton = document.getElementById("end_button");
  const conversationContainer = document.getElementById(
    "conversation-container",
  );
  const conversationDiv = document.getElementById("conversation");
  const statusDiv = document.getElementById("status");
  let recognition;
  let synthesis;
  let isListening = false;
  let silenceTimer;
  let isCallActive = false;

  if (
    !startButton ||
    !endButton ||
    !conversationContainer ||
    !conversationDiv ||
    !statusDiv
  ) {
    console.error("One or more required elements are missing from the DOM");
    return;
  }

  startButton.addEventListener("click", startCall);
  endButton.addEventListener("click", endCall);

  let defaultVoice = null;
  let availableVoices = [];

  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    console.log(
      "Available voices:",
      voices.map((v) => `${v.name} (${v.lang})`),
    );

    // Set default voice to Google UK English Female
    defaultVoice = voices.find(
      (voice) =>
        voice.name === "Google UK English Female" && voice.lang === "en-GB",
    );

    // If the specific voice is not found, fall back to other English voices
    if (!defaultVoice) {
      availableVoices = voices.filter((voice) => voice.lang.startsWith("en-"));
      if (availableVoices.length > 0) {
        defaultVoice = availableVoices[0];
      }
    }

    if (defaultVoice) {
      console.log(
        `Default voice set to: ${defaultVoice.name} (${defaultVoice.lang})`,
      );
    } else {
      console.log("Preferred voice not found. Using system default.");
    }
  }

  // Load voices when they are ready
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Initial load attempt
  loadVoices();

  function speak(text, onEndCallback) {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser");
      if (onEndCallback) onEndCallback();
      return;
    }

    if (synthesis) {
      synthesis.cancel();
    }

    synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    if (defaultVoice) {
      utterance.voice = defaultVoice;
    }

    utterance.onend = onEndCallback;

    setTimeout(() => {
      synthesis.speak(utterance);
    }, 0);
  }

  function startCall() {
    isCallActive = true;
    conversationDiv.innerHTML = "";
    conversationContainer.classList.remove("hidden");
    startButton.disabled = true;
    endButton.disabled = false;
    continueConversation();
  }

  function endCall() {
    isCallActive = false;
    if (recognition) {
      recognition.stop();
    }
    if (synthesis) {
      synthesis.cancel();
    }
    startButton.disabled = false;
    endButton.disabled = true;
    conversationContainer.classList.add("hidden");
    statusDiv.textContent =
      'Call ended. Click "Start Call" to start a new conversation.';
  }

  function continueConversation() {
    if (!isCallActive) return;

    addMessage("Agent: What's your question?", "ai");
    speak("What's your question?", () => {
      startListening();
    });
  }

  function startListening() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("Speech recognition is not supported in this browser");
      return;
    }

    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      isListening = true;
      statusDiv.textContent = "Listening...";
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      statusDiv.textContent = interimTranscript;
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognition.onend = () => {
      isListening = false;
      if (finalTranscript) {
        console.log("Final transcript:", finalTranscript); // Logging for debugging
        addMessage(`You: ${finalTranscript}`, "user");
        getAIResponse(finalTranscript);
      } else if (isCallActive) {
        startListening();
      }
    };

    recognition.start();
  }

  function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (isListening) {
        recognition.stop();
      }
    }, 2000);
  }

  async function getAIResponse(userInput) {
    statusDiv.textContent = "Thinking...";
    try {
      console.log("User input sent to AI:", userInput);
      const aiResponse = await simulateAIResponse(userInput);
      console.log("AI response received:", aiResponse);
      statusDiv.textContent = "";

      speak(aiResponse, () => {
        if (isCallActive) {
          startListening();
        }
      });

      addMessage(`Agent: ${aiResponse}`, "ai");
    } catch (error) {
      console.error("Error getting AI response:", error);
      statusDiv.textContent = "Sorry, there was an error. Please try again.";
      if (isCallActive) {
        startListening();
      }
    }
  }

  function simulateAIResponse(userInput) {
    return new Promise((resolve) => {
      const response = `Here's a simulated response to: "${userInput}"`;
      console.log("Simulated response:", response);
      resolve(response);
    });
  }

  function addMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("max-w-[70%]", "p-3", "rounded-2xl", "mb-2");

    if (sender === "ai") {
      messageDiv.classList.add(
        "bg-ios-gray",
        "text-black",
        "mr-auto",
        "rounded-bl-sm",
      );
    } else {
      messageDiv.classList.add(
        "bg-ios-blue",
        "text-white",
        "ml-auto",
        "rounded-br-sm",
      );
    }

    messageDiv.textContent = message;
    conversationDiv.appendChild(messageDiv);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }
});
