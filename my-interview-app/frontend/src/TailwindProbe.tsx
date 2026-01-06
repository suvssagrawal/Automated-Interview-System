export function TailwindProbe() {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold text-blue-600">Tailwind Probe</h2>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-blue-600 text-white p-2 rounded shadow">bg-blue-600</div>
        <div className="bg-gradient-to-r from-pink-500 to-violet-600 text-white p-2 rounded">gradient</div>
        <div className="border border-dashed border-red-500 p-2 rounded text-red-600">border-red-500</div>
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-white">OK</div>
        <div className="animate-pulse bg-gray-300 h-6 rounded col-span-2" />
        <button className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors">Button</button>
      </div>
    </div>
  );
}
