import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index.tsx";
import Menu from "./pages/Menu.tsx";
import About from "./pages/About.tsx";
import Gallery from "./pages/Gallery.tsx";
import Reviews from "./pages/Reviews.tsx";
import Reservations from "./pages/Reservations.tsx";
import Order from "./pages/Order.tsx";
import Contact from "./pages/Contact.tsx";
import Auth from "./pages/Auth.tsx";
import Account from "./pages/Account.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";
import AdminManage from "./pages/AdminManage.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import Checkout from "./pages/Checkout.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/gallery" element={<Gallery />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/reviews" element={<Reviews />} />
              <Route path="/order" element={<Order />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:reference" element={<OrderConfirmation />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/manage" element={<AdminManage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
