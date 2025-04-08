'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          <h3 className={styles.imageDialog.title}>External Image</h3>
          <p className={styles.imageDialog.content}>
            This message contains an image from an external source. Would you like to view it?
          </p>
          <div className={styles.imageDialog.buttons}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={styles.imageDialog.cancelButton}
              onClick={onClose}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={styles.imageDialog.confirmButton}
              onClick={onConfirm}
            >
              View Image
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageDialog;
