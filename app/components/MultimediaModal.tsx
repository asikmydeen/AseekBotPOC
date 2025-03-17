// app/components/MultimediaModal.tsx
"use client";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import VideoPlayer from './VideoPlayer';
import Graph from './Graph';

interface MultimediaContent {
    type: 'video' | 'graph' | 'image';
    data: string | Record<string, unknown>;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    content: MultimediaContent | null;
}

export default function MultimediaModal({ isOpen, onClose, content }: Props) {
    const closeButtonRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    // Reset loading state when content changes
    useEffect(() => {
        if (content) {
            setIsLoading(true);
            // Simulate content loading
            const timer = setTimeout(() => setIsLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [content]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-10"
                onClose={onClose}
                initialFocus={closeButtonRef}
                aria-labelledby="multimedia-modal-title"
                aria-describedby="multimedia-modal-description"
            >
                {/* Overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                role="dialog"
                                aria-modal="true"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title
                                        id="multimedia-modal-title"
                                        className="text-xl font-semibold text-white"
                                >
                                    {content?.type === 'video'
                                        ? 'Video Player'
                                        : content?.type === 'image'
                                            ? 'Image Viewer'
                                            : 'Graph Visualization'}
                                </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                                        aria-label={`Close ${
                                            content?.type === 'video'
                                                ? 'video player'
                                                : content?.type === 'image'
                                                    ? 'image viewer'
                                                    : 'graph visualization'
                                        } modal`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <Dialog.Description
                                    id="multimedia-modal-description"
                                    className="sr-only"
                                >
                                    {content?.type === 'video'
                                        ? 'A modal window displaying a video player'
                                        : content?.type === 'image'
                                            ? 'A modal window displaying an image'
                                            : 'A modal window displaying a graph visualization'}
                                </Dialog.Description>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative"
                                >
                                    {isLoading && (
                                        <div className="text-center py-8" aria-live="polite">
                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" role="status">
                                                <span className="sr-only">Loading content...</span>
                                            </div>
                                        </div>
                                    )}

                                    <div aria-live="polite" className={isLoading ? 'sr-only' : ''}>
                                        {content?.type === 'video' && <VideoPlayer url={content.data} />}
                                        {content?.type === 'graph' && <Graph data={content.data} />}
                                        {content?.type === 'image' && (
                                            <div className='flex justify-center'>
                                                <Image
                                                    src={content.data as string}
                                                    alt='Image content'
                                                    width={800}
                                                    height={600}
                                                    className='max-w-full max-h-[70vh] object-contain rounded-lg'
                                                    style={{ width: 'auto', height: 'auto' }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            ref={closeButtonRef}
                                            onClick={onClose}
                                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                            aria-label={`Close ${
                                                content?.type === 'video'
                                                    ? 'video player'
                                                    : content?.type === 'image'
                                                        ? 'image viewer'
                                                        : 'graph visualization'
                                            } modal`}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </motion.div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
