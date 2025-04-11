'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAT_UI_TEXT } from '../../constants/chatConstants';

interface ImageDialogProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isDarkMode: boolean;
  styles: any;
}

const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onConfirm,
  isDarkMode,
  styles
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.imageDialog.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={styles.imageDialog.container}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className={styles.imageDialog.title}>{CHAT_UI_TEXT.IMAGE_DIALOG_TITLE}</h3>
          <p className={styles.imageDialog.content}>
            {CHAT_UI_TEXT.IMAGE_DIALOG_CONTENT}
          </p>
          <div className={styles.imageDialog.buttons}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={styles.imageDialog.cancelButton}
              onClick={onClose}
            >
              {CHAT_UI_TEXT.IMAGE_DIALOG_CANCEL}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={styles.imageDialog.confirmButton}
              onClick={onConfirm}
            >
              {CHAT_UI_TEXT.IMAGE_DIALOG_CONFIRM}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageDialog;
