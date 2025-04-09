'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import UserThumbnail from '../UserThumbnail';

interface MessageAvatarProps {
  sender: 'user' | 'bot';
  isDarkMode: boolean;
  styles: any;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({
  sender,
  isDarkMode,
  styles
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={styles.avatar.container}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={styles.avatar.inner}
      >
        {sender === 'user' ? (
          <UserThumbnail className={styles.avatar.icon} userId={''} size={0} />
        ) : (
          <FaRobot className={styles.avatar.icon} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default MessageAvatar;
