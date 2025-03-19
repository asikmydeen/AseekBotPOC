"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
    FiMessageSquare,
    FiUpload,
    FiTag,
    FiMessageCircle,
    FiSettings,
    FiDownload,
    FiClock,
    FiCalendar,
    FiActivity,
    FiCheck,
    FiDatabase,
    FiLayers,
    FiServer,
    FiTrendingUp,
    FiChevronLeft
} from 'react-icons/fi';
import Link from 'next/link';

export default function UserGuidePage() {
    const { isDarkMode } = useTheme();
    const [activeSection, setActiveSection] = useState('overview');

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <motion.div variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">Overview</h2>
                        <p className="text-lg mb-6">
                            ASEEK Bot is your AI-powered assistant for Data Center Procurement.
                            Built on AWS Bedrock, it streamlines procurement processes by providing
                            intelligent analytics, document processing, and decision support.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: <FiMessageCircle />, title: "Chat Interface", desc: "Natural language interaction for all your procurement queries" },
                                { icon: <FiUpload />, title: "Document Analysis", desc: "Upload and analyze procurement documents" },
                                { icon: <FiSettings />, title: "Analytics Dashboard", desc: "Visualize procurement data and trends" }
                            ].map((item, idx) => (
                                <div key={idx} className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'}
                    shadow-md transition-all duration-300 flex flex-col items-center text-center cursor-pointer`}
                                    onClick={() => setActiveSection(item.title.toLowerCase().replace(' ', '-'))}>
                                    <div className={`text-3xl mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{item.icon}</div>
                                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'supplier-analytics':
                return (
                    <motion.section variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-4 flex items-center">
                            <span className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <FiMessageSquare className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </span>
                            Supplier Analytics
                        </h2>
                        <p className="text-lg mb-6">
                            ASEEK Bot automates supplier discovery and qualification using advanced NLP and integrated systems to identify the best potential partners for your data center needs.
                        </p>

                        <div className={`border rounded-lg p-4 mb-6 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-start mb-4">
                                <div className={`rounded-full p-2 mr-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <span className="font-bold">You</span>
                                </div>
                                <div className={`p-3 rounded-lg max-w-[80%] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    Find suppliers for power distribution units for our new data center
                                </div>
                            </div>
                            <div className="flex items-start mb-4">
                                <div className={`rounded-full p-2 mr-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                    <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>ASEEK Bot</span>
                                </div>
                                <div className={`p-3 rounded-lg max-w-[80%] ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                                    I've identified 5 qualified suppliers for PDUs that meet your requirements. Would you like to see their qualification scores, past performance metrics, or risk profiles?
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <h3 className="font-bold mb-2">Key capabilities:</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Automated supplier discovery across global databases</li>
                                <li>Pre-qualification based on customizable criteria</li>
                                <li>Risk assessment and financial stability analysis</li>
                                <li>Sustainability and ESG compliance verification</li>
                            </ul>
                        </div>
                    </motion.section>
                );

            case 'document-analysis':
                return (
                    <motion.section variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-4 flex items-center">
                            <span className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <FiUpload className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </span>
                            Document Analysis
                        </h2>
                        <p className="text-lg mb-6">
                            ASEEK Bot processes and analyzes vendor submissions, extracts key data using advanced AI, and produces comparative reports to streamline your RFP evaluation process.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <h3 className="font-bold mb-2">Supported Document Types:</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>RFP/RFQ responses (.pdf, .docx)</li>
                                    <li>Technical specifications (.pdf, .xlsx)</li>
                                    <li>Pricing schedules (.xlsx, .csv)</li>
                                    <li>Vendor certifications (.pdf)</li>
                                    <li>SLA documentation (.pdf, .docx)</li>
                                </ul>
                            </div>

                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <h3 className="font-bold mb-2">Analysis Capabilities:</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Automated requirement compliance checking</li>
                                    <li>Pricing comparison and TCO calculation</li>
                                    <li>Technical specification extraction</li>
                                    <li>Side-by-side vendor comparison</li>
                                    <li>Anomaly and risk detection</li>
                                </ul>
                            </div>
                        </div>

                        <div className={`border border-dashed rounded-lg p-8 text-center
                ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                            <FiUpload className={`mx-auto text-4xl mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <p className="mb-4">Upload RFP responses for automated analysis</p>
                            <Link href="/?trigger=documentAnalysis">
                                <button className={`px-4 py-2 rounded-lg transition-colors
                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                                    Upload RFP Documents
                                </button>
                            </Link>
                        </div>
                    </motion.section>
                );

            case 'roadmap':
                return (
                    <motion.section variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-4 flex items-center">
                            <span className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <FiClock className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </span>
                            Roadmap Timeline
                        </h2>
                        <p className="text-lg mb-6">
                            Our development roadmap outlines planned enhancements and new features powered by AWS Bedrock.
                        </p>

                        <div className="relative pl-4">
                            {/* Timeline line */}
                            <div className={`absolute left-8 top-0 bottom-0 w-1 ${isDarkMode ? 'bg-blue-800' : 'bg-blue-200'}`}></div>

                            {/* Phase 1: Foundation */}
                            <motion.div
                                className="relative mb-8 pl-16"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <div className="absolute left-5 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <FiCheck className="text-white" />
                                </div>
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                                    <h3 className="text-xl font-bold flex items-center">
                                        <FiDatabase className="mr-2" /> Foundation (Completed)
                                    </h3>
                                    <p className="mt-2">Initial setup and core functionality implementation including basic query capabilities and integration with AWS Bedrock foundation models.</p>
                                </div>
                            </motion.div>

                            {/* Phase 2: Data Integration */}
                            <motion.div
                                className="relative mb-8 pl-16"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="absolute left-5 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <FiActivity className="text-white" />
                                </div>
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                                    <h3 className="text-xl font-bold flex items-center">
                                        <FiDatabase className="mr-2" /> Data Integration (In Progress)
                                    </h3>
                                    <p className="mt-2">Integration with key data sources including supplier databases, procurement systems, and contract repositories through AWS Bedrock knowledge bases.</p>
                                </div>
                            </motion.div>

                            {/* Phase 3: Core Functions */}
                            <motion.div
                                className="relative mb-8 pl-16"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                viewport={{ once: true }}
                            >
                                <div className={`absolute left-5 w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}>
                                    <FiCalendar className="text-white" />
                                </div>
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <h3 className="text-xl font-bold flex items-center">
                                        <FiLayers className="mr-2" /> Core Functions (Q2 2025)
                                    </h3>
                                    <p className="mt-2">Enhanced analytics capabilities, document processing improvements, and advanced query handling with AWS Bedrock agent actions.</p>
                                </div>
                            </motion.div>

                            {/* Additional phases would follow... */}
                        </div>
                    </motion.section>
                );

            default:
                return (
                    <motion.div variants={fadeIn} className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-4">Section Not Found</h2>
                        <p>The requested section is not available. Please return to the overview.</p>
                        <button
                            onClick={() => setActiveSection('overview')}
                            className={`mt-4 px-4 py-2 rounded-lg transition-colors
                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        >
                            Return to Overview
                        </button>
                    </motion.div>
                );
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            {/* Back to Chat Link */}
            <div className="fixed top-4 left-4 z-10">
                <Link href="/" className={`flex items-center px-3 py-2 rounded-lg
            ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-md transition-colors`}>
                    <FiChevronLeft className="mr-2" />
                    Back to Chat
                </Link>
            </div>

            <div className="container mx-auto px-4 pt-16 pb-8">
                <motion.div
                    className="max-w-6xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    {/* Header */}
                    <motion.header variants={fadeIn} className="mb-12 text-center">
                        <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            ASEEK Bot User Guide
                        </h1>
                        <p className="text-xl max-w-3xl mx-auto">
                            Your AI-powered assistant for Data Center Procurement. This guide highlights current capabilities and provides a roadmap of upcoming features.
                        </p>
                    </motion.header>

                    {/* Navigation */}
                    <motion.nav variants={fadeIn} className="mb-8">
                        <ul className="flex flex-wrap justify-center gap-2 md:gap-4">
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'supplier-analytics', label: 'Supplier Analytics' },
                                { id: 'document-analysis', label: 'Document Analysis' },
                                { id: 'vendor-insights', label: 'Vendor Insights' },
                                { id: 'spend-analytics', label: 'Spend Analytics' },
                                { id: 'roadmap', label: 'Roadmap' }
                            ].map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveSection(item.id)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${activeSection === item.id
                                                ? isDarkMode
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-600 text-white'
                                                : isDarkMode
                                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.nav>

                    {/* Content Section */}
                    <div className={`p-6 rounded-lg shadow-lg mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {renderSection()}
                    </div>

                    {/* Call to Action */}
                    <motion.div
                        variants={fadeIn}
                        className={`text-center p-8 rounded-xl mb-8 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}
                    >
                        <h2 className="text-2xl font-bold mb-4">Ready to explore ASEEK Bot?</h2>
                        <p className="mb-6 max-w-2xl mx-auto">
                            Try out the current capabilities and stay tuned for exciting new features powered by AWS Bedrock on our roadmap.
                        </p>
                        <Link href="/" className={`inline-block px-6 py-3 rounded-lg text-lg font-medium transition-colors
                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                            Go to Chat
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}