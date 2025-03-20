"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { FeedbackData, FeedbackRating } from '../../types/index';

interface FeedbackFormProps {
  isDarkMode: boolean;
  feedback: FeedbackData;
  setFeedback: React.Dispatch<React.SetStateAction<FeedbackData>>;
  submitFeedback: () => void;
  closeFeedbackForm: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isDarkMode,
  feedback,
  setFeedback,
  submitFeedback,
  closeFeedbackForm
}) => {
  const handleRatingChange = (rating: number) => {
    setFeedback({ ...feedback, rating: rating as FeedbackRating });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback({ ...feedback, comment: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`mb-6 p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Share Your Feedback</h3>
        <button
          onClick={closeFeedbackForm}
          className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <MdClose size={20} />
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 font-medium">How would you rate your experience?</p>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => handleRatingChange(star)} className="focus:outline-none">
              <FaStar
                size={24}
                className={
                  star <= (feedback.rating || 0)
                    ? 'text-yellow-400'
                    : isDarkMode
                      ? 'text-gray-600'
                      : 'text-gray-300'
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="feedback-comment" className="block mb-2 font-medium">
          Your comments
        </label>
        <textarea
          id="feedback-comment"
          rows={4}
          value={feedback.comment}
          onChange={handleCommentChange}
          placeholder="Tell us what you think..."
          className={`w-full p-3 rounded-md ${isDarkMode
              ? 'bg-gray-700 text-white border-gray-600'
              : 'bg-gray-50 text-gray-900 border-gray-300'
            } border focus:ring-2 focus:ring-blue-500`}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={closeFeedbackForm}
          className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
        >
          Cancel
        </button>
        <button
          onClick={submitFeedback}
          disabled={!feedback.rating}
          className={`px-4 py-2 rounded-md ${!feedback.rating
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          Submit Feedback
        </button>
      </div>
    </motion.div>
  );
};

export default FeedbackForm;
