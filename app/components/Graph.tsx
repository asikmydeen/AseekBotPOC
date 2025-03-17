// app/components/Graph.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ComparisonGraphData {
    name: string;
    price: number;
    leadTime: number;
}

interface StandardGraphData {
    name: string;
    value: number;
}

type GraphData = ComparisonGraphData | StandardGraphData;

interface Props {
    data: GraphData[];
}

export default function Graph({ data }: Props) {
    const isComparison = 'price' in (data[0] || {}); // Detect if it's a comparison graph

    return (
        <div className="w-full">
            {isComparison ? (
                <BarChart width={500} height={300} data={data} className="mx-auto">
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="price" fill="#60a5fa" name="Price ($)" />
                    <Bar dataKey="leadTime" fill="#f87171" name="Lead Time (days)" />
                </BarChart>
            ) : (
                <BarChart width={500} height={300} data={data} className="mx-auto">
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
            )}
        </div>
    );
}
