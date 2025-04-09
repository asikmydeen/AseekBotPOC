'use client';

import React from 'react';

interface SidebarOverlayProps {
  isVisible: boolean;
  styles: any;
  onClose: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  isVisible,
  styles,
  onClose
}) => {
  if (!isVisible) return null;
  
  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-hidden="true"
    />
  );
};

export default SidebarOverlay;
