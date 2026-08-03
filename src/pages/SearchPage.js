import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Grid2X2, List, MapPin, Search } from 'lucide-react';
import MedicineDetailsModal from '../components/MedicineDetailsModal';
import { slugify, calculateDistanceKm } from '../utils';

export default function SearchPage({ medicines, pharmacies, setSearchTerm, searchTerm, onReserve, canReserve, onRequireLogin }) {
  const [searchParams] = useSearchParams();
  const [detailsMed, setDetailsMed] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState('Name: A to Z');
  const [viewMode, setViewMode] = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSortBy('Best Match');
        setLocationLoading(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        setLocationLoading(false);
      }
    );
  };

  // Auto-request location once on mount so "Best Match" can rank by distance
  // without requiring an extra click (mirrors PharmaciesPage.js's behavior).
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => {},
        { timeout: 10000, maximumAge: 120000 },
      );
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('query');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams, setSearchTerm]);

  // Extract unique categories from the medicines list dynamically
  const categories = useMemo(() => {
    const allCategories = medicines.map((med) => med.category).filter(Boolean);
    return ['All', ...new Set(allCategories)];
  },[medicines]);

  // Extract unique brands from the medicines list dynamically
  const brands = useMemo(() => {
    const allBrands = medicines.map((med) => med.brandName).filter(Boolean);
    return['All', ...new Set(allBrands)];
  }, [medicines]);

  // Distance (km) from the user to the pharmacy stocking a given medicine, or null if unknown
  const distanceFor = useCallback((med) => {
    const pharmacyData = pharmacies?.find(p => p.name === med.pharmacy);
    return userLocation && pharmacyData ? calculateDistanceKm(userLocation, pharmacyData) : null;
  }, [pharmacies, userLocation]);

  // Filter and sort medicines
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let result = medicines.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(term) ||
        (med.brandName || '').toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      const matchesBrand = selectedBrand === 'All' || med.brandName === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });

    if (sortBy === 'Name: A to Z') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'Name: Z to A') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'Price: Low to High') {
      result = [...result].sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'Price: High to Low') {
      result = [...result].sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
        return priceB - priceA;
      });
    } else if (sortBy === 'Best Match') {
      // In-stock first, then nearest first (when location is known), then by name
      result = [...result].sort((a, b) => {
        const inStockA = a.available && Number(a.quantity || 0) > 0 ? 0 : 1;
        const inStockB = b.available && Number(b.quantity || 0) > 0 ? 0 : 1;
        if (inStockA !== inStockB) return inStockA - inStockB;

        const distA = distanceFor(a);
        const distB = distanceFor(b);
        const finalDistA = distA !== null ? distA : Infinity;
        const finalDistB = distB !== null ? distB : Infinity;
        if (finalDistA !== finalDistB) return finalDistA - finalDistB;

        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [medicines, searchTerm, selectedCategory, selectedBrand, sortBy, distanceFor]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900">
          {selectedCategory === 'All' ? 'Search Medicine' : selectedCategory}
        </h2>
        <p className="mt-2 text-slate-600">Check real-time availability and reserve your medication.</p>
      </div>

      <div className="flex flex-col gap-10 md:flex-row">
        {/* Left Sidebar: Filters */}
        <aside className="w-full flex-shrink-0 md:w-64">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* Categories Section */}
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                Categories
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left transition hover:text-emerald-600 ${
                        selectedCategory === category
                          ? 'font-bold text-emerald-700'
                          : 'font-medium'
                      }`}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <hr className="my-6 border-slate-200" />

            {/* Brands Section */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                Our Brands
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {brands.map((brand) => (
                  <li key={brand}>
                    <button
                      onClick={() => setSelectedBrand(brand)}
                      className={`w-full text-left transition hover:text-emerald-600 ${
                        selectedBrand === brand
                          ? 'font-bold text-emerald-700'
                          : 'font-medium'
                      }`}
                    >
                      {brand}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </aside>

        {/* Main Content: Search Bar & Product Grid */}
        <div className="flex-1">
          {/* Search Bar & Nearest Button */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                type="text"
                placeholder="Try Paracetamol, Metformin, Vitamin C..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-base shadow-sm outline-none transition focus:border-emerald-500"
              />
            </div>
            <button 
              onClick={handleFindNearest} 
              disabled={locationLoading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
            >
              <MapPin size={20} />
              {locationLoading ? 'Locating...' : 'Find Nearest to Me'}
            </button>
          </div>
          {locationError && <p className="mb-6 text-sm text-red-500">{locationError}</p>}

          {/* Controls Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>Showing {filtered.length} products</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort medicines"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 outline-none"
              >
                <option>Name: A to Z</option>
                <option>Name: Z to A</option>
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <div className="ml-2 flex overflow-hidden rounded-lg border border-slate-300 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  className={`flex h-8 w-9 items-center justify-center transition ${
                    viewMode === 'grid'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Grid2X2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  className={`flex h-8 w-9 items-center justify-center transition ${
                    viewMode === 'list'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div
            data-testid="medicine-results"
            data-view={viewMode}
            className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}
          >
            {filtered.map((med) => {
              const isAvailable = Boolean(med.available && Number(med.quantity) > 0);
              const actionLabel = !isAvailable
                ? 'Out of Stock'
                : canReserve
                  ? 'Reserve'
                  : 'Login to Reserve';
              const pharmacyData = pharmacies?.find(p => p.name === med.pharmacy);
              const distanceKm = userLocation && pharmacyData ? calculateDistanceKm(userLocation, pharmacyData) : null;

              return (
                <article
                  key={med.id || med._id || `${med.name}-${med.pharmacy}`}
                  className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${
                    viewMode === 'grid' ? 'flex flex-col' : 'grid md:grid-cols-[240px_minmax(0,1fr)]'
                  }`}
                >
                  {med.image && (
                    <div className={`relative overflow-hidden bg-slate-100 ${
                      viewMode === 'grid' ? '' : 'h-56 md:h-full md:min-h-[260px]'
                    }`}>
                      <img
                        src={med.image}
                        alt={med.name}
                        className={`w-full object-cover transition duration-500 hover:scale-105 ${
                          viewMode === 'grid' ? 'h-52' : 'h-full'
                        }`}
                      />
                      {med.productForm && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700 shadow backdrop-blur-sm">
                          {med.productForm}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <h3 data-testid="medicine-name" className="text-xl font-black leading-tight text-slate-900">{med.name}</h3>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {[med.category, med.productForm, med.brandName].filter(Boolean).join(' • ')}
                      </p>
                      {med.requiresPrescription && (
                        <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Prescription required
                        </span>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link to={`/pharmacies/${slugify(med.pharmacy)}`} className="text-sm font-semibold text-emerald-700 hover:underline">
                          {med.pharmacy}
                        </Link>
                        {distanceKm !== null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                            <MapPin size={11} />
                            {distanceKm.toFixed(1)} km away
                          </span>
                        ) : userLocation === null && (
                          <span className="text-xs text-slate-400">enable location for distance</span>
                        )}
                      </div>
                      {distanceKm !== null && pharmacyData?.lat && pharmacyData?.lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pharmacyData.lat},${pharmacyData.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <MapPin size={11} /> Get directions
                        </a>
                      )}
                      <p className="mt-4 text-2xl font-black text-slate-900">{med.price}</p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setDetailsMed(med)} className="w-full rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                        Details
                      </button>
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => (canReserve ? onReserve(med) : onRequireLogin())}
                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
                          isAvailable
                            ? 'bg-slate-900 text-white hover:bg-slate-700'
                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                        }`}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">No medicines found.</p>
              <p className="text-slate-500">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      <MedicineDetailsModal
        med={detailsMed}
        onClose={() => setDetailsMed(null)}
        onReserve={onReserve}
        onRequireLogin={onRequireLogin}
        canReserve={canReserve}
      />
    </section>
  );
}
