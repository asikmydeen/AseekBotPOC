import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from '@/app/components/VideoPlayer';

// Mock HTMLMediaElement methods which are not implemented in JSDOM
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();

describe('VideoPlayer Component', () => {
  const sampleVideoUrl = 'https://example.com/sample-video.mp4';
  
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('renders the video element with the provided source', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', sampleVideoUrl);
  });

  it('displays playback controls', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toHaveAttribute('controls');
  });

  it('applies the correct styling to the video element', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toHaveClass('rounded-lg');
    expect(videoElement).toHaveClass('w-full');
  });

  it('handles play and pause interactions', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    
    // Simulate play
    fireEvent.play(videoElement);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    
    // Simulate pause
    fireEvent.pause(videoElement);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });

  it('renders with autoplay when autoplay prop is true', () => {
    render(<VideoPlayer src={sampleVideoUrl} autoplay />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toHaveAttribute('autoplay');
  });

  it('renders without autoplay by default', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).not.toHaveAttribute('autoplay');
  });

  it('renders with loop when loop prop is true', () => {
    render(<VideoPlayer src={sampleVideoUrl} loop />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).toHaveAttribute('loop');
  });

  it('renders without loop by default', () => {
    render(<VideoPlayer src={sampleVideoUrl} />);
    
    const videoElement = screen.getByTestId('video-player');
    expect(videoElement).not.toHaveAttribute('loop');
  });
});