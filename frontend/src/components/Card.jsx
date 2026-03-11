import DashboardCard from './DashboardCard';

export default function Card({ title, value, hint, trend }) {
  return <DashboardCard title={title} value={value} hint={hint} trend={trend} />;
}
