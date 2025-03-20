"use client";
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketDetails, TicketStep } from '../../types/shared';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`mb-6 p-4 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
    >
      <h3 className="text-lg font-semibold mb-4">Create A Ticket</h3>
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
              <div className="mb-4">
                <label htmlFor="ticketTitle" className="block mb-2 text-sm font-medium">
                  Ticket Title
                </label>
                <input
                  type="text"
                  id="ticketTitle"
                  value={String(ticketDetails.title || '')}
                  onChange={handleTitleChange}
                  className={`w-full p-2 rounded-md ${isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                    } border focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter a title for your ticket"
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
              <div className="mb-4">
                <label htmlFor="ticketDescription" className="block mb-2 text-sm font-medium">
                  Ticket Description
                </label>
                <textarea
                  id="ticketDescription"
                  value={ticketDetails.description}
                  onChange={handleDescriptionChange}
                  rows={4}
                  className={`w-full p-2 rounded-md ${isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                    } border focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Describe your request in detail"
                  required
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <div>
            <button
              type="button"
              onClick={closeTicketForm}
              className={`px-4 py-2 rounded-md mr-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
              Cancel
            </button>
            {ticketStep > 0 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                Back
              </button>
            )}
          </div>
          <div>
            {ticketStep === 0 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!String(ticketDetails.title || '').trim()}
                className={`px-4 py-2 rounded-md ${!String(ticketDetails.title || '').trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!(ticketDetails.description && ticketDetails.description.trim())}
                className={`px-4 py-2 rounded-md ${!(ticketDetails.description && ticketDetails.description.trim())
                    ? 'bg-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
              >
                Submit Ticket
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default TicketForm;
