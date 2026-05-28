"use client";

import { useState, useEffect, useMemo } from "react";
import { getLandListings, LandListing, mockLandListings } from "../data/listings";
import { isSupabaseConfigured } from "../lib/supabase";

export default function Home() {
  const [listings, setListings] = useState<LandListing[]>(mockLandListings);
  const [dbSource, setDbSource] = useState<string>("fallback_no_keys");
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedZoning, setSelectedZoning] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number>(2000000); // 2M max slider
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Details Modal and Booking States
  const [activeListing, setActiveListing] = useState<LandListing | null>(null);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "booking" | "success">("idle");
  const [bookingName, setBookingName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [showSqlSetup, setShowSqlSetup] = useState(false);

  // Fetch land listings from Supabase on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getLandListings();
      setListings(res.data);
      setDbSource(res.source);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered dataset
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());

      const matchesZoning =
        selectedZoning === "all" || item.zoning.toLowerCase().includes(selectedZoning.toLowerCase());

      const matchesPrice = item.price <= priceRange;
      const matchesPlot = !selectedPlotId || item.plotId === selectedPlotId;

      return matchesSearch && matchesZoning && matchesPrice && matchesPlot;
    });
  }, [listings, search, selectedZoning, priceRange, selectedPlotId]);

  // Dynamically calculated stats highlights
  const stats = useMemo(() => {
    const count = filteredListings.length;
    const totalAcres = filteredListings.reduce((sum, item) => sum + item.size, 0);
    const avgPricePerAcre = count > 0 
      ? Math.round(filteredListings.reduce((sum, item) => sum + item.price, 0) / totalAcres) 
      : 0;

    return { count, totalAcres: Math.round(totalAcres * 10) / 10, avgPricePerAcre };
  }, [filteredListings]);

  // SQL Script for user to copy-paste into Supabase SQL editor
  const sqlSetupScript = `
-- 1. Create the Land Listings Table
create table land_listings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  location text not null,
  size numeric not null, -- in acres
  zoning text not null,
  water_status text not null,
  power_status text not null,
  road_access text not null,
  soil_type text not null,
  yield_rating text not null,
  description text not null,
  image_url text not null,
  plot_id text not null,
  featured boolean default false
);

-- 2. Populate with premium raw land parcels
insert into land_listings (title, price, location, size, zoning, water_status, power_status, road_access, soil_type, yield_rating, description, image_url, plot_id, featured) values
('Golden Silt Valley Farmstead', 680000, 'Napa Valley, CA', 32.8, 'Agricultural (A-1)', 'Available', 'Grid Connected', 'Paved Frontage', 'Rich Silt & Organic Clay', 'High Investment', 'World-class agricultural acreage with premium water rights, featuring a mineral-dense sandy loam topsoil specifically tested for viticulture.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 'plot-1', true),
('Redwood Canopy Haven', 490000, 'Humboldt County, CA', 22.4, 'Conservation (C-2)', 'Well Required', 'Off-Grid Solar', 'Gravel Access', 'Rich Forest Duff', 'Conservation Tax-Shelter', 'Towering redwood giants canopy this pristine conservation block. Private dirt pathway connects to local state road easement.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 'plot-2', false),
('Highland Pasture Meadow', 295000, 'Bend, OR', 18.2, 'Agricultural (A-1)', 'Available', 'Grid Connected', 'Paved Frontage', 'Sandy Loam & Volcanic Ash', 'Steady Development', 'Gorgeous, flat meadow with volcanic soil signatures rich in trace minerals. Ideal for grazing herds or building a modern homestead.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'plot-3', false),
('Whispering Pines Ridge Tract', 320000, 'Steamboat Springs, CO', 15.4, 'Agricultural (A-1)', 'Well Required', 'Street-Adjacent', 'Paved Frontage', 'Rich Loam & Granite', 'Steady Development', 'An elegant, high-elevation alpine parcel boasting mature timber stands, a year-round spring brook, and unmatched panoramas.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'plot-4', true),
('Emerald Glade Conservation Plot', 185000, 'Berkshire Hills, MA', 8.5, 'Conservation (C-2)', 'Public Tap', 'Off-Grid Solar', 'Gravel Access', 'Sandy Silty Loam', 'Conservation Tax-Shelter', 'Protected forest sanctuary featuring dense oak cover and an active native biosphere. Eligible for conservation tax benefits.', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', 'plot-5', false),
('Seaside Crest Cliffside Tract', 1450000, 'Big Sur, CA', 12.2, 'Residential Luxury', 'Seaside Access', 'Full Utility Box', 'Paved Frontage', 'Rocky Clay & Sandstone', 'High Investment', 'An extraordinary high-cliff coastal frontage offering sheer drop views over the crashing Pacific waves. Ready for building engineering.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 'plot-6', true);
`;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus("booking");
    setTimeout(() => {
      setBookingStatus("success");
    }, 1200);
  };

  const closeDetailModal = () => {
    setActiveListing(null);
    setBookingStatus("idle");
    setBookingName("");
    setBookingDate("");
  };

  // Coordinates tooltip mapping for subdivision SVG map
  const [hoveredPlot, setHoveredPlot] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const plots = [
    { id: "plot-1", label: "Plot #1", price: "$680k", size: "32.8 Ac", path: "M 20,20 L 140,20 L 140,110 L 20,110 Z" },
    { id: "plot-2", label: "Plot #2", price: "$490k", size: "22.4 Ac", path: "M 155,20 L 280,20 L 280,110 L 155,110 Z" },
    { id: "plot-3", label: "Plot #3", price: "$295k", size: "18.2 Ac", path: "M 295,20 L 415,20 L 415,220 L 295,220 Z" },
    { id: "plot-4", label: "Plot #4", price: "$320k", size: "15.4 Ac", path: "M 20,125 L 140,125 L 140,220 L 20,220 Z" },
    { id: "plot-5", label: "Plot #5", price: "$185k", size: "8.5 Ac", path: "M 155,125 L 280,125 L 280,220 L 155,220 Z" },
    { id: "plot-6", label: "Plot #6", price: "$1.45M", size: "12.2 Ac", path: "M 20,235 L 415,235 L 415,310 L 20,310 Z" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* Premium Header */}
      <header className="border-b border-slate-200 py-5 px-8 flex items-center justify-between shrink-0 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-100">
            O
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
              O<span className="text-indigo-600">land</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
              High-Yield Land Selling Dashboard
            </p>
          </div>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-2 ${
            dbSource === "supabase"
              ? "bg-teal-50 border-teal-200 text-teal-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${dbSource === "supabase" ? "bg-teal-500 animate-pulse" : "bg-amber-500 animate-ping"}`} />
            {dbSource === "supabase" ? "Supabase Connected" : "Local Data Fallback"}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Dynamic Database Configuration Alert Banner */}
        {dbSource !== "supabase" && (
          <div className="border border-indigo-100 bg-indigo-50/50 p-6 rounded-3xl space-y-4 animate-slide-up shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-3">
                <span className="text-xl">🔌</span>
                <div>
                  <h4 className="font-extrabold text-sm text-indigo-900 leading-tight">Supabase Setup Required</h4>
                  <p className="text-xs text-indigo-700 font-medium mt-1">
                    The app is currently rendering offline local land parcels. Complete your Supabase keys inside the <code className="bg-indigo-100 px-1 rounded font-bold font-mono">.env.local</code> file in your workspace to enable live PostgreSQL fetching.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlSetup(!showSqlSetup)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer self-start md:self-auto shrink-0 shadow-sm shadow-indigo-200"
              >
                {showSqlSetup ? "Hide SQL Setup Guide" : "Get Supabase SQL Script"}
              </button>
            </div>

            {showSqlSetup && (
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 text-xs space-y-3 font-mono overflow-x-auto relative animate-slide-up">
                <div className="flex justify-between items-center text-slate-400 font-sans border-b border-slate-800 pb-2 mb-2 font-bold uppercase tracking-wider text-[10px]">
                  <span>Supabase SQL Migration Code</span>
                  <span className="text-teal-400">Copy this into your Supabase SQL Editor</span>
                </div>
                <pre className="text-[10px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre">
                  {sqlSetupScript}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Real-time calculated dashboard metric indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total plots available */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between glow-indigo transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Land Parcels</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats.count} Listings</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">100% verified titles held</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              🌳
            </div>
          </div>

          {/* Combined acreage */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between glow-teal transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Combined Sizing</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats.totalAcres} Acres</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Across all zoning segments</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
              ⛰️
            </div>
          </div>

          {/* Average price per acre */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between glow-amber transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Price Per Acre</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                ${stats.avgPricePerAcre.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Reflects dynamic market values</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              📈
            </div>
          </div>
        </div>

        {/* Core Exploration View Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* LEFT 2 COLUMNS: Filters and Listing Cards */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Filter controls */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search query box */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search land tracts by title, state, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Advanced toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                {/* Price cap slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Maximum Price Boundary</span>
                    <span className="text-indigo-600 font-extrabold">
                      {priceRange >= 2000000 ? "No Limit ($2M+)" : `$${(priceRange / 1000).toLocaleString()}k`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={2000000}
                    step={25000}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-indigo-600 bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Zoning dropdown filter */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500">Zoning Designation</label>
                  <select
                    value={selectedZoning}
                    onChange={(e) => setSelectedZoning(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Zoning Regulations</option>
                    <option value="agricultural">Agricultural (A-1)</option>
                    <option value="residential">Residential Luxury</option>
                    <option value="conservation">Conservation Areas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Querying Supabase Database...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl border border-slate-200">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h5 className="font-bold text-slate-700 text-lg">No Land Listings Found</h5>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Try increasing your pricing sliders or clearing your map plot filter.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedZoning("all");
                    setPriceRange(2000000);
                    setSelectedPlotId(null);
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredListings.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveListing(item)}
                    className="glass-card rounded-2xl border border-slate-200 overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg glow-indigo"
                  >
                    {/* Visual Photo */}
                    <div className="h-44 overflow-hidden relative bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-4 left-4 bg-white/95 text-slate-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        🌿 {item.zoning}
                      </span>
                      <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {item.yieldRating}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest leading-none mb-1">
                          {item.location}
                        </p>
                        <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Pricing Specs footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Asset Listing Price</p>
                          <p className="text-lg font-extrabold text-slate-950">${item.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Plot Acreage</p>
                          <p className="text-sm font-extrabold text-slate-800">{item.size} Acres</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: Interactive subdivision parcel map */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 glass-card p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight">Interactive Subdivision Plan</h4>
                  <p className="text-xs text-slate-500 font-medium font-sans">Select a parcel below to filter</p>
                </div>
                {selectedPlotId && (
                  <button
                    onClick={() => setSelectedPlotId(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Map grid wrapper */}
              <div
                className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-4 min-h-[300px]"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top - 5 });
                }}
              >
                <svg viewBox="0 0 435 330" className="w-full h-auto overflow-visible select-none">
                  {/* Road layouts */}
                  <line x1="148" y1="10" x2="148" y2="230" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
                  <line x1="288" y1="10" x2="288" y2="230" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
                  <line x1="10" y1="228" x2="425" y2="228" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
                  <text x="80" y="231" textAnchor="middle" fill="#94a3b8" className="text-[7px] font-extrabold tracking-widest uppercase">
                    Acre Access Road
                  </text>

                  {/* Render SVG Plots */}
                  {plots.map((plot) => {
                    const isSelected = selectedPlotId === plot.id;
                    return (
                      <g key={plot.id} className="cursor-pointer">
                        <path
                          d={plot.path}
                          className={`transition-all duration-300 stroke-[2] ${
                            isSelected
                              ? "fill-indigo-600/90 stroke-indigo-600 drop-shadow-md"
                              : "fill-teal-50/70 stroke-teal-500 hover:fill-teal-100"
                          }`}
                          onClick={() => setSelectedPlotId(isSelected ? null : plot.id)}
                          onMouseEnter={() => setHoveredPlot(plot)}
                          onMouseLeave={() => setHoveredPlot(null)}
                        />
                        <text
                          x={
                            plot.id === "plot-1" ? 80 : plot.id === "plot-2" ? 218 : plot.id === "plot-3" ? 355 : plot.id === "plot-4" ? 80 : plot.id === "plot-5" ? 218 : 218
                          }
                          y={
                            plot.id === "plot-1" ? 65 : plot.id === "plot-2" ? 65 : plot.id === "plot-3" ? 125 : plot.id === "plot-4" ? 172 : plot.id === "plot-5" ? 172 : 275
                          }
                          textAnchor="middle"
                          className={`text-[9px] font-extrabold pointer-events-none select-none transition-colors ${
                            isSelected ? "fill-white" : "fill-slate-700"
                          }`}
                        >
                          {plot.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* SVG Hover Tooltip */}
                {hoveredPlot && (
                  <div
                    className="absolute bg-slate-900 text-white rounded-lg p-2.5 text-[11px] shadow-lg flex flex-col gap-0.5 border border-slate-800 pointer-events-none z-10 transition-all"
                    style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-extrabold text-indigo-300">{hoveredPlot.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">Active</span>
                    </div>
                    <p className="font-extrabold text-white mt-1 text-[13px]">{hoveredPlot.price}</p>
                    <p className="text-slate-400 font-semibold">{hoveredPlot.size}</p>
                  </div>
                )}
              </div>

              {/* Subdivision plan legend */}
              <div className="flex items-center justify-around mt-4 border-t border-slate-100 pt-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-slate-600">Available Plots</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-600">Selected Plot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Details drawer drawer popup modal */}
      {activeListing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col md:flex-row">
            {/* Left Image column */}
            <div className="md:w-1/2 relative bg-slate-100 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeListing.imageUrl} alt={activeListing.title} className="w-full h-full object-cover" />
              <button
                onClick={closeDetailModal}
                className="absolute top-4 left-4 bg-white/95 text-slate-700 hover:text-slate-950 font-bold p-2.5 rounded-full shadow-md transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Right Information panel */}
            <div className="md:w-1/2 p-8 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeListing.zoning}
                  </span>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeListing.yieldRating}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeListing.title}</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{activeListing.location}</p>

                <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-4">
                  {activeListing.description}
                </p>

                {/* Specs check grid */}
                <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Power Connectivity</span>
                    <span className="text-xs font-extrabold text-slate-800">{activeListing.powerStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Water Tap Connection</span>
                    <span className="text-xs font-extrabold text-slate-800">{activeListing.waterStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Access Infrastructure</span>
                    <span className="text-xs font-extrabold text-slate-800">{activeListing.roadAccess}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Core Soil Structure</span>
                    <span className="text-xs font-extrabold text-slate-800">{activeListing.soilType}</span>
                  </div>
                </div>
              </div>

              {/* Walking tour form */}
              <div className="border-t border-slate-100 pt-6 mt-6">
                {bookingStatus === "success" ? (
                  <div className="bg-teal-50 border border-teal-100 text-teal-800 p-4 rounded-xl text-center space-y-1">
                    <p className="font-extrabold text-sm">Site Walk Request Logged!</p>
                    <p className="text-[10px] font-medium text-teal-600">
                      Our field specialist has reserved your walkthrough for {bookingDate}. We will contact you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Book a Physical Site Walking Inspection</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={bookingStatus === "booking"}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer disabled:bg-indigo-400"
                    >
                      {bookingStatus === "booking" ? "Scheduling walkthrough slot..." : `Request Site Visit • $${activeListing.price.toLocaleString()}`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
