// components/TypingIndicator.tsx
import { motion } from 'framer-motion';

export default function TypingIndicator() {
    return (
        <div className="flex items-center mb-4">
            <span className="mr-2">AseekBot is thinking</span>
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-2 h-2 bg-primary dark:bg-primary-dark rounded-full mx-1"
            />
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                className="w-2 h-2 bg-primary dark:bg-primary-dark rounded-full mx-1"
            />
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: 0.4 }}
                className="w-2 h-2 bg-primary dark:bg-primary-dark rounded-full mx-1"
            />
        </div>
    );
}
