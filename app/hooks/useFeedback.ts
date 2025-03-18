import { useState } from 'react';
import { FeedbackData } from '../types/index';

/**
 * Custom hook to manage user feedback functionality
 * @returns Object containing feedback state and functions
 */
export default function useFeedback() {
  // State to control feedback form visibility
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);

  // State to store feedback data
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: null,
    comment: ''
  });

  /**
   * Opens the feedback form
   */
  const openFeedbackForm = () => {
    setShowFeedbackForm(true);
  };

  /**
   * Closes the feedback form and resets feedback data
   */
  const closeFeedbackForm = () => {
    setShowFeedbackForm(false);
    setFeedback({
      rating: null,
      comment: ''
    });
  };

  /**
   * Submits user feedback
   * This can be extended to send feedback to an API endpoint
   */
  const submitFeedback = async () => {
    try {
      // Log feedback for now - in a real implementation, this would send to an API
      console.log('Feedback submitted:', feedback);

      // Here you would typically make an API call to submit the feedback
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedback)
      // });

      // Close the form after successful submission
      closeFeedbackForm();

      // You could add a success notification here

      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You could add error handling here
      return false;
    }
  };

  return {
    showFeedbackForm,
    feedback,
    setFeedback,
    openFeedbackForm,
    closeFeedbackForm,
    submitFeedback
  };
}
