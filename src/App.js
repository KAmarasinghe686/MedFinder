import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  createMedicine,
  createReservation,
  deleteReservation,
  deleteMedicine,
  fetchMedicines,
  fetchPharmacies,
  fetchMyPharmacy,
  fetchReservations,
  fetchEmergencyOrders,
  updateEmergencyOrder,
  fetchContactMessages,
  markContactRead,
  getMe,
  updateMyPharmacy,
  updateMedicine,
  updateReservation,
  fetchPharmaciesAdmin,
  approvePharmacy,
  updatePharmacyAdmin,
  deletePharmacyAdmin,
} from './api';

import AOS from 'aos';
import 'aos/dist/aos.css';
import ScrollToTop from './components/ScrollToTop';
import AccessibilityWidget from './components/AccessibilityWidget';
import LanguageSwitcher from './components/LanguageSwitcher';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ReservationModal from './components/ReservationModal';
import PageLoader from './components/PageLoader';
import FloatingChat from './components/FloatingChat';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PharmaciesPage from './pages/PharmaciesPage';
import PharmacyDetailPage from './pages/PharmacyDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrescriptionUploadPage from './pages/PrescriptionUploadPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import OtpLoginPage from './pages/OtpLoginPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import RegisterPage from './pages/RegisterPage';
import PharmacyRegisterPage from './pages/PharmacyRegisterPage';
import StaffPortalPage from './pages/StaffPortalPage';
import AdminPage from './pages/AdminPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ProtectedRoleRoute from './pages/ProtectedRoleRoute';
import { MEDICINE_SEED, PHARMACY_SEED } from './data/demoCatalog';

const normalizePharmacy = (pharmacy) => ({
  ...pharmacy,
  id: pharmacy.id || pharmacy._id,
});

const VITAMIN_C_IMAGES = [
  '/images/medicines/vitamin-c-xonce-red.png',
  '/images/medicines/vitamin-c-xonce-orange.png',
  '/images/medicines/vitamin-c-viogenesis.png',
];

const AMLODIPINE_5MG_IMAGES = [
  '/images/medicines/amlodipine-5mg-teva.png',
  '/images/medicines/amlodipine-5mg-amlosalt.png',
];

const AMOXICILLIN_500MG_IMAGES = [
  '/images/medicines/amoxicillin-500mg-exeter.png',
  '/images/medicines/amoxicillin-500mg-wellmoxy.png',
  '/images/medicines/amoxicillin-500mg-capsules.png',
];

const ANTISEPTIC_CREAM_IMAGES = [
  '/images/medicines/antiseptic-cream-betadine.png',
  '/images/medicines/antiseptic-cream-himalaya.png',
];

const GENERIC_ORAL_SOLID_IMAGES = [
  '/images/medicines/generic-capsules-orange.png',
  '/images/medicines/tablets-capsules.png',
];

const GENERIC_TOPICAL_IMAGES = [
  '/images/medicines/topical-tubes.png',
  '/images/medicines/generic-cream-application.png',
];

const getStableImageIndex = (value, imageCount) => {
  const hash = String(value || '').split('').reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0,
    0,
  );
  return hash % imageCount;
};

const getMedicineFallbackImage = (medicine) => {
  const form = String(medicine.productForm || '').toLowerCase();
  const name = String(medicine.name || '').toLowerCase();

  if (/suspension|solution|syrup|liquid/.test(`${form} ${name}`)) {
    return '/images/medicines/oral-liquid.png';
  }
  if (/cream|gel|ointment|topical/.test(`${form} ${name}`)) {
    return '/images/medicines/topical-tubes.png';
  }
  if (/inhaler|nasal spray|spray/.test(`${form} ${name}`)) {
    return '/images/medicines/inhaler-spray.png';
  }
  if (/eye drop|drop/.test(`${form} ${name}`)) {
    return '/images/medicines/medicine-drops.png';
  }
  if (/injection|vial|insulin/.test(`${form} ${name}`)) {
    return '/images/medicines/injection-vial.png';
  }
  if (/powder|sachet|rehydration/.test(`${form} ${name}`)) {
    return '/images/medicines/medicine-sachets.png';
  }

  return '/images/medicines/tablets-capsules.png';
};

