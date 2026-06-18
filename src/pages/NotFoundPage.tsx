import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/20 blur-2xl rounded-full" />
            <div className="relative bg-rose-100 dark:bg-rose-900/20 rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tighter">
          404
        </h1>

        <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
          Page not found
        </p>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved. Check the URL and try again, or explore our other pages.
        </p>

        {/* Suggestions */}
        <div className="mb-8 space-y-3 text-left bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            You might want to:
          </p>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Check the URL spelling</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Return to the home page</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Browse events and discover</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
          >
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Link to="/events" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Explore Events
            </Link>
          </Button>
        </div>

        {/* Fun message */}
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
            "The event you're looking for is not in the universe... yet."
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
