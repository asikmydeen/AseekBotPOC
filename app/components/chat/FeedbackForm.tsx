"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { FeedbackData, FeedbackRating } from '../../types/index';
import { getFeedbackFormStyles } from '../../styles/chatStyles';

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

  // Get centralized styles
  const styles = getFeedbackFormStyles(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Share Your Feedback</h3>
        <button
          onClick={closeFeedbackForm}
          className={styles.closeButton}
        >
          <MdClose size={20} />
        </button>
      </div>

      <div className={styles.ratingContainer}>
        <p className={styles.ratingLabel}>How would you rate your experience?</p>
        <div className={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => handleRatingChange(star)} className={styles.starButton}>
              <FaStar
                size={24}
                className={
                  star <= (feedback.rating || 0)
                    ? styles.starActive
                    : styles.starInactive
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.commentContainer}>
        <label htmlFor="feedback-comment" className={styles.commentLabel}>
          Your comments
        </label>
        <textarea
          id="feedback-comment"
          rows={4}
          value={feedback.comment}
          onChange={handleCommentChange}
          placeholder="Tell us what you think..."
          className={styles.commentTextarea}
        ></textarea>
      </div>

      <div className={styles.buttonsContainer}>
        <button
          onClick={closeFeedbackForm}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          onClick={submitFeedback}
          disabled={!feedback.rating}
          className={!feedback.rating ? styles.submitButtonDisabled : styles.submitButton}
        >
          Submit Feedback
        </button>
      </div>
    </motion.div>
  );
};

export default FeedbackForm;
