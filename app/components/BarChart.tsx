// app/components/BarChart.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Series = { label: string; data: number[] };

interface Props {
  labels: string[];
  datasetA: Series; // e.g., Income
  datasetB: Series; // e.g., Expense
  height?: number; // px
}

export default function BarChart({ labels, datasetA, datasetB, height = 220 }: Props) {
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          // nicer thousands formatting
          callback: (v) =>
            typeof v === "number" ? v.toLocaleString(undefined) : String(v),
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: datasetA.label,
        data: datasetA.data,
        backgroundColor: "rgba(16, 185, 129, 0.65)", // emerald-500
        borderRadius: 8,
      },
      {
        label: datasetB.label,
        data: datasetB.data,
        backgroundColor: "rgba(244, 63, 94, 0.65)", // rose-500
        borderRadius: 8,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Bar options={options} data={data} />
    </div>
  );
}
