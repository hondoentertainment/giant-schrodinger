import React, { useState } from 'react';

const CALIBRATION_EXAMPLES = [
  {
    conceptLeft: 'Coffee Machine',
    conceptRight: 'Alarm Clock',
    submission: 'Both ruin your morning in different ways',
    aiScore: 7,
    explanation: 'Solid wit with relatable humor. Logic is clear — both are morning nuisances. Originality is decent but not exceptional.',
  },
  {
    conceptLeft: 'Library',
    conceptRight: 'Ocean',
    submission: 'Endless depth that most people only skim the surface of',
    aiScore: 9,
    explanation: 'Clever metaphor that works on multiple levels. High wit, strong logic, very original, crystal clear.',
  },
  {
    conceptLeft: 'Pizza',
    conceptRight: 'Homework',
    submission: 'They are both things',
    aiScore: 2,
    explanation: 'No real connection attempted. Lacks wit, logic, originality, and specificity.',
  },
];

const PASSING_THRESHOLD = 2;

export function JudgeCalibration({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userScore, setUserScore] = useState('');
  const [feedback, setFeedback] = useState(null); // { passed, diff }
  const [passedCount, setPassedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const example = CALIBRATION_EXAMPLES[currentIndex];

  const handleSubmitScore = (e) => {
    e.preventDefault();
    const score = Number(userScore);
    if (!Number.isFinite(score) || score < 1 || score > 10) return;

    const diff = Math.abs(score - example.aiScore);
    const passed = diff <= PASSING_THRESHOLD;

    if (passed) {
      setPassedCount((c) => c + 1);
    }

    setFeedback({ passed, diff, userScore: score, aiScore: example.aiScore });
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= CALIBRATION_EXAMPLES.length) {
      const totalPassed = passedCount;
      if (totalPassed >= CALIBRATION_EXAMPLES.length - 1) {
        // Passed calibration (allow at most 1 miss)
        localStorage.setItem('venn_judge_calibrated', 'true');
        setFinished(true);
      } else {
        // Failed — restart
        setCurrentIndex(0);
        setPassedCount(0);
        setFeedback(null);
        setUserScore('');
      }
    } else {
      setCurrentIndex(nextIndex);
      setFeedback(null);
      setUserScore('');
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-3xl font-display font-bold text-white mb-2">Calibration Complete!</h2>
        <p className="text-white/60 mb-6">You are now a Certified Judge.</p>
        <button
          onClick={() => onComplete?.()}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]"
        >
          Start Judging
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center animate-in fade-in duration-700 px-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-1">Judge Calibration</h2>
        <p className="text-white/60 text-sm">
          Score each example. Get within ±{PASSING_THRESHOLD} of the AI score to pass.
        </p>
        <div className="text-white/40 text-xs mt-2">
          Example {currentIndex + 1} of {CALIBRATION_EXAMPLES.length}
        </div>
      </div>

      <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 mb-4">
        <div className="flex justify-between text-sm text-white/50 mb-2">
          <span>{example.conceptLeft}</span>
          <span>{example.conceptRight}</span>
        </div>
        <p className="text-xl font-bold text-white text-center my-4">
          &ldquo;{example.submission}&rdquo;
        </p>
      </div>

      {!feedback ? (
        <form onSubmit={handleSubmitScore} className="w-full space-y-4">
          <div>
            <label htmlFor="judge-calibration-score" className="block text-sm font-medium text-white/60 mb-2">Your Score (1-10)</label>
            <input
              id="judge-calibration-score"
              type="number"
              min="1"
              max="10"
              value={userScore}
              onChange={(e) => setUserScore(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Enter your score..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-bold rounded-full hover:scale-[1.01] transition-transform"
          >
            Submit Score
          </button>
        </form>
      ) : (
        <div className="w-full space-y-4 animate-in fade-in duration-300">
          <div
            className={`w-full p-4 rounded-xl border text-center ${
              feedback.passed
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="text-2xl mb-1">{feedback.passed ? '✅' : '❌'}</div>
            <div className={`font-bold ${feedback.passed ? 'text-green-300' : 'text-red-300'}`}>
              {feedback.passed ? 'Close enough!' : 'Too far off'}
            </div>
            <div className="text-white/60 text-sm mt-1">
              Your score: {feedback.userScore} | AI score: {feedback.aiScore} (diff: {feedback.diff})
            </div>
          </div>

          <div className="w-full p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-purple-300 text-sm font-semibold mb-1">AI Explanation</div>
            <div className="text-white/60 text-sm">{example.explanation}</div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3 bg-white text-black font-bold rounded-full hover:scale-[1.01] transition-transform"
          >
            {currentIndex + 1 >= CALIBRATION_EXAMPLES.length ? 'Finish' : 'Next Example'}
          </button>
        </div>
      )}
    </div>
  );
}
