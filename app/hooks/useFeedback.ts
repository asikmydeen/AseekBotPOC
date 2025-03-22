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
   * Submits user feedback to the API with user identification
   */
  const submitFeedback = async () => {
    try {
      // Include userId with the feedback data
      const feedbackWithUser = {
        ...feedback,
        userId: 'test-user', // Using placeholder userId as required
        timestamp: new Date().toISOString()
      };

      console.log('Submitting feedback:', feedbackWithUser);

      // Make an API call to submit the feedback
      const response = await fetch('/api/recordUserInteraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feedback',
          userId: 'test-user',
          data: feedbackWithUser
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }

      // Close the form after successful submission
      closeFeedbackForm();

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
