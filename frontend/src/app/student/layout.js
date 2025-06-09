import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Toaster } from 'react-hot-toast';

export default function StudentLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" />
      <Header />
      <main className="flex-grow container mx-auto px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}