const getMedicineImage = (medicine) => {
  const medicineName = String(medicine.name || '');
  const productForm = String(medicine.productForm || '').trim().toLowerCase();
  const currentImage = String(medicine.image || '');
  const identity = [
    medicine.id || medicine._id,
    medicine.pharmacy || medicine.pharmacyName,
    medicineName,
  ].filter(Boolean).join('|');

  if (/clotrimazole\s*1\s*%/i.test(medicineName)) {
    return '/images/medicines/clotrimazole-cream-1-percent.png';
  }

  if (/amlodipine\s*5\s*mg/i.test(medicineName)) {
    return AMLODIPINE_5MG_IMAGES[
      getStableImageIndex(identity, AMLODIPINE_5MG_IMAGES.length)
    ];
  }

  if (/amoxicillin\s*500\s*mg/i.test(medicineName)) {
    return AMOXICILLIN_500MG_IMAGES[
      getStableImageIndex(identity, AMOXICILLIN_500MG_IMAGES.length)
    ];
  }

  if (/antiseptic\s*cream/i.test(medicineName)) {
    return ANTISEPTIC_CREAM_IMAGES[
      getStableImageIndex(identity, ANTISEPTIC_CREAM_IMAGES.length)
    ];
  }

  if (/vitamin\s*c/i.test(medicineName)) {
    return VITAMIN_C_IMAGES[getStableImageIndex(identity, VITAMIN_C_IMAGES.length)];
  }

  if (
    /^(tablet|capsule|softgel capsule)$/.test(productForm)
    && (!currentImage || currentImage === '/images/medicines/tablets-capsules.png')
  ) {
    return GENERIC_ORAL_SOLID_IMAGES[
      getStableImageIndex(identity, GENERIC_ORAL_SOLID_IMAGES.length)
    ];
  }

  if (
    /^(cream|gel|ointment)$/.test(productForm)
    && (!currentImage || currentImage === '/images/medicines/topical-tubes.png')
  ) {
    return GENERIC_TOPICAL_IMAGES[
      getStableImageIndex(identity, GENERIC_TOPICAL_IMAGES.length)
    ];
  }

  return medicine.image || getMedicineFallbackImage(medicine);
};

const normalizeMedicine = (medicine) => ({
  ...medicine,
  id: medicine.id || medicine._id,
  pharmacy: medicine.pharmacy || medicine.pharmacyName,
  pharmacyId: medicine.pharmacyId || medicine.pharmacy_id,
  image: getMedicineImage(medicine),
});

const normalizeReservation = (reservation) => ({
  ...reservation,
  id: reservation.id || reservation._id,
  pharmacy: reservation.pharmacy || reservation.pharmacyName,
});

const EMERGENCY_STATUSES = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

const normalizeEmergencyOrder = (order) => ({
  ...order,
  id: order.id || order._id,
  status: EMERGENCY_STATUSES[String(order.status || 'Pending').trim().toLowerCase()] || 'Pending',
});

const normalizeUser = (user) => ({
  ...user,
  id: user.id || user._id,
});

const normalizePharmacyName = (value) => String(value || '').trim().toLowerCase();

const belongsToPharmacy = (item, user) => {
  if (!item || !user || user.role !== 'pharmacy') {
    return false;
  }

  const itemPharmacyId = item.pharmacyId || item.pharmacy_id;
  const userPharmacyId = user.pharmacyId;
  const itemPharmacyName = item.pharmacy || item.pharmacyName || item.preferredPharmacy;
  const userPharmacyName = user.pharmacyName;

  const idsMatch =
    itemPharmacyId &&
    userPharmacyId &&
    String(itemPharmacyId) === String(userPharmacyId);
  const namesMatch =
    itemPharmacyName &&
    userPharmacyName &&
    normalizePharmacyName(itemPharmacyName) === normalizePharmacyName(userPharmacyName);

  return Boolean(idsMatch || namesMatch);
};

const canViewEmergencyOrder = (order, user) => {
  if (user?.role === 'admin') {
    return true;
  }

  if (user?.role !== 'pharmacy') {
    return false;
  }

  return !order?.preferredPharmacy || belongsToPharmacy(order, user);
};

