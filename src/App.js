import React, { useState, useEffect } from 'react';
import { Volume2, Check, X, Edit3, Save } from 'lucide-react';

export default function SpellingPracticeApp() {
  const defaultWords = [
    'because', 'different', 'through', 'important', 'enough',
    'science', 'answer', 'question', 'beautiful', 'thought',
    'library', 'necessary', 'probably', 'favorite', 'separate',
    'February', 'Wednesday', 'government', 'believe', 'receive',
    'excellent', 'privilege', 'rhythm', 'occurrence'
  ];

  const [showNext, setShowNext] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [wordListText, setWordListText] = useState(defaultWords.join('\n'));
  const [wordList, setWordList] = useState(defaultWords);
  const [wordProgress, setWordProgress] = useState({});
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Save to localStorage whenever these values change
  useEffect(() => {
    try {
      localStorage.setItem('spellingProgress', JSON.stringify(wordProgress));
    } catch (e) {
      console.log('localStorage not available');
    }
  }, [wordProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('spellingCompleted', completedCount.toString());
    } catch (e) {
      console.log('localStorage not available');
    }
  }, [completedCount]);

  useEffect(() => {
    const progress = { ...wordProgress };
    let needsUpdate = false;
    
    wordList.forEach(word => {
      if (!progress[word]) {
        progress[word] = { correct: 0, incorrect: 0 };
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      setWordProgress(progress);
    }
    
    selectNextWord(progress);
  }, [wordList]);

  const selectNextWord = (progress) => {
    const availableWords = wordList.filter(word => {
      const p = progress[word];
      return p.correct < 1;
    });

    if (availableWords.length === 0) {
      setCurrentWord('');
      return;
    }

    // Create a weighted array where words appear multiple times for better randomization
    const weightedWords = [];
    availableWords.forEach(word => {
      // Add each word 3 times to the pool for better shuffle
      weightedWords.push(word, word, word);
    });
    
    // Shuffle the array
    for (let i = weightedWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weightedWords[i], weightedWords[j]] = [weightedWords[j], weightedWords[i]];
    }
    
    // Pick first word that's different from current
    let randomWord = weightedWords[0];
    for (let word of weightedWords) {
      if (word !== currentWord) {
        randomWord = word;
        break;
      }
    }
    
    setCurrentWord(randomWord);
    setUserInput('');
    setFeedback('');
    setIsCorrect(null);
    setShowNext(false);
  };

  const speakWord = () => {
    if (currentWord && !isSpeaking) {
      setIsSpeaking(true);
      speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(currentWord);
        utterance.rate = 0.8;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }, 150);
    }
  };

  useEffect(() => {
    if (currentWord && !showNext) {
      setIsSpeaking(false);
      const timer = setTimeout(() => {
        speakWord();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentWord, showNext]);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const isAnswerCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase();
    setIsCorrect(isAnswerCorrect);

    const newProgress = { ...wordProgress };
    
    if (isAnswerCorrect) {
      newProgress[currentWord].correct = 1;
      setFeedback('Correct! Great job! 🎉');
      setCompletedCount(prev => prev + 1);
    } else {
      newProgress[currentWord].incorrect += 1;
      setFeedback(`Not quite. The correct spelling is: ${currentWord}`);
    }

    setWordProgress(newProgress);
    setShowNext(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const saveWordList = () => {
    const words = wordListText.split('\n').filter(w => w.trim()).map(w => w.trim());
    if (words.length > 0) {
      setWordList(words);
      setCompletedCount(0);
      setIsEditing(false);
      try {
        localStorage.setItem('spellingWordList', words.join('\n'));
        localStorage.removeItem('spellingProgress');
        localStorage.removeItem('spellingCompleted');
      } catch (e) {
        console.log('localStorage not available');
      }
    }
  };

  const remainingWords = wordList.filter(word => {
    const p = wordProgress[word];
    return !p || p.correct < 1;
  }).length;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Spelling Words</h2>
          <p className="text-gray-600 mb-4">Enter 24 words total: 20 regular words + 4 bonus words (one per line)</p>
          <textarea
            value={wordListText}
            onChange={(e) => setWordListText(e.target.value)}
            className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg font-mono text-lg focus:outline-none focus:border-indigo-500"
            placeholder="Enter words here..."
          />
          <div className="flex gap-4 mt-6">
            <button
              onClick={saveWordList}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              <Save size={20} /> Save Words
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentWord === '' && remainingWords === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
        <div className="max-w-lg bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">All Done!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You've mastered all {wordList.length} spelling words!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              <Edit3 size={20} /> Load New Words
            </button>
            <button
              onClick={() => {
                setCompletedCount(0);
                try {
                  localStorage.removeItem('spellingProgress');
                  localStorage.removeItem('spellingCompleted');
                } catch (e) {
                  console.log('localStorage not available');
                }
                window.location.reload();
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Spelling Practice</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Edit3 size={18} /> Edit Words
            </button>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm font-semibold text-indigo-800">
              <span>Completed: {completedCount}/{wordList.length}</span>
              <span>Remaining: {remainingWords}</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-3 mt-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / wordList.length) * 100}%` }}
              />
            </div>
          </div>

          {currentWord && (
            <>
              <div className="text-center mb-8">
                <button
                  onClick={speakWord}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg text-lg font-semibold"
                >
                  <Volume2 size={28} /> Hear the Word
                </button>
                {wordProgress[currentWord] && (
                  <p className="text-sm text-gray-600 mt-4">
                    Spell correctly once to master this word
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Type the spelling word:
                  </label>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    placeholder="Type here..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoFocus
                    disabled={showNext}
                  />
                </div>

                {!showNext ? (
                  <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xl font-semibold shadow-lg"
                  >
                    Check Spelling
                  </button>
                ) : (
                  <button
                    onClick={() => selectNextWord(wordProgress)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xl font-semibold shadow-lg"
                  >
                    Next Word →
                  </button>
                )}
              </div>

              {feedback && (
                <div className={`mt-6 p-6 rounded-lg flex items-center gap-3 ${
                  isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isCorrect ? <Check size={24} /> : <X size={24} />}
                  <span className="text-lg font-semibold">{feedback}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}