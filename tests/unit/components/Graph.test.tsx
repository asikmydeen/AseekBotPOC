import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Graph from '@/app/components/Graph';

// Mock ResizeObserver which might be used by the Graph component
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Graph Component', () => {
  // Sample data for testing
  const sampleData = [
    { date: '2025-01-01', value: 10 },
    { date: '2025-01-02', value: 20 },
    { date: '2025-01-03', value: 15 },
    { date: '2025-01-04', value: 25 },
  ];

  it('renders without crashing', () => {
    render(<Graph data={sampleData} />);
    // Check if the graph container is rendered
    expect(screen.getByTestId('graph-container')).toBeInTheDocument();
  });

  it('displays correct number of data points', () => {
    render(<Graph data={sampleData} />);
    // Check for SVG elements representing data points
    const dataPoints = screen.getAllByTestId('data-point');
    expect(dataPoints).toHaveLength(sampleData.length);
  });

  it('renders with custom width and height', () => {
    const customWidth = 800;
    const customHeight = 400;
    
    render(
      <Graph 
        data={sampleData} 
        width={customWidth} 
        height={customHeight} 
      />
    );
    
    const graphContainer = screen.getByTestId('graph-container');
    expect(graphContainer).toHaveStyle(`width: ${customWidth}px`);
    expect(graphContainer).toHaveStyle(`height: ${customHeight}px`);
  });

  it('shows tooltip on hover', () => {
    render(<Graph data={sampleData} />);
    
    const dataPoint = screen.getAllByTestId('data-point')[0];
    fireEvent.mouseOver(dataPoint);
    
    // Check if tooltip is displayed
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toHaveTextContent('2025-01-01');
    expect(screen.getByTestId('tooltip')).toHaveTextContent('10');
  });

  it('hides tooltip on mouse leave', () => {
    render(<Graph data={sampleData} />);
    
    const dataPoint = screen.getAllByTestId('data-point')[0];
    
    // Show tooltip
    fireEvent.mouseOver(dataPoint);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    
    // Hide tooltip
    fireEvent.mouseLeave(dataPoint);
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('renders with different color schemes', () => {
    const { rerender } = render(
      <Graph 
        data={sampleData} 
        colorScheme="blue" 
      />
    );
    
    let line = screen.getByTestId('graph-line');
    expect(line).toHaveAttribute('stroke', 'blue');
    
    // Rerender with different color scheme
    rerender(
      <Graph 
        data={sampleData} 
        colorScheme="red" 
      />
    );
    
    line = screen.getByTestId('graph-line');
    expect(line).toHaveAttribute('stroke', 'red');
  });

  it('renders empty state when no data is provided', () => {
    render(<Graph data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByTestId('graph-line')).not.toBeInTheDocument();
  });

  it('renders with custom axis labels', () => {
    render(
      <Graph 
        data={sampleData} 
        xAxisLabel="Date" 
        yAxisLabel="Value" 
      />
    );
    
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
});