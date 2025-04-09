'use client';

import React from 'react';
import Link from 'next/link';
import { MdSettings, MdPalette, MdAccountCircle } from 'react-icons/md';
import { FiHelpCircle } from 'react-icons/fi';

interface SettingsSectionProps {
  styles: any;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  styles,
  isDarkMode,
  onToggleTheme
}) => {
  return (
    <div className={styles.settings.container}>
      <div className={styles.content.section.header}>
        <MdSettings className="mr-2" size={20} />
        <h3 className={styles.content.section.title}>Settings</h3>
      </div>
      <div className="space-y-4">
        <div className={styles.settings.section}>
          <p className={styles.settings.sectionTitle}>Theme</p>
          <div className="flex items-center">
            <button
              onClick={onToggleTheme}
              className={styles.settings.themeButton}
            >
              <MdPalette className="mr-2" />
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>

        <div className={styles.settings.section}>
          <p className={styles.settings.sectionTitle}>Account</p>
          <div className={styles.settings.accountContainer}>
            <div className={styles.settings.accountIcon}>
              <MdAccountCircle size={24} />
            </div>
            <div className={styles.settings.accountInfo}>
              <p className={styles.settings.accountName}>User Account</p>
              <p className={styles.settings.accountEmail}>user@example.com</p>
            </div>
          </div>
        </div>

        <div className={styles.settings.section}>
          <p className={styles.settings.sectionTitle}>Help</p>
          <Link
            href="/userguide"
            className={styles.settings.helpLink}
          >
            <FiHelpCircle className="mr-2" />
            <span>User Guide</span>
          </Link>
        </div>

        <div className={styles.settings.section}>
          <p className={styles.settings.sectionTitle}>About</p>
          <div className={styles.settings.aboutContainer}>
            <p className={styles.settings.aboutText}>AseekBot v1.0.0</p>
            <p>Data Center Procurement Assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
