import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Auth from './pages/Auth';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Community from './pages/Community';
import CraftAlongs from './pages/CraftAlongs';
import SkillBadges from './pages/SkillBadges';
import ProjectJournal from './pages/Projectjournal';
import PatternCatalog from './pages/Patterncatalog';
import PatternDetail from './pages/Patterndetail';
import PatternCreate from './pages/Patterncreate';
import UserProfile from './pages/Userprofile';
import SearchPage from './pages/Searchpage';
import DesignerShop from './pages/Designershop';
import Checkout, { PaymentSuccess, PaymentCancel } from './pages/Checkout';
import YarnStash from './pages/Yarnstash';
import Notebook from './pages/Notebook';
import GroupDetail from './pages/GroupDetail';
import ThreadDetail from './pages/ThreadDetail';
import CraftAlongDetail from './pages/CraftAlongDetail';
import Marketplace from './pages/Marketplace';
import MarketplaceCreate from './pages/MarketplaceCreate';
import MarketplaceDetail from './pages/MarketplaceDetail';
import MarketplaceFavorites from './pages/MarketplaceFavorites';
import SellerProfile from './pages/AuthorProfile';
import AuthorProfile from './pages/AuthorProfile';
import VisualSearch from './pages/VisualSearch';
import MarketplaceCheckout from './pages/MarketplaceCheckout';
import MarketplaceOrderChat from './pages/MarketplaceOrderChat';
import MarketplaceOrders from './pages/MarketplaceOrders';
import SearchUsers from './pages/SearchUsers';
import ScrollToTop from './components/ScrollToTop';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Redirect to /login instead of /
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/home" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
    
    {/* Protected routes - require login */}
    <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
    <Route path="/forums" element={<Navigate to="/community" replace />} />
    <Route path="/craft-alongs" element={<ProtectedRoute><CraftAlongs /></ProtectedRoute>} />
    <Route path="/badges" element={<ProtectedRoute><SkillBadges /></ProtectedRoute>} />
    <Route path="/projects" element={<ProtectedRoute><ProjectJournal /></ProtectedRoute>} />
    <Route path="/notebook" element={<ProtectedRoute><Notebook /></ProtectedRoute>} />

    {/* Pattern routes - require login */}
    <Route path="/patterns" element={<ProtectedRoute><PatternCatalog /></ProtectedRoute>} />
    <Route path="/patterns/create" element={<ProtectedRoute><PatternCreate /></ProtectedRoute>} />
    <Route path="/patterns/:id" element={<ProtectedRoute><PatternDetail /></ProtectedRoute>} />
    
    <Route path="/mon-profil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
    <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
    <Route path="/search/users" element={<ProtectedRoute><SearchUsers /></ProtectedRoute>} />

    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
    <Route path="/designers/:username" element={<ProtectedRoute><DesignerShop /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
    <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    <Route path="/payment-cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
    <Route path="/stash" element={<ProtectedRoute><YarnStash /></ProtectedRoute>} />
    
    {/* Marketplace routes */}
    <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
    <Route path="/marketplace/create" element={<ProtectedRoute><MarketplaceCreate /></ProtectedRoute>} />
    <Route path="/marketplace/yarn/:id" element={<ProtectedRoute><MarketplaceDetail /></ProtectedRoute>} />
    <Route path="/marketplace/needle/:id" element={<ProtectedRoute><MarketplaceDetail /></ProtectedRoute>} />
    <Route path="/marketplace/accessory/:id" element={<ProtectedRoute><MarketplaceDetail /></ProtectedRoute>} />
    <Route path="/marketplace/favorites" element={<ProtectedRoute><MarketplaceFavorites /></ProtectedRoute>} />
    <Route path="/marketplace/seller/:username" element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />
    <Route path="/marketplace/checkout" element={<ProtectedRoute><MarketplaceCheckout /></ProtectedRoute>} />
    <Route path="/marketplace/orders" element={<ProtectedRoute><MarketplaceOrders /></ProtectedRoute>} />
    <Route path="/marketplace/orders/:orderId" element={<ProtectedRoute><MarketplaceOrderChat /></ProtectedRoute>} />
    
    {/* Forum and groups */}
    <Route path="/forums/thread/:id" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
    <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
    <Route path="/craft-alongs/:id" element={<ProtectedRoute><CraftAlongDetail /></ProtectedRoute>} />
    
    <Route path="/visual-search" element={<ProtectedRoute><VisualSearch /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <ScrollToTop />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;