"use client";
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketDetails, TicketStep } from '../../types/shared';
import { CHAT_UI_TEXT } from '../../constants/chatConstants';
import { getTicketFormStyles } from '../../styles/chatStyles';

interface TicketFormProps {
  isDarkMode: boolean;
  ticketDetails: TicketDetails;
  ticketStep: TicketStep;
  setTicketStep: Dispatch<SetStateAction<TicketStep>>;
  setTicketDetails: Dispatch<SetStateAction<TicketDetails>>;
  createTicket: () => Promise<any>;
  closeTicketForm: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({
  isDarkMode,
  ticketDetails,
  ticketStep,
  setTicketStep,
  setTicketDetails,
  createTicket,
  closeTicketForm
}) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketDetails({ ...ticketDetails, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTicketDetails({ ...ticketDetails, description: e.target.value });
  };

  const handleNextStep = () => {
    setTicketStep((prev) => (typeof prev === 'number' ? (prev + 1) as TicketStep : prev));
  };

  const handlePreviousStep = () => {
    setTicketStep((prev) => (typeof prev === 'number' ? (prev - 1) as TicketStep : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket();
  };

  // Ensure title is always a string when the component mounts or ticketDetails changes
  useEffect(() => {
    if (typeof ticketDetails.title !== 'string') {
      setTicketDetails(prev => ({ ...prev, title: String(prev.title || '') }));
    }
  }, [ticketDetails, setTicketDetails]);

  // Get centralized styles
  const styles = getTicketFormStyles(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={styles.container}
    >
      <h3 className={styles.title}>{CHAT_UI_TEXT.TICKET_FORM_TITLE}</h3>
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {ticketStep === 0 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="ticketTitle" className={styles.label}>
                  {CHAT_UI_TEXT.TICKET_FORM_TITLE_LABEL}
                </label>
                <input
                  type="text"
                  id="ticketTitle"
                  value={String(ticketDetails.title || '')}
                  onChange={handleTitleChange}
                  className={styles.input}
                  placeholder={CHAT_UI_TEXT.TICKET_FORM_TITLE_PLACEHOLDER}
                  required
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="ticketDescription" className={styles.label}>
                  {CHAT_UI_TEXT.TICKET_FORM_DESCRIPTION_LABEL}
                </label>
                <textarea
                  id="ticketDescription"
                  value={ticketDetails.description}
                  onChange={handleDescriptionChange}
                  rows={4}
                  className={styles.textarea}
                  placeholder={CHAT_UI_TEXT.TICKET_FORM_DESCRIPTION_PLACEHOLDER}
                  required
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.buttonContainer}>
          <div>
            <button
              type="button"
              onClick={closeTicketForm}
              className={`${styles.buttonSecondary} mr-2`}
            >
              {CHAT_UI_TEXT.TICKET_FORM_CANCEL_BUTTON}
            </button>
            {ticketStep > 0 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className={styles.buttonSecondary}
              >
                {CHAT_UI_TEXT.TICKET_FORM_BACK_BUTTON}
              </button>
            )}
          </div>
          <div>
            {ticketStep === 0 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!String(ticketDetails.title || '').trim()}
                className={!String(ticketDetails.title || '').trim()
                    ? 'bg-gray-500 cursor-not-allowed px-4 py-2 rounded-md text-white'
                    : styles.button
                }
              >
                {CHAT_UI_TEXT.TICKET_FORM_NEXT_BUTTON || 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!(ticketDetails.description && ticketDetails.description.trim())}
                className={!(ticketDetails.description && ticketDetails.description.trim())
                    ? 'bg-gray-500 cursor-not-allowed px-4 py-2 rounded-md text-white'
                    : styles.button
                }
              >
                {CHAT_UI_TEXT.TICKET_FORM_SUBMIT_BUTTON}
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default TicketForm;
