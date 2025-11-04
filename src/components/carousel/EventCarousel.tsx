import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  rating: number;
  price: string;
}

interface EventCarouselProps {
  events: Event[];
  autoPlayInterval?: number;
}

const EventCarousel: React.FC<EventCarouselProps> = ({ 
  events, 
  autoPlayInterval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlayInterval]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              handleNext();
            } else if (swipe > swipeConfidenceThreshold) {
              handlePrev();
            }
          }}
          className="absolute w-full h-full"
        >
          <Link 
            to={`/events/${events[currentIndex].id}`}
            className="block w-full h-full group"
          >
            <div className="relative w-full h-full">
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img
                  src={events[currentIndex].image}
                  alt={events[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="max-w-3xl">
                  {/* Category Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 mb-3 md:mb-4 flex-wrap"
                  >
                    <span className="px-3 py-1 md:px-4 md:py-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs md:text-sm font-medium rounded-full">
                      {events[currentIndex].category}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full">
                      <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs md:text-sm font-medium">{events[currentIndex].rating}</span>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 line-clamp-2"
                  >
                    {events[currentIndex].title}
                  </motion.h2>

                  {/* Event Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-6 text-white/90 mb-4 md:mb-6"
                  >
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base">
                        {new Date(events[currentIndex].date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base truncate max-w-[150px] sm:max-w-none">{events[currentIndex].location}</span>
                    </div>
                  </motion.div>

                  {/* Price */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="inline-block"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {events[currentIndex].price}
                    </div>
                    <div className="text-xs md:text-sm text-white/70 mt-1">Starting price</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default EventCarousel;
