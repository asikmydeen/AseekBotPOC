"use client";

import React from 'react';
import { motion } from 'framer-motion';
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
  FiBarChart2,
  FiTrendingUp,
  FiSearch
} from 'react-icons/fi';

const UserGuidePage = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 md:p-8">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.header variants={fadeIn} className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">
            ASEEK Bot User Guide
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Welcome to ASEEK Bot! Your AI-powered assistant for Data Center Procurement. This guide highlights current capabilities and provides a roadmap of upcoming features powered by AWS Bedrock to enhance your procurement processes.
          </p>
        </motion.header>

        {/* Current Capabilities Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiMessageCircle className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Current Capabilities
          </h2>
          <p className="text-lg mb-4">
            ASEEK Bot currently offers the following key features to support your procurement processes:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Data Analytics:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Supplier analytics and insights</li>
                <li>Spend-based analytics and reporting</li>
                <li>Performance metrics visualization</li>
                <li>Trend identification and forecasting</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Document Analysis:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bid document analysis via file uploads</li>
                <li>Contract term extraction</li>
                <li>Specification comparison</li>
                <li>Compliance verification</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Common Queries:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Migration to SMART platform assistance</li>
              <li>Salesforce integration queries</li>
              <li>Procurement process guidance</li>
              <li>Supplier qualification information</li>
              <li>Contract management support</li>
            </ul>
          </div>
        </motion.section>

        {/* Supplier Analytics Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiMessageSquare className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Supplier Analytics (Available Now)
          </h2>
          <p className="text-lg mb-6">
            ASEEK Bot automates supplier discovery and qualification using advanced NLP and integrated systems to identify the best potential partners for your data center needs.
          </p>

          {/* Chat Demo */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-start mb-4">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 mr-3">
                <span className="font-bold">You</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-[80%]">
                Find suppliers for power distribution units for our new data center
              </div>
            </div>
            <div className="flex items-start mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mr-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">ASEEK Bot</span>
              </div>
              <div className="bg-indigo-50 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                I've identified 5 qualified suppliers for PDUs that meet your requirements. Would you like to see their qualification scores, past performance metrics, or risk profiles?
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Key capabilities:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Automated supplier discovery across global databases</li>
              <li>Pre-qualification based on customizable criteria</li>
              <li>Risk assessment and financial stability analysis</li>
              <li>Sustainability and ESG compliance verification</li>
            </ul>
          </div>
        </motion.section>

        {/* Document Analysis Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiUpload className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Document Analysis (Available in phases)
          </h2>
          <p className="text-lg mb-6">
            ASEEK Bot processes and analyzes vendor submissions, extracts key data using advanced AI, and produces comparative reports to streamline your RFP evaluation process.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Supported Document Types:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>RFP/RFQ responses (.pdf, .docx)</li>
                <li>Technical specifications (.pdf, .xlsx)</li>
                <li>Pricing schedules (.xlsx, .csv)</li>
                <li>Vendor certifications (.pdf)</li>
                <li>SLA documentation (.pdf, .docx)</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
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

          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <FiUpload className="mx-auto text-4xl mb-3 text-gray-400" />
            <p className="mb-4">Upload RFP responses for automated analysis</p>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => window.location.href = '/?trigger=documentAnalysis'}
            >
              Upload RFP Documents
            </button>
          </div>
        </motion.section>

        {/* Vendor Insights Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiTag className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Vendor Insights (Coming Soon)
          </h2>
          <p className="text-lg mb-6">
            ASEEK Bot provides AI-powered vendor performance dashboards and risk monitoring alert systems to help you select and manage the best vendors for your data center needs.
          </p>

          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">Key Evaluation Features:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Multi-criteria scoring based on customizable weights</li>
              <li>Historical performance analysis across projects</li>
              <li>Real-time risk monitoring and alerts</li>
              <li>Automated reference checking and validation</li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 flex justify-center items-center"
              onClick={() => window.location.href = '/?query=vendorDashboard'}
            >
              <FiTag className="mr-2" />
              View Vendor Dashboard
            </button>
            <button
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors flex-1 flex justify-center items-center"
              onClick={() => window.location.href = '/?query=riskAlerts'}
            >
              Configure Risk Alerts
            </button>
          </div>
        </motion.section>

        {/* Contract Analysis Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiDownload className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Contract Analysis (Coming Soon)
          </h2>
          <p className="text-lg mb-6">
            ASEEK Bot tracks contract renewals, compliance issues, and automates alerts to ensure your data center vendor relationships remain optimized and compliant.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Contract Monitoring:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Automated renewal date tracking</li>
                <li>SLA compliance monitoring</li>
                <li>Pricing tier optimization alerts</li>
                <li>Contract term comparison</li>
                <li>Obligation management</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Export & Reporting:</h3>
              <p className="mb-3">Generate comprehensive reports:</p>
              <div className="space-y-2">
                <button
                  className="w-full p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors flex items-center justify-center"
                  onClick={() => window.location.href = '/?query=contractSummary'}
                >
                  <FiDownload className="mr-2" /> Contract Summary Report
                </button>
                <button
                  className="w-full p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors flex items-center justify-center"
                  onClick={() => window.location.href = '/?query=complianceDashboard'}
                >
                  <FiDownload className="mr-2" /> Compliance Dashboard
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Spend Analytics Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiSettings className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Spend Analytics (Available Now)
          </h2>
          <p className="text-lg mb-6">
            ASEEK Bot consolidates procurement data, forecasts spend, and provides optimization recommendations to maximize your data center budget efficiency.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Analysis Capabilities:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Category-based spend analysis</li>
                <li>Vendor consolidation opportunities</li>
                <li>Price benchmarking</li>
                <li>Cost variance identification</li>
                <li>Budget forecasting</li>
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Optimization Settings:</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Automated savings alerts</span>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full p-1 flex items-center cursor-pointer">
                    <div className="bg-white w-4 h-4 rounded-full ml-auto"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quarterly spend reports</span>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full p-1 flex items-center cursor-pointer">
                    <div className="bg-white w-4 h-4 rounded-full ml-auto"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Benchmark comparisons</span>
                  <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1 flex items-center cursor-pointer">
                    <div className="bg-white w-4 h-4 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Roadmap Timeline Section */}
        <motion.section
          variants={fadeIn}
          className="mb-16 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <h2 className="text-3xl font-bold mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
              <FiClock className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </span>
            Roadmap Timeline
          </h2>
          <p className="text-lg mb-6">
            Our development roadmap outlines the planned enhancements and new features for ASEEK Bot powered by AWS Bedrock agent capabilities. Here's what you can expect in the coming months:
          </p>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-indigo-200 dark:bg-indigo-800"></div>

            {/* Phase 1: Foundation */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <FiCheck className="text-white" />
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiDatabase className="mr-2" /> Foundation (Completed)
                </h3>
                <p className="mt-2">Initial setup and core functionality implementation including basic query capabilities and integration with AWS Bedrock foundation models.</p>
              </div>
            </motion.div>

            {/* Phase 2: Data Integration */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <FiActivity className="text-white" />
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiDatabase className="mr-2" /> Data Integration (In Progress)
                </h3>
                <p className="mt-2">Integration with key data sources including supplier databases, procurement systems, and contract repositories through AWS Bedrock knowledge bases.</p>
              </div>
            </motion.div>

            {/* Phase 3: Core Functions */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <FiCalendar className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiLayers className="mr-2" /> Core Functions (Q2 2025)
                </h3>
                <p className="mt-2">Enhanced analytics capabilities, document processing improvements, and advanced query handling with AWS Bedrock agent actions.</p>
              </div>
            </motion.div>

            {/* Phase 4: Advanced Features */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <FiCalendar className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiTrendingUp className="mr-2" /> Advanced Features (Q3 2025)
                </h3>
                <p className="mt-2">Implementation of predictive analytics, automated procurement recommendations, and enhanced visualization tools powered by AWS Bedrock.</p>
              </div>
            </motion.div>

            {/* Phase 5: Testing & Refinement */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <FiCalendar className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiActivity className="mr-2" /> Testing & Refinement (Q4 2025)
                </h3>
                <p className="mt-2">Comprehensive testing, performance optimization, and user feedback incorporation to improve the AI assistant experience.</p>
              </div>
            </motion.div>

            {/* Phase 6: Deployment & Handover */}
            <motion.div
              className="relative mb-8 pl-20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-5 w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <FiCalendar className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold flex items-center">
                  <FiServer className="mr-2" /> Deployment & Handover (Q1 2026)
                </h3>
                <p className="mt-2">Final deployment, documentation completion, and full integration with enterprise procurement systems.</p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          variants={fadeIn}
          className="text-center p-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to explore ASEEK Bot?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Try out the current capabilities and stay tuned for exciting new features powered by AWS Bedrock on our roadmap. Head back to the chat interface to start your procurement journey!
          </p>
          <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors">
            Go to Chat
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserGuidePage;
