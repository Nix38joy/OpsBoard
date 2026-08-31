import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SeverityChartData } from '../../domain/analytics';
interface IncidentPieChartProps {
  data: SeverityChartData[];
}

export const IncidentPieChart: React.FC<IncidentPieChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-400 text-sm">
        Нет открытых инцидентов для анализа 📊
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm h-64">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Распределение по критичности</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`${value} шт.`, 'Количество']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Legend 
            verticalAlign="middle" 
            align="right" 
            layout="vertical"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
