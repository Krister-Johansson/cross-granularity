'use client';

import BottomSummaryBar from './components/BottomSummaryBar';
import TimeNavigationControls from './components/TimeNavigationControls';
import TimeSeriesChart from './components/TimeSeriesChart';

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col">
      <TimeNavigationControls />
      <TimeSeriesChart />
      <BottomSummaryBar />
    </div>
  );
}
