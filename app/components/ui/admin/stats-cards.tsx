interface StatsCardsProps {
	totalSales: string;
	totalOrders: number;
	totalTopUps: string;
}

export function StatsCards({ totalSales, totalOrders, totalTopUps }: StatsCardsProps) {
	return (
		<div className="settings-enter settings-delay-1 mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<div className="admin-surface px-6 py-5">
				<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
					Total Sales
				</p>
				<p className="mt-3 text-3xl font-semibold text-gray-900">{totalSales}</p>
				<p className="mt-2 text-sm text-gray-500">Gross sales recorded for today.</p>
			</div>

			<div className="admin-surface px-6 py-5">
				<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
					Total Orders
				</p>
				<p className="mt-3 text-3xl font-semibold text-gray-900">{totalOrders}</p>
				<p className="mt-2 text-sm text-gray-500">Completed and pending orders today.</p>
			</div>

			<div className="admin-surface px-6 py-5">
				<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
					Total Top-Ups
				</p>
				<p className="mt-3 text-3xl font-semibold text-gray-900">{totalTopUps}</p>
				<p className="mt-2 text-sm text-gray-500">Approved wallet funding for today.</p>
			</div>
		</div>
	);
}