// ScrollToTop moved to ./components/ScrollToTop.js

// Navbar moved to ./components/Navbar.js

// Footer moved to ./components/Footer.js

// HomePage moved to ./pages/HomePage.js

// SearchPage moved to ./pages/SearchPage.js

// PharmaciesPage moved to ./pages/PharmaciesPage.js

// PharmacyDetailPage moved to ./pages/PharmacyDetailPage.js

// AboutPage moved to ./pages/AboutPage.js

// ContactPage moved to ./pages/ContactPage.js

// OtpLoginPage moved to ./pages/OtpLoginPage.js

// AdminPage moved to ./pages/AdminPage.js

// ReservationModal moved to ./components/ReservationModal.js


// MedicineDetailsModal moved to ./components/MedicineDetailsModal.js

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  // Remove any stale keys that were previously saved to localStorage
  localStorage.removeItem('medfinder_auth_token');
  localStorage.removeItem('medfinder_auth_user');

  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('medfinder_auth_user');
      return stored ? normalizeUser(JSON.parse(stored)) : null;
    } catch (error) {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('medfinder_auth_token') || '');
  const [isAuthChecking, setIsAuthChecking] = useState(() => Boolean(sessionStorage.getItem('medfinder_auth_token')));
  const [pharmacies, setPharmacies] = useState(PHARMACY_SEED.map(normalizePharmacy));
  const [medicines, setMedicines] = useState(MEDICINE_SEED.map(normalizeMedicine));
  const [reservations, setReservations] = useState([]);
  const [emergencyOrders, setEmergencyOrders] = useState([]);
  const [emergencyOrdersLoading, setEmergencyOrdersLoading] = useState(false);
  const [emergencyOrdersError, setEmergencyOrdersError] = useState('');
  const [contactMessages, setContactMessages] = useState([]);
  const [pharmacyProfile, setPharmacyProfile] = useState(null);
  const [allPharmaciesAdmin, setAllPharmaciesAdmin] = useState([]);

  // AOS — init once, refresh on every route change
  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60, delay: 0 });
  }, []);
  useEffect(() => {
    const t = setTimeout(() => AOS.refreshHard(), 80);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const getDashboardPathByRole = (role) => {
    if (role === 'admin') {
      return '/admin/dashboard';
    }

    if (role === 'pharmacy') {
      return '/pharmacy/dashboard';
    }

    return '/patient/dashboard';
  };

  useEffect(() => {
    let isMounted = true;

    fetchPharmacies()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setPharmacies(data.map(normalizePharmacy));
        }
      })
      .catch(() => {});

    fetchMedicines()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setMedicines(data.map(normalizeMedicine));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken) {
      setPharmacyProfile(null);
      setIsAuthChecking(false);
      return;
    }

    let isMounted = true;
    setIsAuthChecking(true);
    getMe(authToken)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        if (data?.user) {
          const normalized = normalizeUser(data.user);
          setAuthUser(normalized);
          sessionStorage.setItem('medfinder_auth_user', JSON.stringify(normalized));
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        if (error?.status === 401 || error?.status === 403) {
          setAuthUser(null);
          setAuthToken('');
          sessionStorage.removeItem('medfinder_auth_user');
          sessionStorage.removeItem('medfinder_auth_token');
        }
      })
      .finally(() => {
        if (isMounted) setIsAuthChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  useEffect(() => {
    if (!authToken || authUser?.role !== 'pharmacy') {
      setPharmacyProfile(null);
      return;
    }

    let isMounted = true;

    fetchMyPharmacy(authToken)
      .then((data) => {
        if (isMounted && data) {
          setPharmacyProfile(normalizePharmacy(data));
        }
      })
      .catch(() => {
        if (isMounted) {
          setPharmacyProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authToken, authUser?.role]);

  useEffect(() => {
    if (!authToken || !authUser) {
      setReservations([]);
      setEmergencyOrders([]);
      setEmergencyOrdersLoading(false);
      setEmergencyOrdersError('');
      setContactMessages([]);
      return;
    }

    let isMounted = true;

    const loadReservations = () => {
      fetchReservations(authToken)
        .then((data) => {
          if (isMounted && Array.isArray(data)) setReservations(data.map(normalizeReservation));
        })
        .catch(() => {});
    };

    loadReservations();
    const reservationRefresh = authUser.role === 'pharmacy' || authUser.role === 'admin'
      ? setInterval(loadReservations, 10000)
      : null;

    const canLoadEmergencyOrders = authUser.role === 'pharmacy' || authUser.role === 'admin';
    const loadEmergencyOrders = () => {
      if (!canLoadEmergencyOrders) return;
      setEmergencyOrdersLoading(true);
      fetchEmergencyOrders(authToken)
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setEmergencyOrders(data.map(normalizeEmergencyOrder));
            setEmergencyOrdersError('');
          }
        })
        .catch((error) => {
          if (isMounted) {
            setEmergencyOrdersError(error?.message || 'Unable to load emergency requests.');
          }
        })
        .finally(() => {
          if (isMounted) setEmergencyOrdersLoading(false);
        });
    };

    loadEmergencyOrders();
    const emergencyRefresh = canLoadEmergencyOrders
      ? setInterval(loadEmergencyOrders, 5000)
      : null;

    const refreshStaffData = () => {
      if (document.visibilityState === 'visible') {
        loadReservations();
        loadEmergencyOrders();
      }
    };
    window.addEventListener('focus', refreshStaffData);
    document.addEventListener('visibilitychange', refreshStaffData);

    if (authUser.role === 'admin') {
      fetchContactMessages(authToken)
        .then((data) => {
          if (isMounted && Array.isArray(data)) setContactMessages(data);
        })
        .catch(() => {});

      fetchPharmaciesAdmin(authToken)
        .then((data) => {
          if (isMounted && Array.isArray(data)) setAllPharmaciesAdmin(data);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
      if (reservationRefresh) clearInterval(reservationRefresh);
      if (emergencyRefresh) clearInterval(emergencyRefresh);
      window.removeEventListener('focus', refreshStaffData);
      document.removeEventListener('visibilitychange', refreshStaffData);
    };
  }, [authToken, authUser]);

  const handleAuthSuccess = (response) => {
    const normalizedUser = normalizeUser(response.user);
    setAuthUser(normalizedUser);
    setAuthToken(response.token);
    sessionStorage.setItem('medfinder_auth_user', JSON.stringify(normalizedUser));
    sessionStorage.setItem('medfinder_auth_token', response.token);

    navigate(getDashboardPathByRole(normalizedUser.role), { replace: true });
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken('');
    setPharmacyProfile(null);
    setAllPharmaciesAdmin([]);
    sessionStorage.removeItem('medfinder_auth_user');
    sessionStorage.removeItem('medfinder_auth_token');
  };

  const handleProfileUpdate = (updatedUser) => {
    const normalized = normalizeUser(updatedUser);
    setAuthUser(normalized);
    sessionStorage.setItem('medfinder_auth_user', JSON.stringify(normalized));
  };

  const handlePharmacyProfileSave = async (payload) => {
    if (!authToken) {
      return false;
    }

    try {
      const updated = await updateMyPharmacy(payload, authToken);
      const normalized = normalizePharmacy(updated);
      setPharmacyProfile(normalized);
      // Re-fetch the full pharmacies list so the home page reflects the saved changes
      fetchPharmacies()
        .then((data) => { if (Array.isArray(data)) setPharmacies(data.map(normalizePharmacy)); })
        .catch(() => {});
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleMedicineCreate = async (payload) => {
    if (!authToken) {
      return false;
    }

    try {
      const created = await createMedicine(payload, authToken);
      setMedicines((prev) => [normalizeMedicine(created), ...prev]);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleMedicineUpdate = async (id, payload) => {
    if (!authToken) {
      return false;
    }

    const currentMedicine = medicines.find((item) => String(item.id) === String(id));
    if (authUser?.role === 'pharmacy' && !belongsToPharmacy(currentMedicine, authUser)) {
      return false;
    }

    try {
      const updated = await updateMedicine(id, payload, authToken);
      setMedicines((prev) => prev.map((item) => (item.id === id ? normalizeMedicine(updated) : item)));
      // Re-fetch to sync any server-side transformations back to state
      fetchMedicines()
        .then((data) => { if (Array.isArray(data)) setMedicines(data.map(normalizeMedicine)); })
        .catch(() => {});
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleMedicineDelete = async (id) => {
    if (!authToken) {
      return false;
    }

    const currentMedicine = medicines.find((item) => String(item.id) === String(id));
    if (authUser?.role === 'pharmacy' && !belongsToPharmacy(currentMedicine, authUser)) {
      return false;
    }

    try {
      await deleteMedicine(id, authToken);
      setMedicines((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCreateReservation = async (payload) => {
    if (!authToken) {
      return false;
    }

    try {
      const created = await createReservation(payload, authToken);
      setReservations((prev) => [normalizeReservation(created), ...prev]);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCreatePrescriptionOrder = async (payload) => {
    if (!authToken) return { error: 'Please sign in before placing an order.' };

    try {
      const created = normalizeReservation(await createReservation(payload, authToken));
      setReservations((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      return { error: error.message || 'Unable to create reservation.' };
    }
  };

  const handleReservationStatusChange = async (id, status, extra = {}) => {
    if (!authToken) return;
    const currentReservation = reservations.find((item) => String(item.id) === String(id));
    if (authUser?.role === 'pharmacy' && !belongsToPharmacy(currentReservation, authUser)) {
      return;
    }
    try {
      const updated = await updateReservation(id, { status, ...extra }, authToken);
      setReservations((prev) => prev.map((item) => (item.id === id ? normalizeReservation(updated) : item)));
    } catch {}
  };

  const handleCancelReservation = async (id) => {
    if (!authToken) return 'Not authenticated.';
    try {
      const updated = await updateReservation(id, { status: 'Cancelled' }, authToken);
      setReservations((prev) => prev.map((item) => (item.id === id ? normalizeReservation(updated) : item)));
      return true;
    } catch (error) {
      return error.message || 'Failed to cancel.';
    }
  };

  const handleConfirmReservationReceived = async (id) => {
    if (!authToken) return 'Not authenticated.';
    try {
      const updated = await updateReservation(id, { status: 'Delivered' }, authToken);
      setReservations((prev) => prev.map((item) => (
        String(item.id) === String(id) ? normalizeReservation(updated) : item
      )));
      return true;
    } catch (error) {
      return error.message || 'Failed to confirm receipt.';
    }
  };

  const handleApprovePharmacy = async (id, payload) => {
    if (!authToken) return;
    try {
      const updated = await approvePharmacy(id, payload, authToken);
      setAllPharmaciesAdmin((prev) => prev.map((p) => (String(p._id) === String(id) ? { ...p, ...updated } : p)));
    } catch {}
  };

  const handleAdminUpdatePharmacy = async (id, payload) => {
    if (!authToken) return false;
    try {
      const updated = await updatePharmacyAdmin(id, payload, authToken);
      setAllPharmaciesAdmin((prev) => prev.map((p) => (String(p._id) === String(id) ? { ...p, ...updated } : p)));
      setPharmacies((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updated } : p)));
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleAdminDeletePharmacy = async (id) => {
    if (!authToken) return false;
    try {
      await deletePharmacyAdmin(id, authToken);
      setAllPharmaciesAdmin((prev) => prev.filter((p) => String(p._id) !== String(id)));
      setPharmacies((prev) => prev.filter((p) => String(p.id) !== String(id)));
      setMedicines((prev) => prev.filter((m) => String(m.pharmacyId) !== String(id)));
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEmergencyOrderUpdate = async (id, payload) => {
    if (!authToken) return;
    const currentOrder = emergencyOrders.find((item) => String(item._id || item.id) === String(id));
    if (authUser?.role === 'pharmacy' && !canViewEmergencyOrder(currentOrder, authUser)) {
      return;
    }
    try {
      const updated = await updateEmergencyOrder(id, payload, authToken);
      setEmergencyOrders((prev) => prev.map((item) => (
        String(item._id || item.id) === String(id) ? normalizeEmergencyOrder(updated) : item
      )));
      setEmergencyOrdersError('');
      return true;
    } catch (error) {
      setEmergencyOrdersError(error?.message || 'Unable to update the emergency request.');
      return false;
    }
  };

  const handleContactMarkRead = async (id) => {
    if (!authToken) return;
    try {
      const updated = await markContactRead(id, authToken);
      setContactMessages((prev) => prev.map((m) => (m._id === id ? updated : m)));
    } catch {}
  };

  const handleReservationRemove = async (id) => {
    if (!authToken) {
      return;
    }

    const currentReservation = reservations.find((item) => String(item.id) === String(id));
    if (authUser?.role === 'pharmacy' && !belongsToPharmacy(currentReservation, authUser)) {
      return;
    }

    try {
      await deleteReservation(id, authToken);
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {}
  };

  const handleToggleAvailability = async (med) => {
    if (!authToken) {
      return;
    }

    if (authUser?.role === 'pharmacy' && !belongsToPharmacy(med, authUser)) {
      return;
    }

    try {
      const updated = await updateMedicine(med.id, { available: !med.available }, authToken);
      setMedicines((prev) => prev.map((item) => (item.id === med.id ? normalizeMedicine(updated) : item)));
    } catch (error) {}
  };

  const canReserve = authUser?.role === 'user';
  const isPortalPage = [
    '/login',
    '/register',
    '/pharmacy/login',
    '/pharmacy/register',
    '/admin/login',
    '/pharmacy/dashboard',
    '/admin/dashboard',
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const visibleMedicines = authUser?.role === 'pharmacy'
    ? medicines.filter((item) => belongsToPharmacy(item, authUser))
    : medicines;
  const visibleReservations = authUser?.role === 'pharmacy'
    ? reservations.filter((item) => belongsToPharmacy(item, authUser))
    : reservations;
  const visibleEmergencyOrders = authUser?.role === 'pharmacy'
    ? emergencyOrders.filter((item) => canViewEmergencyOrder(item, authUser))
    : emergencyOrders;

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <PageLoader />
      <ScrollToTop />
      <AccessibilityWidget />
      <LanguageSwitcher />
      {!isPortalPage && <Navbar authUser={isAuthChecking ? null : authUser} onLogout={handleLogout} />}

      <main key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage pharmacies={pharmacies} />} />
          <Route
            path="/search"
            element={
              <SearchPage
                medicines={medicines}
                pharmacies={pharmacies}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onReserve={setSelectedMed}
                canReserve={canReserve}
                onRequireLogin={() => navigate('/login')}
              />
            }
          />
          <Route
            path="/pharmacies"
            element={<PharmaciesPage pharmacies={pharmacies} maxDistance={maxDistance} setMaxDistance={setMaxDistance} />}
          />
          <Route
            path="/pharmacies/:slug"
            element={<PharmacyDetailPage medicines={medicines} pharmacies={pharmacies} />}
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/assistant" element={<AIAssistantPage pharmacies={pharmacies} medicines={medicines} />} />
          <Route
            path="/order-your-prescription"
            element={
              <ProtectedRoleRoute authUser={authUser} isAuthChecking={isAuthChecking} allowedRoles={['user']} redirectTo="/login">
                <PrescriptionUploadPage
                  pharmacies={pharmacies}
                  medicines={medicines}
                  authUser={authUser}
                  onCreatePrescriptionOrder={handleCreatePrescriptionOrder}
                />
              </ProtectedRoleRoute>
            }
          />
          <Route
            path="/prescription-upload"
            element={
              <ProtectedRoleRoute authUser={authUser} isAuthChecking={isAuthChecking} allowedRoles={['user']} redirectTo="/login">
                <PrescriptionUploadPage
                  pharmacies={pharmacies}
                  medicines={medicines}
                  authUser={authUser}
                  onCreatePrescriptionOrder={handleCreatePrescriptionOrder}
                />
              </ProtectedRoleRoute>
            }
          />
          <Route path="/track-order" element={<OrderTrackingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/staff" element={<StaffPortalPage />} />
          <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
          <Route
            path="/login"
            element={<OtpLoginPage role="user" pharmacies={pharmacies} onAuthSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/dashboard"
            element={
              authUser ? <Navigate to={getDashboardPathByRole(authUser.role)} replace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoleRoute authUser={authUser} isAuthChecking={isAuthChecking} allowedRoles={['user']} redirectTo="/login">
                <PatientDashboardPage
                  authUser={authUser}
                  authToken={authToken}
                  pharmacies={pharmacies}
                  medicines={medicines}
                  reservations={visibleReservations}
                  onLogout={handleLogout}
                  onProfileUpdate={handleProfileUpdate}
                  onCancelReservation={handleCancelReservation}
                  onConfirmReservationReceived={handleConfirmReservationReceived}
                  onCreatePrescriptionOrder={handleCreatePrescriptionOrder}
                />
              </ProtectedRoleRoute>
            }
          />
          <Route
            path="/pharmacy/login"
            element={<OtpLoginPage role="pharmacy" pharmacies={pharmacies} onAuthSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/admin/login"
            element={<OtpLoginPage role="admin" pharmacies={pharmacies} onAuthSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/pharmacy"
            element={<Navigate to={authUser?.role === 'pharmacy' ? '/pharmacy/dashboard' : '/pharmacy/login'} replace />}
          />
          <Route
            path="/admin"
            element={<Navigate to={authUser?.role === 'admin' ? '/admin/dashboard' : '/admin/login'} replace />}
          />
          <Route
            path="/pharmacy/dashboard"
            element={
              <ProtectedRoleRoute authUser={authUser} isAuthChecking={isAuthChecking} allowedRoles={['pharmacy']} redirectTo="/pharmacy/login">
                <AdminPage
                  medicines={visibleMedicines}
                  reservations={visibleReservations}
                  emergencyOrders={visibleEmergencyOrders}
                  emergencyOrdersLoading={emergencyOrdersLoading}
                  emergencyOrdersError={emergencyOrdersError}
                  authUser={authUser}
                  pharmacyProfile={pharmacyProfile}
                  onToggleAvailability={handleToggleAvailability}
                  onMedicineUpdate={handleMedicineUpdate}
                  onMedicineCreate={handleMedicineCreate}
                  onMedicineDelete={handleMedicineDelete}
                  onPharmacyProfileSave={handlePharmacyProfileSave}
                  onReservationStatusChange={handleReservationStatusChange}
                  onReservationRemove={handleReservationRemove}
                  onEmergencyOrderUpdate={handleEmergencyOrderUpdate}
                  onLogout={handleLogout}
                />
              </ProtectedRoleRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoleRoute authUser={authUser} isAuthChecking={isAuthChecking} allowedRoles={['admin']} redirectTo="/admin/login">
                <AdminPage
                  medicines={medicines}
                  reservations={reservations}
                  emergencyOrders={emergencyOrders}
                  emergencyOrdersLoading={emergencyOrdersLoading}
                  emergencyOrdersError={emergencyOrdersError}
                  contactMessages={contactMessages}
                  authUser={authUser}
                  pharmacyProfile={pharmacyProfile}
                  onToggleAvailability={handleToggleAvailability}
                  onMedicineUpdate={handleMedicineUpdate}
                  onMedicineCreate={handleMedicineCreate}
                  onMedicineDelete={handleMedicineDelete}
                  onPharmacyProfileSave={handlePharmacyProfileSave}
                  onReservationStatusChange={handleReservationStatusChange}
                  onReservationRemove={handleReservationRemove}
                  onEmergencyOrderUpdate={handleEmergencyOrderUpdate}
                  onContactMarkRead={handleContactMarkRead}
                  allPharmaciesAdmin={allPharmaciesAdmin}
                  onApprovePharmacy={handleApprovePharmacy}
                  onEditPharmacy={handleAdminUpdatePharmacy}
                  onDeletePharmacy={handleAdminDeletePharmacy}
                  onLogout={handleLogout}
                />
              </ProtectedRoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isPortalPage && <Footer />}

      {/* Floating AI chat — hidden on portal/dashboard pages */}
      {!isPortalPage && <FloatingChat />}

      <ReservationModal
        selectedMed={selectedMed}
        authUser={authUser}
        onClose={() => setSelectedMed(null)}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
        onCreateReservation={handleCreateReservation}
        pharmacies={pharmacies}
      />
    </div>
  );
}

export default function MedFinderApp() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  );
}
