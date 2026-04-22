interface StatsCardsProps {
	totalSales: string;
	totalOrders: number;
	totalTopUps: string; // 👈 changed
}

export function StatsCards({ totalSales, totalOrders, totalTopUps }: StatsCardsProps) {
	return (
		<div className="grid grid-cols-3 gap-6 mb-6">
			<div className="bg-white rounded-lg p-6 border border-gray-700">
				<p className="text-sm text-gray-600 mb-2">Total Sales Today</p>
				<p className="text-3xl font-bold">{totalSales}</p>
			</div>

			<div className="bg-white rounded-lg p-6 border border-gray-700">
				<p className="text-sm text-gray-600 mb-2">Total Orders</p>
				<p className="text-3xl font-bold">{totalOrders}</p>
			</div>

			<div className="bg-white rounded-lg p-6 border border-gray-700">
				<p className="text-sm text-gray-600 mb-2">Total Top-Ups</p> {/* 👈 changed */}
				<p className="text-3xl font-bold">{totalTopUps}</p> {/* 👈 changed */}
			</div>
		</div>
	);
}
